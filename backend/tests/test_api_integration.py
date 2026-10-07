from io import BytesIO

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


def register(client: TestClient, name: str, email: str, password: str = "StrongPass123!"):
    response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": password},
    )
    assert response.status_code == 201, response.text
    return response.json()


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_authentication_and_duplicate_email(client: TestClient):
    payload = register(client, "User One", "one@example.com")
    assert payload["user"]["email"] == "one@example.com"
    assert payload["access_token"]

    duplicate = client.post(
        "/api/auth/register",
        json={"name": "Other", "email": "ONE@example.com", "password": "StrongPass123!"},
    )
    assert duplicate.status_code == 409

    login = client.post(
        "/api/auth/login",
        json={"email": "one@example.com", "password": "StrongPass123!"},
    )
    assert login.status_code == 200

    bad_login = client.post(
        "/api/auth/login",
        json={"email": "one@example.com", "password": "wrong-password"},
    )
    assert bad_login.status_code == 401

    protected = client.get("/api/expenses")
    assert protected.status_code == 401

    blank_name = client.post(
        "/api/auth/register",
        json={"name": "   ", "email": "blank@example.com", "password": "StrongPass123!"},
    )
    assert blank_name.status_code == 422


def test_user_isolation_expense_crud_filters_and_dashboard(client: TestClient):
    user_a = register(client, "Alice", "alice@example.com")
    user_b = register(client, "Bob", "bob@example.com")
    a_headers = auth(user_a["access_token"])
    b_headers = auth(user_b["access_token"])

    created = client.post(
        "/api/expenses",
        headers=a_headers,
        json={
            "title": "Dinner",
            "amount": 1500,
            "category": "Food",
            "expense_date": "2026-10-07",
            "payment_method": "UPI",
            "note": "Team dinner",
            "is_recurring": False,
        },
    )
    assert created.status_code == 201, created.text
    expense_id = created.json()["id"]

    second = client.post(
        "/api/expenses",
        headers=a_headers,
        json={
            "title": "Movie",
            "amount": 500,
            "category": "Entertainment",
            "expense_date": "2026-10-08",
            "payment_method": "Card",
            "note": None,
            "is_recurring": False,
        },
    )
    assert second.status_code == 201

    b_list = client.get("/api/expenses", headers=b_headers, params={"month": "2026-10"})
    assert b_list.status_code == 200
    assert b_list.json()["total"] == 0

    b_patch = client.patch(
        f"/api/expenses/{expense_id}",
        headers=b_headers,
        json={"amount": 1},
    )
    assert b_patch.status_code == 404
    b_delete = client.delete(f"/api/expenses/{expense_id}", headers=b_headers)
    assert b_delete.status_code == 404

    filtered = client.get(
        "/api/expenses",
        headers=a_headers,
        params={"month": "2026-10", "category": "Food", "search": "dinner"},
    )
    assert filtered.status_code == 200
    assert filtered.json()["total"] == 1
    assert filtered.json()["items"][0]["title"] == "Dinner"

    updated = client.patch(
        f"/api/expenses/{expense_id}",
        headers=a_headers,
        json={"amount": 1600, "note": "Updated"},
    )
    assert updated.status_code == 200
    assert updated.json()["amount"] == "1600.00"

    budget = client.put(
        "/api/budgets/2026-10",
        headers=a_headers,
        json={"month": "2026-10", "limit_amount": 10000},
    )
    assert budget.status_code == 200, budget.text
    assert budget.json()["limit_amount"] == "10000.00"

    dashboard = client.get("/api/dashboard", headers=a_headers, params={"month": "2026-10"})
    assert dashboard.status_code == 200, dashboard.text
    result = dashboard.json()
    assert result["total_spent"] == "2100.00"
    assert result["budget"] == "10000.00"
    assert result["remaining_budget"] == "7900.00"
    assert result["transaction_count"] == 2
    assert result["top_category"] == "Food"
    assert len(result["daily_totals"]) == 2

    deleted = client.delete(f"/api/expenses/{expense_id}", headers=a_headers)
    assert deleted.status_code == 204


def test_budget_month_validation_and_exact_round_numbers(client: TestClient):
    user = register(client, "Budget User", "budget@example.com")
    headers = auth(user["access_token"])

    for amount in (9000, 10000):
        response = client.put(
            "/api/budgets/2026-10",
            headers=headers,
            json={"month": "2026-10", "limit_amount": amount},
        )
        assert response.status_code == 200, response.text
        assert response.json()["limit_amount"] == f"{amount}.00"

    mismatch = client.put(
        "/api/budgets/2026-10",
        headers=headers,
        json={"month": "2026-11", "limit_amount": 10000},
    )
    assert mismatch.status_code == 400

    invalid_dashboard = client.get("/api/dashboard", headers=headers, params={"month": "2026-13"})
    assert invalid_dashboard.status_code == 422

    invalid_budget = client.get("/api/budgets/2026-13", headers=headers)
    assert invalid_budget.status_code == 422

    invalid_expenses = client.get("/api/expenses", headers=headers, params={"month": "2026-13"})
    assert invalid_expenses.status_code == 422


def test_csv_import_export_is_private(client: TestClient):
    user_a = register(client, "Importer", "importer@example.com")
    user_b = register(client, "Other", "other@example.com")
    a_headers = auth(user_a["access_token"])
    b_headers = auth(user_b["access_token"])

    csv_bytes = b"Tea,Food,120\nTaxi,Transport,350\n"
    imported = client.post(
        "/api/expenses/data/import",
        headers=a_headers,
        files={"file": ("legacy.csv", BytesIO(csv_bytes), "text/csv")},
    )
    assert imported.status_code == 200, imported.text
    assert imported.json() == {"imported": 2, "skipped": 0}

    a_list = client.get("/api/expenses", headers=a_headers)
    b_list = client.get("/api/expenses", headers=b_headers)
    assert a_list.json()["total"] == 2
    assert b_list.json()["total"] == 0

    exported = client.get("/api/expenses/data/export", headers=a_headers)
    assert exported.status_code == 200
    assert "Tea" in exported.text
    assert "Taxi" in exported.text

    b_export = client.get("/api/expenses/data/export", headers=b_headers)
    assert b_export.status_code == 200
    assert "Tea" not in b_export.text

    header_csv = b"Title, Category, Amount, Expense_Date, Payment_Method\nBook,Education,499,2026-10-07,Card\n"
    header_import = client.post(
        "/api/expenses/data/import",
        headers=a_headers,
        files={"file": ("mixed-header.csv", BytesIO(header_csv), "text/csv")},
    )
    assert header_import.status_code == 200, header_import.text
    assert header_import.json() == {"imported": 1, "skipped": 0}
