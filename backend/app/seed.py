from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models import Budget, Expense, User


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        email = "demo@spendscope.dev"
        user = db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(name="Demo User", email=email, hashed_password=hash_password("Demo@123"))
            db.add(user)
            db.flush()

        month = date.today().strftime("%Y-%m")
        existing_budget = db.scalar(select(Budget).where(Budget.user_id == user.id, Budget.month == month))
        if not existing_budget:
            db.add(Budget(user_id=user.id, month=month, limit_amount=Decimal("50000")))

        expense_count = db.query(Expense).filter(Expense.user_id == user.id).count()
        if expense_count == 0:
            samples = [
                ("Groceries", "Food", "1840", 1, "UPI"),
                ("Metro card", "Transport", "600", 2, "Card"),
                ("Cloud subscription", "Work", "1299", 4, "Card"),
                ("Dinner with friends", "Entertainment", "2200", 6, "UPI"),
                ("Electricity bill", "Bills", "3150", 8, "Net Banking"),
                ("Gym membership", "Health", "1800", 10, "UPI"),
                ("Coffee beans", "Food", "780", 12, "Cash"),
                ("Keyboard wrist rest", "Shopping", "950", 14, "Card"),
            ]
            today = date.today()
            for title, category, amount, days_ago, method in samples:
                db.add(
                    Expense(
                        user_id=user.id,
                        title=title,
                        category=category,
                        amount=Decimal(amount),
                        expense_date=today - timedelta(days=days_ago),
                        payment_method=method,
                        note="Demo seed data",
                    )
                )
        db.commit()
        print("Demo ready: demo@spendscope.dev / Demo@123")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
