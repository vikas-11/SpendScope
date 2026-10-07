from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class ExpenseBase(BaseModel):
    title: str = Field(min_length=1, max_length=140)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    category: str = Field(min_length=1, max_length=60)
    expense_date: date
    payment_method: str = Field(default="UPI", max_length=40)
    note: str | None = Field(default=None, max_length=500)
    is_recurring: bool = False

    @field_validator("title", "category", "payment_method")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value cannot be blank")
        return cleaned

    @field_validator("note")
    @classmethod
    def clean_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=140)
    amount: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    category: str | None = Field(default=None, min_length=1, max_length=60)
    expense_date: date | None = None
    payment_method: str | None = Field(default=None, max_length=40)
    note: str | None = Field(default=None, max_length=500)
    is_recurring: bool | None = None

    @field_validator("title", "category", "payment_method")
    @classmethod
    def strip_optional_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value cannot be blank")
        return cleaned

    @field_validator("note")
    @classmethod
    def clean_optional_note(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ExpenseRead(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseList(BaseModel):
    items: list[ExpenseRead]
    total: int
    page: int
    page_size: int
