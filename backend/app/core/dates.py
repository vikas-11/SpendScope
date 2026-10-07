from calendar import monthrange
from datetime import date

from fastapi import HTTPException, status


def parse_month(month: str) -> tuple[int, int]:
    """Parse YYYY-MM and reject impossible calendar months with a client error."""
    try:
        year_text, month_text = month.split("-", maxsplit=1)
        if len(year_text) != 4 or len(month_text) != 2:
            raise ValueError
        year = int(year_text)
        month_number = int(month_text)
        if year < 1 or not 1 <= month_number <= 12:
            raise ValueError
        return year, month_number
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Month must be a valid value in YYYY-MM format.",
        )


def month_bounds(month: str) -> tuple[date, date]:
    year, month_number = parse_month(month)
    return date(year, month_number, 1), date(year, month_number, monthrange(year, month_number)[1])


def previous_month(month: str) -> str:
    year, month_number = parse_month(month)
    if month_number == 1:
        return f"{year - 1:04d}-12"
    return f"{year:04d}-{month_number - 1:02d}"
