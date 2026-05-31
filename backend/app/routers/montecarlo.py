"""
Monte Carlo Router - Future Scenario Simulation
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import MonteCarloRequest, MonteCarloResponse
from app.services.montecarlo_service import MonteCarloService
from app.utils.sanitization import sanitize_data
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/simulate", response_model=MonteCarloResponse)
async def run_monte_carlo(request: MonteCarloRequest):
    """Run Monte Carlo simulation for portfolio"""
    try:
        # Convert to numpy arrays
        weights = np.array(request.weights)
        mean_returns = np.array(request.mean_returns)
        cov_matrix = np.array(request.cov_matrix)
        
        # Run simulation
        results = MonteCarloService.simulate_portfolio_paths(
            weights,
            mean_returns,
            cov_matrix,
            request.initial_value,
            request.time_horizon_days,
            request.num_simulations,
            request.return_model
        )
        
        sanitized_results = sanitize_data(results)
        
        return MonteCarloResponse(**sanitized_results)
        
    except Exception as e:
        logger.error(f"Error running Monte Carlo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monte Carlo simulation failed: {str(e)}")


@router.post("/compare")
async def compare_scenarios(scenarios: list):
    """Compare multiple Monte Carlo scenarios"""
    try:
        comparison = MonteCarloService.compare_scenarios(scenarios)
        sanitized_comparison = sanitize_data(comparison)
        return sanitized_comparison
        
    except Exception as e:
        logger.error(f"Error comparing scenarios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
