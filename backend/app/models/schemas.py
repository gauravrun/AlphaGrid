"""
Pydantic models for Smart Allocation Lab API
"""
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import date


# Asset Models
class AssetSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=100)
    limit: int = Field(default=25, ge=1, le=50)


class AssetInfo(BaseModel):
    display_name: str
    display_symbol: str
    yahoo_symbol: str
    exchange: str
    asset_type: str


# Data Fetching Models
class DataFetchRequest(BaseModel):
    symbols: List[str] = Field(..., min_items=1, max_items=15)
    start_date: date
    end_date: date
    benchmark_symbol: Optional[str] = None


class DataFetchResponse(BaseModel):
    prices: Dict[str, List[float]]
    dates: List[str]
    benchmark_prices: Optional[List[float]] = None
    metadata: Dict[str, Any]


# CSV Upload Models
class CSVUploadResponse(BaseModel):
    detected_date_column: Optional[str]
    detected_price_columns: List[str]
    preview: List[Dict[str, Any]]
    row_count: int


# Analytics Models
class AnalyticsRequest(BaseModel):
    symbols: List[str]
    prices: Dict[str, List[float]]
    dates: List[str]
    weights: Optional[List[float]] = None
    benchmark_symbol: Optional[str] = None
    benchmark_prices: Optional[List[float]] = None
    risk_free_rate: float = Field(default=0.05)
    initial_capital: float = Field(default=100000.0)


class AssetMetrics(BaseModel):
    symbol: str
    total_return: float
    cagr: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    best_day: float
    worst_day: float


class PortfolioMetrics(BaseModel):
    total_return: float
    cagr: float
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: float
    alpha: Optional[float] = None
    beta: Optional[float] = None
    final_value: float


class AnalyticsResponse(BaseModel):
    asset_metrics: List[AssetMetrics]
    portfolio_metrics: PortfolioMetrics
    correlation_matrix: List[List[float]]
    covariance_matrix: List[List[float]]
    cumulative_returns: Dict[str, List[float]]
    portfolio_values: List[float]
    drawdown_series: List[float]


# Simulation Models
class SimulationRequest(BaseModel):
    symbols: List[str]
    returns_data: Dict[str, List[float]]  # Daily returns for each asset
    num_simulations: int = Field(default=10000, ge=1000, le=50000)
    risk_free_rate: float = Field(default=0.05)
    benchmark_return: Optional[float] = None
    constraints: Optional[Dict[str, Any]] = None


class PortfolioSimResult(BaseModel):
    weights: List[float]
    annualized_return: float
    annualized_volatility: float
    sharpe_ratio: float
    max_drawdown: Optional[float] = None
    alpha: Optional[float] = None


class SimulationResponse(BaseModel):
    all_portfolios: List[PortfolioSimResult]
    max_return_portfolio: PortfolioSimResult
    max_sharpe_portfolio: PortfolioSimResult
    min_volatility_portfolio: PortfolioSimResult
    max_alpha_portfolio: Optional[PortfolioSimResult] = None
    most_probable_portfolio: Optional[PortfolioSimResult] = None


# Monte Carlo Models
class MonteCarloRequest(BaseModel):
    weights: List[float]
    mean_returns: List[float]  # Annualized
    cov_matrix: List[List[float]]  # Annualized
    initial_value: float = Field(default=100000.0)
    time_horizon_days: int = Field(default=252, ge=30, le=2520)  # Max 10 years
    num_simulations: int = Field(default=10000, ge=1000, le=10000)
    return_model: str = Field(default="normal")  # normal, bootstrap, t-distribution


class MonteCarloResponse(BaseModel):
    paths: List[List[float]]  # Only send sample paths for visualization
    final_values: List[float]
    percentiles: Dict[str, float]  # 5th, 25th, 50th, 75th, 95th
    mean_final_value: float
    median_final_value: float
    probability_of_profit: float
    probability_of_loss: float
    value_at_risk_95: float
    expected_max_drawdown: float
    num_simulations: int
    time_horizon_days: int


# Risk-Free Rate Models
class RiskFreeRateRequest(BaseModel):
    market: Optional[str] = "us"  # "india", "us", "uk", "global"


class RiskFreeRateResponse(BaseModel):
    rate: float
    source: str  # "auto", "fallback", "manual"
    last_updated: Optional[str] = None


# ML Insights Models
class ClusteringResult(BaseModel):
    asset_clusters: Dict[str, int]  # {symbol: cluster_id}
    cluster_descriptions: Dict[int, str]


class RegimeDetectionResult(BaseModel):
    regimes: List[Dict[str, Any]]  # List of time periods with regime type


class MLInsightsResponse(BaseModel):
    clustering: Optional[ClusteringResult] = None
    regime_detection: Optional[RegimeDetectionResult] = None
    diversification_score: Optional[float] = None
