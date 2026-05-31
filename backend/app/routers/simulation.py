"""
Simulation Router - Portfolio Allocation Simulation
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import SimulationRequest, SimulationResponse, PortfolioSimResult
from app.services.simulation_service import SimulationService
from app.utils.sanitization import sanitize_data
import pandas as pd
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/run", response_model=SimulationResponse)
async def run_simulation(request: SimulationRequest):
    """Run portfolio allocation simulation"""
    try:
        # Convert returns_data to DataFrame
        returns_df = pd.DataFrame(request.returns_data)
        
        # Run simulation
        results = SimulationService.run_simulation(
            returns_df,
            request.num_simulations,
            request.risk_free_rate,
            request.benchmark_return,
            request.constraints
        )
        
        sanitized_results = sanitize_data(results)
        
        # Convert to response format
        all_portfolios = [
            PortfolioSimResult(**p) for p in sanitized_results["all_portfolios"]
        ]
        
        response = SimulationResponse(
            all_portfolios=all_portfolios,
            max_return_portfolio=PortfolioSimResult(**sanitized_results["max_return_portfolio"]),
            max_sharpe_portfolio=PortfolioSimResult(**sanitized_results["max_sharpe_portfolio"]),
            min_volatility_portfolio=PortfolioSimResult(**sanitized_results["min_volatility_portfolio"]),
        )
        
        # Add optional portfolios
        if "max_alpha_portfolio" in sanitized_results:
            response.max_alpha_portfolio = PortfolioSimResult(**sanitized_results["max_alpha_portfolio"])
        
        if "most_probable_portfolio" in sanitized_results:
            response.most_probable_portfolio = PortfolioSimResult(**sanitized_results["most_probable_portfolio"])
        
        return response
        
    except Exception as e:
        logger.error(f"Error running simulation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")


@router.post("/efficient-frontier")
async def calculate_efficient_frontier(request: SimulationRequest):
    """Calculate efficient frontier points"""
    try:
        returns_df = pd.DataFrame(request.returns_data)
        
        # Generate frontier
        from app.services.analytics_service import AnalyticsService
        portfolios = AnalyticsService.calculate_efficient_frontier(
            returns_df,
            num_portfolios=min(request.num_simulations, 5000),
            risk_free_rate=request.risk_free_rate
        )
        
        sanitized_portfolios = sanitize_data(portfolios)
        
        return {
            "portfolios": sanitized_portfolios,
            "count": len(sanitized_portfolios),
        }
        
    except Exception as e:
        logger.error(f"Error calculating efficient frontier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
