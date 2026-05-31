"""
Smart Allocation Lab - Main FastAPI Application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Smart Allocation Lab API",
    description="Multi-asset portfolio analytics, optimization, and Monte Carlo simulation platform",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Import routers
from app.routers import assets, data, analytics, simulation, montecarlo, ml_insights, llm

# Include routers
app.include_router(assets.router, prefix="/api/assets", tags=["Assets"])
app.include_router(data.router, prefix="/api/data", tags=["Data"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["Simulation"])
app.include_router(montecarlo.router, prefix="/api/montecarlo", tags=["Monte Carlo"])
app.include_router(ml_insights.router, prefix="/api/ml", tags=["ML Insights"])
app.include_router(llm.router, prefix="/api/llm", tags=["LLM Insights"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Smart Allocation Lab API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
