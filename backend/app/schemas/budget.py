from decimal import Decimal
from pydantic import BaseModel, Field


class BudgetUpsert(BaseModel):
    month: str = Field(pattern=r"^\d{4}-\d{2}$")
    limit_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)


class BudgetRead(BudgetUpsert):
    id: int
    user_id: int

    model_config = {"from_attributes": True}
