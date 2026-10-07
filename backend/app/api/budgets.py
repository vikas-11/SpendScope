from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.dates import parse_month
from app.db.session import get_db
from app.models import Budget, User
from app.schemas.budget import BudgetRead, BudgetUpsert

router = APIRouter(prefix="/budgets", tags=["Budgets"])


@router.get("/{month}", response_model=BudgetRead | None)
def get_budget(
    month: str = Path(pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parse_month(month)
    return db.scalar(select(Budget).where(Budget.user_id == current_user.id, Budget.month == month))


@router.put("/{month}", response_model=BudgetRead)
def upsert_budget(
    payload: BudgetUpsert,
    month: str = Path(pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parse_month(month)
    if payload.month != month:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Budget month in the request body must match the URL month.",
        )

    budget = db.scalar(select(Budget).where(Budget.user_id == current_user.id, Budget.month == month))
    if budget:
        budget.limit_amount = payload.limit_amount
    else:
        budget = Budget(user_id=current_user.id, month=month, limit_amount=payload.limit_amount)
        db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget
