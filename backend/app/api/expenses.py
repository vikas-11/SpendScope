import csv
import io
from datetime import date
from decimal import Decimal, InvalidOperation

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.dates import parse_month
from app.db.session import get_db
from app.models import Expense, User
from app.schemas.expense import ExpenseCreate, ExpenseList, ExpenseRead, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=ExpenseList)
def list_expenses(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    month: str | None = Query(default=None, pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conditions = [Expense.user_id == current_user.id]
    if search:
        term = f"%{search.strip()}%"
        conditions.append(or_(Expense.title.ilike(term), Expense.note.ilike(term)))
    if category and category != "All":
        conditions.append(Expense.category == category)
    if month:
        year, month_number = parse_month(month)
        conditions.extend([func.extract("year", Expense.expense_date) == year, func.extract("month", Expense.expense_date) == month_number])

    total = db.scalar(select(func.count(Expense.id)).where(*conditions)) or 0
    items = db.scalars(
        select(Expense)
        .where(*conditions)
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return ExpenseList(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(
    payload: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = Expense(user_id=current_user.id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def owned_expense_or_404(expense_id: int, user_id: int, db: Session) -> Expense:
    expense = db.scalar(select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id))
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseRead)
def update_expense(
    expense_id: int,
    payload: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = owned_expense_or_404(expense_id, current_user.id, db)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = owned_expense_or_404(expense_id, current_user.id, db)
    db.delete(expense)
    db.commit()


@router.get("/data/export")
def export_expenses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expenses = db.scalars(
        select(Expense).where(Expense.user_id == current_user.id).order_by(Expense.expense_date.desc())
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["title", "category", "amount", "expense_date", "payment_method", "note", "is_recurring"])
    for expense in expenses:
        writer.writerow([
            expense.title,
            expense.category,
            expense.amount,
            expense.expense_date.isoformat(),
            expense.payment_method,
            expense.note or "",
            expense.is_recurring,
        ])
    output.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="spendscope-expenses.csv"'}
    return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)


@router.post("/data/import")
async def import_expenses(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a CSV file")

    max_bytes = 2 * 1024 * 1024
    raw_content = await file.read(max_bytes + 1)
    if len(raw_content) > max_bytes:
        raise HTTPException(status_code=413, detail="CSV file must be 2 MB or smaller")
    try:
        content = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV file must use UTF-8 encoding") from exc
    raw_rows = list(csv.reader(io.StringIO(content)))
    if not raw_rows:
        return {"imported": 0, "skipped": 0}

    normalized_header = [cell.strip().lower() for cell in raw_rows[0]]
    has_header = "amount" in normalized_header and ("category" in normalized_header)

    if has_header:
        reader = csv.DictReader(io.StringIO(content))
        rows = [
            {
                (key or "").strip().lower(): (value or "")
                for key, value in row.items()
            }
            for row in reader
        ]
    else:
        # Original CLI files were written without a header: name,category,amount
        rows = [
            {"name": row[0], "category": row[1], "amount": row[2]}
            for row in raw_rows
            if len(row) >= 3
        ]

    imported = 0
    skipped = 0
    today = date.today()

    for row in rows:
        try:
            title = (row.get("title") or row.get("name") or "Imported expense").strip()
            category = (row.get("category") or "Other").strip()
            amount = Decimal(str(row.get("amount", "0")).strip())
            expense_date = date.fromisoformat((row.get("expense_date") or row.get("date") or today.isoformat()).strip())
            if not title or amount <= 0:
                raise ValueError
            db.add(
                Expense(
                    user_id=current_user.id,
                    title=title,
                    amount=amount,
                    category=category,
                    expense_date=expense_date,
                    payment_method=(row.get("payment_method") or "Other").strip(),
                    note=(row.get("note") or "").strip() or None,
                    is_recurring=str(row.get("is_recurring", "false")).lower() in {"true", "1", "yes"},
                )
            )
            imported += 1
        except (ValueError, InvalidOperation, TypeError, IndexError):
            skipped += 1

    db.commit()
    return {"imported": imported, "skipped": skipped}
