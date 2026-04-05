from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from contextlib import asynccontextmanager
from sqlalchemy import text
from app.config import get_settings
from app.database import engine
from app.routers import auth, invoices, expenses, clients
from app.scheduler.jobs import start_scheduler, stop_scheduler

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connected successfully")
    except Exception as e:
        print(f"Database connection failed: {e}")

    start_scheduler()
    yield
    stop_scheduler()
    print("Shutting down...")

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Financial management API for Indian freelancers",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(invoices.router)
app.include_router(expenses.router)
app.include_router(clients.router)

@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "app": settings.app_name}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

@app.get("/scheduler/jobs", tags=["Admin"])
def list_jobs():
    """See all scheduled jobs and their next run times"""
    jobs = []
    for job in start_scheduler.__self__.get_jobs() if hasattr(start_scheduler, '__self__') else []:
        jobs.append({
            "id": job.id,
            "next_run": str(job.next_run_time)
        })
    return {"jobs": jobs}

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=settings.app_name,
        version="1.0.0",
        description="Financial management API for Indian freelancers",
        routes=app.routes,
    )
    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]
    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi
