# SpendScope — Private Expense Intelligence

SpendScope is a portfolio-grade full-stack expense tracker built from a small Python CSV tracker and redesigned as a secure multi-user financial workspace.

The project intentionally avoids the usual “sidebar + four dashboard cards” admin template. Its UI is built around a **monthly money story**, a large spending curve, a category cash-map, a personal ledger, and a dedicated budget lab.

## Highlights

- **Private multi-user accounts** — every expense belongs to one authenticated user.
- **JWT authentication** — register, login and protected API routes.
- **Ownership enforced in the backend** — another user cannot fetch, update or delete your expenses by guessing an ID.
- **Modern React UI** — React + Vite + Material UI with a custom editorial / financial design system.
- **Dashboard analytics** — monthly total, change vs previous month, average expense, category split, spending curve and recent transactions.
- **Personal ledger** — search, category filtering, month filtering, pagination, edit and delete.
- **Budget lab** — set a monthly budget and see budget utilization / remaining runway.
- **CSV import/export** — migrate old tracker data or take your data with you.
- **Dark / light themes**.
- **Responsive layout** for desktop, tablet and mobile.
- **FastAPI OpenAPI docs** at `/docs`.
- **Docker Compose** setup with PostgreSQL, FastAPI and React/Nginx.
- Original CLI project is preserved under `legacy-python-cli/` to show the evolution.

---

## Quality checks included

The project includes backend integration coverage for:

- registration, login, duplicate-account handling and protected routes
- strict per-user expense isolation
- expense create / edit / delete / search / category and month filters
- exact budget values such as **₹9,000** and **₹10,000** (no `+1` step issue)
- dashboard totals, remaining budget and category aggregation
- invalid month validation
- legacy CSV import, normalized CSV headers and private CSV export

Run the backend suite with:

```bash
cd backend
pytest -q
```

For the frontend, run a production build before deployment:

```bash
cd frontend
npm install
npm run build
```

---

## Tech Stack

### Frontend
- React 18
- Vite
- Material UI
- Recharts
- Axios
- React Router
- Day.js

### Backend
- Python 3.13
- FastAPI
- SQLAlchemy 2
- Pydantic 2
- JWT (PyJWT)
- Argon2 password hashing via `argon2-cffi`
- PostgreSQL in Docker / SQLite for local quick-start

---

## Project Structure

```text
SpendScope/
├── backend/
│   ├── app/
│   │   ├── api/            # auth, expenses, budget, dashboard endpoints
│   │   ├── core/           # config + security
│   │   ├── db/             # SQLAlchemy session/base
│   │   ├── models/         # User, Expense, Budget
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # dashboard aggregation logic
│   │   ├── main.py
│   │   └── seed.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── theme/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
├── legacy-python-cli/
├── docker-compose.yml
└── README.md
```

---

## Security / User Isolation

The most important rule in this project is that **Expense A only belongs to User A**.

All protected expense queries include the logged-in user's ID, for example:

```python
select(Expense).where(
    Expense.id == expense_id,
    Expense.user_id == current_user.id,
)
```

So even if User B manually calls `/api/expenses/10`, the API returns `404` when expense `10` belongs to User A.

Passwords are never stored in plain text; they are Argon2-hashed. JWT access tokens identify the authenticated user for protected requests.

---

# Option 1 — Quick local setup

## 1. Backend

From the project root:

```bash
cd backend
python -m venv .venv
```

### Windows PowerShell

```powershell
.\.venv\Scripts\Activate.ps1
```

Install packages:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
copy .env.example .env
```

Run FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

By default local development uses SQLite, so PostgreSQL is not required for this option.

## 2. Optional demo data

In another terminal, with the backend environment activated:

```bash
python -m app.seed
```

Demo credentials:

```text
demo@spendscope.dev
Demo@123
```

## 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Option 2 — Run everything with Docker

From the project root:

```bash
docker compose up --build
```

Then open:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/docs
```

Docker uses PostgreSQL automatically.

---

## Core API Routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Expenses

```text
GET    /api/expenses
POST   /api/expenses
PATCH  /api/expenses/{expense_id}
DELETE /api/expenses/{expense_id}
POST   /api/expenses/data/import
GET    /api/expenses/data/export
```

### Budget

```text
GET /api/budgets/{YYYY-MM}
PUT /api/budgets/{YYYY-MM}
```

### Dashboard

```text
GET /api/dashboard?month=YYYY-MM
```

---

## CSV Import

SpendScope accepts both its own export format and a simple version of the original tracker format.

Recommended columns:

```csv
title,category,amount,expense_date,payment_method,note,is_recurring
Groceries,Food,1850,2026-10-07,UPI,Weekly shopping,false
```

For an older file containing only:

```csv
name,category,amount
chai,Food,12
```

SpendScope maps `name -> title` and fills the remaining fields with sensible defaults.

---

## UI Direction

The design language is intentionally different from common admin dashboards:

- no permanent left sidebar
- no blue/teal corporate palette
- paper/ink base with **acid-lime + coral** accents
- large typographic monthly story instead of KPI-card overload
- theme-aware spending curve as the main visual narrative, with continuous daily plotting even when expenses exist on only one day
- ledger-first transactions screen
- dedicated circular “budget horizon” experience
- asymmetrical auth screen with abstract color fields

---

## Suggested GitHub Repository Description

> Private multi-user expense intelligence app built with React, Material UI, FastAPI, SQLAlchemy, JWT and PostgreSQL. Features analytics, budgets, CSV import/export, dark mode and strict per-user data isolation.

## Suggested Topics

`python` `fastapi` `react` `material-ui` `postgresql` `sqlalchemy` `jwt-authentication` `expense-tracker` `vite` `docker` `full-stack`

---

## Future Enhancements

- refresh-token rotation
- email verification / password reset
- category-level budgets
- recurring-expense scheduler
- receipt uploads
- downloadable PDF reports
- Redis-backed rate limiting
- Alembic production migrations
- CI pipeline for backend tests + frontend build

---
