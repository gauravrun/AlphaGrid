"""
ML Insights Router - AI/ML Analysis
"""
from fastapi import APIRouter, HTTPException
from app.models.schemas import MLInsightsResponse, ClusteringResult, RegimeDetectionResult
from app.services.ml_service import MLInsightsService
from app.utils.sanitization import sanitize_data
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/cluster")
async def cluster_assets(returns_data: dict, num_clusters: int = 3):
    """Cluster assets based on correlation patterns"""
    try:
        returns_df = pd.DataFrame(returns_data)
        
        results = MLInsightsService.cluster_assets(returns_df, num_clusters)
        
        if results:
            sanitized_results = sanitize_data(results)
            return {
                "asset_clusters": sanitized_results["asset_clusters"],
                "cluster_descriptions": sanitized_results["cluster_descriptions"],
                "num_clusters": sanitized_results["num_clusters"],
            }
        else:
            raise HTTPException(status_code=500, detail="Clustering failed")
        
    except Exception as e:
        logger.error(f"Error clustering assets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/regimes")
async def detect_regimes(returns_data: dict, window_size: int = 60):
    """Detect market regimes"""
    try:
        returns_df = pd.DataFrame(returns_data)
        
        regimes = MLInsightsService.detect_regimes(returns_df, window_size)
        sanitized_regimes = sanitize_data(regimes)
        
        return {
            "regimes": sanitized_regimes,
            "count": len(sanitized_regimes),
        }
        
    except Exception as e:
        logger.error(f"Error detecting regimes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/diversification-score")
async def calculate_diversification(weights: list, correlation_matrix: list):
    """Calculate diversification quality score"""
    try:
        weights_array = np.array(weights)
        corr_matrix = np.array(correlation_matrix)
        
        score = MLInsightsService.calculate_diversification_score(
            weights_array,
            corr_matrix
        )
        
        sanitized_score = sanitize_data(score)
        
        return {
            "diversification_score": sanitized_score,
            "interpretation": _interpret_diversification(sanitized_score),
        }
        
    except Exception as e:
        logger.error(f"Error calculating diversification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forecast-volatility")
async def forecast_volatility(returns_data: dict, horizon_days: int = 30):
    """Forecast portfolio volatility"""
    try:
        returns_df = pd.DataFrame(returns_data)
        
        forecast = MLInsightsService.forecast_volatility(returns_df, horizon_days)
        sanitized_forecast = sanitize_data(forecast)
        
        return sanitized_forecast
        
    except Exception as e:
        logger.error(f"Error forecasting volatility: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def _interpret_diversification(score: float) -> str:
    """Interpret diversification score"""
    if score > 0.7:
        return "Excellent diversification - assets have low correlation"
    elif score > 0.5:
        return "Good diversification - portfolio has reasonable spread"
    elif score > 0.3:
        return "Moderate diversification - consider adding uncorrelated assets"
    else:
        return "Poor diversification - assets are highly correlated"
