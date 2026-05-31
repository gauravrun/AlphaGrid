"""
Analytics Router - Portfolio Analytics and Calculations
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalyticsRequest, AnalyticsResponse, AssetMetrics, PortfolioMetrics
from app.services.analytics_service import AnalyticsService
from app.utils.sanitization import sanitize_data
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/calculate", response_model=AnalyticsResponse)
async def calculate_analytics(request: AnalyticsRequest):
    """Calculate comprehensive portfolio analytics"""
    try:
        # Convert prices dict to DataFrame
        prices_df = pd.DataFrame(request.prices)
        prices_df.index = pd.to_datetime(request.dates)
        
        # Determine weights
        if request.weights:
            weights = np.array(request.weights)
        else:
            # Equal weights
            weights = np.ones(len(request.symbols)) / len(request.symbols)
        
        # Validate weights
        if not np.isclose(weights.sum(), 1.0):
            weights = weights / weights.sum()
        
        # Calculate asset metrics
        asset_metrics_list = []
        for symbol in request.symbols:
            if symbol in prices_df.columns:
                metrics = AnalyticsService.analyze_asset(
                    prices_df[symbol],
                    request.risk_free_rate
                )
                sanitized_metrics = sanitize_data(metrics)
                asset_metrics_list.append(
                    AssetMetrics(symbol=symbol, **sanitized_metrics)
                )
        
        # Calculate portfolio metrics
        benchmark_prices = None
        if request.benchmark_prices:
            benchmark_prices = pd.Series(
                request.benchmark_prices,
                index=prices_df.index
            )
        
        portfolio_analysis = AnalyticsService.analyze_portfolio(
            prices_df,
            weights,
            request.risk_free_rate,
            request.initial_capital,
            benchmark_prices
        )
        
        sanitized_portfolio_analysis = sanitize_data(portfolio_analysis)
        portfolio_metrics = PortfolioMetrics(**sanitized_portfolio_analysis)
        
        # Calculate correlation and covariance matrices
        returns_df = prices_df.pct_change().dropna()
        corr_matrix = sanitize_data(returns_df.corr().values)
        cov_matrix = sanitize_data(returns_df.cov().values)
        
        # Calculate cumulative returns for each asset
        cumulative_returns = {}
        for symbol in request.symbols:
            if symbol in prices_df.columns:
                cumulative = (prices_df[symbol] / prices_df[symbol].iloc[0] - 1) * 100
                cumulative_returns[symbol] = sanitize_data(cumulative.tolist())
        
        return AnalyticsResponse(
            asset_metrics=asset_metrics_list,
            portfolio_metrics=portfolio_metrics,
            correlation_matrix=corr_matrix,
            covariance_matrix=cov_matrix,
            cumulative_returns=cumulative_returns,
            portfolio_values=sanitized_portfolio_analysis["portfolio_values"],
            drawdown_series=sanitized_portfolio_analysis["drawdown_series"],
        )
        
    except Exception as e:
        logger.error(f"Error calculating analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analytics calculation failed: {str(e)}")
