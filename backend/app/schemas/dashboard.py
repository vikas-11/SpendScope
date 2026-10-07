from decimal import Decimal
from pydantic import BaseModel

from app.schemas.expense import ExpenseRead


class CategoryTotal(BaseModel):
    category: str
    amount: Decimal
    percentage: float


class DailyTotal(BaseModel):
    day: str
    amount: Decimal


class DashboardSummary(BaseModel):
    month: str
    total_spent: Decimal
    previous_month_total: Decimal
    month_change_percent: float
    budget: Decimal
    remaining_budget: Decimal
    budget_used_percent: float
    transaction_count: int
    average_expense: Decimal
    top_category: str | None
    category_totals: list[CategoryTotal]
    daily_totals: list[DailyTotal]
    recent_expenses: list[ExpenseRead]
