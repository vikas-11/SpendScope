from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.dates import month_bounds, previous_month
from app.models import Budget, Expense
from app.schemas.dashboard import CategoryTotal, DailyTotal, DashboardSummary



def build_dashboard(db: Session, user_id: int, month: str) -> DashboardSummary:
    start, end = month_bounds(month)
    prev_start, prev_end = month_bounds(previous_month(month))

    expenses = db.scalars(
        select(Expense)
        .where(Expense.user_id == user_id, Expense.expense_date.between(start, end))
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
    ).all()

    prev_total = db.scalar(
        select(func.coalesce(func.sum(Expense.amount), 0)).where(
            Expense.user_id == user_id,
            Expense.expense_date.between(prev_start, prev_end),
        )
    ) or Decimal("0")

    total = sum((expense.amount for expense in expenses), Decimal("0"))
    budget_obj = db.scalar(select(Budget).where(Budget.user_id == user_id, Budget.month == month))
    budget = budget_obj.limit_amount if budget_obj else Decimal("0")
    remaining = budget - total if budget else Decimal("0")
    used = float((total / budget) * 100) if budget else 0.0

    if prev_total:
        change = float(((total - prev_total) / prev_total) * 100)
    else:
        change = 100.0 if total else 0.0

    category_map: dict[str, Decimal] = {}
    day_map: dict[str, Decimal] = {}
    for expense in expenses:
        category_map[expense.category] = category_map.get(expense.category, Decimal("0")) + expense.amount
        day_key = expense.expense_date.isoformat()
        day_map[day_key] = day_map.get(day_key, Decimal("0")) + expense.amount

    category_totals = [
        CategoryTotal(
            category=category,
            amount=amount,
            percentage=float((amount / total) * 100) if total else 0,
        )
        for category, amount in sorted(category_map.items(), key=lambda item: item[1], reverse=True)
    ]

    daily_totals = [DailyTotal(day=day, amount=amount) for day, amount in sorted(day_map.items())]
    average = (total / len(expenses)) if expenses else Decimal("0")

    return DashboardSummary(
        month=month,
        total_spent=total,
        previous_month_total=prev_total,
        month_change_percent=round(change, 2),
        budget=budget,
        remaining_budget=remaining,
        budget_used_percent=round(used, 2),
        transaction_count=len(expenses),
        average_expense=average,
        top_category=category_totals[0].category if category_totals else None,
        category_totals=category_totals,
        daily_totals=daily_totals,
        recent_expenses=expenses[:6],
    )
