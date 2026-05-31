"""
ML Insights Service
Asset clustering, regime detection, and diversification analysis
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Optional
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)


class MLInsightsService:
    """Machine learning insights for portfolio analysis"""
    
    @staticmethod
    def cluster_assets(returns_df: pd.DataFrame, num_clusters: int = 3) -> Dict:
        """
        Cluster assets based on correlation patterns
        Groups assets that move similarly together
        """
        try:
            n_assets = len(returns_df.columns)
            if n_assets == 0:
                return {}
            
            # Calculate correlation matrix
            corr_matrix = returns_df.corr()
            
            # Fill NaNs with 0 to prevent StandardScaler from crashing on constant returns
            corr_matrix = corr_matrix.fillna(0)
            
            # Adjust num_clusters if needed to prevent KMeans crashes
            effective_num_clusters = min(num_clusters, n_assets)
            
            if effective_num_clusters <= 1:
                # All assets in a single cluster
                asset_clusters = {asset: 0 for asset in returns_df.columns}
                cluster_descriptions = {
                    0: {
                        "assets": list(returns_df.columns),
                        "size": n_assets,
                        "avg_internal_correlation": 1.0,
                        "description": "Single cluster representing all portfolio assets."
                    }
                }
                return {
                    "asset_clusters": asset_clusters,
                    "cluster_descriptions": cluster_descriptions,
                    "num_clusters": effective_num_clusters,
                }
            
            # Use correlation as features
            features = corr_matrix.values
            
            # Standardize
            scaler = StandardScaler()
            features_scaled = scaler.fit_transform(features)
            
            # Apply K-Means clustering
            kmeans = KMeans(n_clusters=effective_num_clusters, random_state=42, n_init=10)
            cluster_labels = kmeans.fit_predict(features_scaled)
            
            # Create asset-to-cluster mapping
            asset_clusters = {
                asset: int(label)
                for asset, label in zip(returns_df.columns, cluster_labels)
            }
            
            # Describe clusters
            cluster_descriptions = {}
            for cluster_id in range(effective_num_clusters):
                assets_in_cluster = [
                    asset for asset, label in asset_clusters.items()
                    if label == cluster_id
                ]
                
                # Calculate avg correlation within cluster
                if len(assets_in_cluster) > 1:
                    cluster_assets_corr = corr_matrix.loc[
                        assets_in_cluster, assets_in_cluster
                    ]
                    avg_corr = cluster_assets_corr.values[
                        np.triu_indices_from(cluster_assets_corr.values, k=1)
                    ].mean()
                else:
                    avg_corr = 1.0
                
                cluster_descriptions[cluster_id] = {
                    "assets": assets_in_cluster,
                    "size": len(assets_in_cluster),
                    "avg_internal_correlation": float(avg_corr),
                    "description": MLInsightsService._describe_cluster(
                        assets_in_cluster, avg_corr
                    )
                }
            
            return {
                "asset_clusters": asset_clusters,
                "cluster_descriptions": cluster_descriptions,
                "num_clusters": effective_num_clusters,
            }
            
        except Exception as e:
            logger.error(f"Error in asset clustering: {str(e)}")
            return {}
    
    @staticmethod
    def detect_regimes(returns_df: pd.DataFrame, window_size: int = 60) -> List[Dict]:
        """
        Detect market regimes: bullish, bearish, sideways, high/low volatility
        Uses rolling window analysis
        """
        try:
            # Calculate portfolio returns (equal weight for simplicity)
            portfolio_returns = returns_df.mean(axis=1)
            n_samples = len(portfolio_returns)
            
            # Scale down window size if we have very little historical data
            effective_window_size = window_size
            if n_samples < window_size:
                effective_window_size = max(10, n_samples // 2)
            
            regimes = []
            step_size = max(2, effective_window_size // 2)
            
            for i in range(effective_window_size, n_samples + 1, step_size):
                window_data = portfolio_returns.iloc[i - effective_window_size:i]
                
                # Calculate metrics
                mean_return = window_data.mean()
                volatility = window_data.std()
                trend = (window_data.iloc[-1] - window_data.iloc[0]) / window_data.iloc[0] if window_data.iloc[0] != 0 else 0
                
                # Classify regime
                regime_type = MLInsightsService._classify_regime(mean_return, volatility, trend)
                
                regimes.append({
                    "start_date": str(portfolio_returns.index[i - effective_window_size].strftime("%Y-%m-%d")),
                    "end_date": str(portfolio_returns.index[i - 1].strftime("%Y-%m-%d")),
                    "regime_type": regime_type,
                    "mean_return": float(mean_return),
                    "volatility": float(volatility),
                    "trend": float(trend),
                })
            
            return regimes
            
        except Exception as e:
            logger.error(f"Error in regime detection: {str(e)}")
            return []
    
    @staticmethod
    def calculate_diversification_score(weights: np.ndarray, corr_matrix: np.ndarray) -> float:
        """
        Calculate diversification quality score
        Higher score = better diversification
        Based on weighted average correlation
        """
        try:
            # Calculate weighted average correlation
            weighted_corr = 0
            total_weight = 0
            
            for i in range(len(weights)):
                for j in range(i + 1, len(weights)):
                    weight_product = weights[i] * weights[j]
                    corr_val = corr_matrix[i, j]
                    if np.isnan(corr_val):
                        corr_val = 0
                    weighted_corr += weight_product * abs(corr_val)
                    total_weight += weight_product
            
            if total_weight > 0:
                avg_corr = weighted_corr / total_weight
            else:
                avg_corr = 0
            
            # Diversification score: 1 - avg_correlation
            # High correlation = low diversification
            diversification_score = 1 - avg_corr
            
            return float(np.clip(diversification_score, 0, 1))
            
        except Exception as e:
            logger.error(f"Error calculating diversification score: {str(e)}")
            return 0.5
    
    @staticmethod
    def _describe_cluster(assets: List[str], avg_corr: float) -> str:
        """Generate description for a cluster"""
        if avg_corr > 0.7:
            return f"Highly correlated group of {len(assets)} assets that tend to move together"
        elif avg_corr > 0.4:
            return f"Moderately correlated group of {len(assets)} assets with similar patterns"
        else:
            return f"Weakly correlated group of {len(assets)} assets with diverse movements"
    
    @staticmethod
    def _classify_regime(mean_return: float, volatility: float, trend: float) -> str:
        """Classify market regime based on metrics"""
        # Thresholds (these are daily returns/volatility)
        high_vol_threshold = 0.02
        low_vol_threshold = 0.01
        positive_trend_threshold = 0.05
        negative_trend_threshold = -0.05
        
        # Determine volatility regime
        if volatility > high_vol_threshold:
            vol_regime = "high_volatility"
        elif volatility < low_vol_threshold:
            vol_regime = "low_volatility"
        else:
            vol_regime = "normal_volatility"
        
        # Determine trend regime
        if trend > positive_trend_threshold and mean_return > 0:
            trend_regime = "bullish"
        elif trend < negative_trend_threshold and mean_return < 0:
            trend_regime = "bearish"
        else:
            trend_regime = "sideways"
        
        # Combine
        if vol_regime == "high_volatility":
            if trend_regime == "bullish":
                return "volatile_bull"
            elif trend_regime == "bearish":
                return "volatile_bear"
            else:
                return "high_volatility"
        else:
            return trend_regime
    
    @staticmethod
    def forecast_volatility(returns_df: pd.DataFrame, horizon_days: int = 30) -> Dict:
        """
        Simple volatility forecasting using EWMA (Exponentially Weighted Moving Average)
        More sophisticated than simple rolling std
        """
        try:
            portfolio_returns = returns_df.mean(axis=1)
            
            # Calculate EWMA volatility
            lambda_param = 0.94  # Decay parameter
            ewma_var = portfolio_returns.ewm(alpha=1 - lambda_param).var()
            ewma_vol = np.sqrt(ewma_var)
            
            # Forecast (use last value as forecast - persistence model)
            current_vol = ewma_vol.iloc[-1]
            forecast_vol = current_vol * np.sqrt(252)  # Annualized
            
            return {
                "current_volatility": float(current_vol * np.sqrt(252)),
                "forecast_volatility": float(forecast_vol),
                "forecast_horizon_days": horizon_days,
                "model": "EWMA",
                "confidence": "medium",  # Persistence models have medium confidence
            }
            
        except Exception as e:
            logger.error(f"Error in volatility forecasting: {str(e)}")
            return {}
