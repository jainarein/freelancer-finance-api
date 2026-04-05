# Freelancer Finance API

A financial management application for Indian freelancers with GST tracking, invoice management, expense tracking, and tax calculations.

## Architecture

This project consists of two parts:

### Backend (FastAPI)
- **Location:** `/app`
- **Tech Stack:** FastAPI, SQLAlchemy, APScheduler, PostgreSQL
- **Features:**
  - JWT authentication
  - Invoice management API with auto GST calculation
  - Expense tracking with auto-categorization
  - Client management with risk scoring
  - Tax estimation (Section 44ADA)
  - Scheduled jobs for automated tasks

### Frontend (Next.js)
- **Location:** `/FrontEnd`
- **Tech Stack:** Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Features:**
  - Modern dashboard interface
  - Invoice creation and tracking
  - Expense management with categories
  - Client management with risk scores
  - Tax calculations (GST, Section 44ADA)
- **Auth:** JWT via FastAPI backend

## Getting Started

### Backend Setup

1. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Run database migrations:
   ```bash
   alembic upgrade head
   ```

5. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   
   Backend runs at: http://localhost:8000

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd FrontEnd
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Set NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run development server:
   ```bash
   npm run dev
   ```
   
   Frontend runs at: http://localhost:3000

## API Endpoints

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user profile

### Invoices
- `GET /invoices/` - List all invoices
- `POST /invoices/` - Create invoice (auto GST calculation)
- `GET /invoices/{id}` - Get invoice details
- `PATCH /invoices/{id}` - Update invoice
- `DELETE /invoices/{id}` - Delete invoice
- `GET /invoices/summary` - Invoice statistics

### Expenses
- `GET /expenses/` - List all expenses
- `POST /expenses/` - Create expense (auto-categorized)
- `GET /expenses/summary` - Expense breakdown
- `GET /expenses/tax-estimate` - Section 44ADA calculation

### Clients
- `GET /clients/` - List clients with risk scores
- `POST /clients/` - Add new client
- `GET /clients/{id}/risk` - Detailed risk analysis

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/freelancer_finance
SECRET_KEY=your-secret-key-here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Docker

Run the backend with Docker:

```bash
docker-compose up --build
```

## License

This project is licensed under the MIT License.

You are free to use, modify, and distribute this software with proper attribution.

See the LICENSE file for more details.

