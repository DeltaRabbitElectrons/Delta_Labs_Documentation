from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db
from app.routes import auth, pages, content, password_reset, chat, notes, sidebar, admin_auth, workspaces
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def _check_env_vars():
    from app.config import settings
    import os
    required_vars = [
        "MONGO_URI",
        "DATABASE_NAME",
        "SECRET_KEY",
        "GITHUB_TOKEN",
        "GITHUB_REPO",
        "VERCEL_DEPLOY_HOOK_URL",
        "BREVO_API_KEY",
        "EMAIL_FROM_ADDRESS",
    ]
    warnings = []
    for var in required_vars:
        if not getattr(settings, var, None) and not os.getenv(var):
            warnings.append(var)
    
    if warnings:
        logger.warning(f"WARNING: Missing required environment variables: {', '.join(warnings)}")
        logger.warning("Set missing vars in backend/.env to enable all features")

async def _ensure_default_workspaces():
    """Auto-seed the Documentation workspace if it doesn't exist."""
    from app.database import get_db
    from datetime import datetime
    db = get_db()
    if db is None:
        return
    try:
        existing = await db.portal_workspaces.find_one({"slug": "docs"})
        if not existing:
            now = datetime.utcnow()
            await db.portal_workspaces.insert_one({
                "name": "Documentation",
                "slug": "docs",
                "order": 0,
                "created_at": now,
                "updated_at": now,
            })
            logger.info("Auto-seeded default 'Documentation' workspace")
        # Ensure unique index on slug
        await db.portal_workspaces.create_index("slug", unique=True)
    except Exception as e:
        logger.warning(f"Workspace auto-seed check: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    _check_env_vars()
    logger.info("Connecting to database...")
    await connect_db()
    await _ensure_default_workspaces()
    yield
    logger.info("Closing database connection...")
    await close_db()

app = FastAPI(title='Delta Labs Docs API', lifespan=lifespan)

# Allow specific origins for development and production
# NOTE: allow_origins=["*"] with allow_credentials=True is INVALID per CORS spec.
# Browsers reject wildcard origins when credentials (cookies/auth headers) are used.
# Use allow_origin_regex to match all Vercel preview/production URLs.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
    )

app.include_router(auth.router,           prefix='/auth',         tags=['Auth'])
app.include_router(pages.router,          prefix='/pages',        tags=['Pages'])
app.include_router(content.router,        prefix='/content',      tags=['Content'])
app.include_router(password_reset.router, prefix='/auth',         tags=['Auth'])
app.include_router(chat.router,           prefix='/chat',         tags=['Chat'])
app.include_router(notes.router,          prefix='/notes',        tags=['Notes'])
app.include_router(sidebar.router)
app.include_router(admin_auth.router, tags=['Admin Auth'])
app.include_router(workspaces.router, prefix='/workspaces', tags=['Workspaces'])

@app.get('/')
async def root():
    return {"status": "Delta Labs Docs API is running — v3.0"}
