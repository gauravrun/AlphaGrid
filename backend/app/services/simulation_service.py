"""
Simulation Service for Portfolio Allocation Optimization
Generates random portfolios and identifies optimal mixes
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Optional
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class SimulationService:
    """Portfolio allocation simulation and optimization"""
    
    @staticmethod
    def generate_random_weights(num_assets: int, constraints: Optional[Dict] = None) -> np.ndarray:
        """Generate random portfolio weights that sum to 1"""
        weights = np.random.random(num_assets)
        weights /= weights.sum()
        
        # Apply constraints if provided
        if constraints:
            max_weight = constraints.get('max_weight_per_asset', 1.0)
            min_weight = constraints.get('min_weight_per_asset', 0.0)
            
            # Clip weights
            weights = np.clip(weights, min_weight, max_weight)
            # Renormalize
            weights /= weights.sum()
        
        return weights
    
    @staticmethod
    def calculate_portfolio_metrics(weights: np.ndarray, 
                                   mean_returns: np.ndarray,
                                   cov_matrix: np.ndarray,
                                   risk_free_rate: float,
                                   trading_days: int = 252) -> Dict:
        """Calculate portfolio metrics for given weights"""
        
        # Annualized return
        portfolio_return = np.dot(weights, mean_returns) * trading_days
        
        # Annualized volatility using covariance matrix
        portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
        portfolio_vol = np.sqrt(portfolio_variance) * np.sqrt(trading_days)
        
        # Sharpe ratio
        sharpe = (portfolio_return - risk_free_rate) / portfolio_vol if portfolio_vol > 0 else 0
        
        return {
            "weights": weights.tolist(),
            "annualized_return": float(portfolio_return),
            "annualized_volatility": float(portfolio_vol),
            "sharpe_ratio": float(sharpe),
        }
    
    @staticmethod
    def run_simulation(returns_df: pd.DataFrame,
                      num_simulations: int = 10000,
                      risk_free_rate: float = 0.05,
                      benchmark_return: Optional[float] = None,
                      constraints: Optional[Dict] = None,
                      trading_days: int = 252) -> Dict:
        """
        Run portfolio allocation simulation
        Returns various optimal portfolios
        """
        
        num_assets = len(returns_df.columns)
        mean_returns = returns_df.mean().values
        cov_matrix = returns_df.cov().values
        
        all_portfolios = []
        
        logger.info(f"Running {num_simulations} portfolio simulations...")
        
        for i in range(num_simulations):
            # Generate random weights
            weights = SimulationService.generate_random_weights(num_assets, constraints)
            
            # Calculate metrics
            metrics = SimulationService.calculate_portfolio_metrics(
                weights, mean_returns, cov_matrix, risk_free_rate, trading_days
            )
            
            # Calculate alpha if benchmark provided
            if benchmark_return is not None:
                metrics["alpha"] = metrics["annualized_return"] - benchmark_return
            
            all_portfolios.append(metrics)
        
        # Find optimal portfolios
        max_return = max(all_portfolios, key=lambda x: x["annualized_return"])
        max_sharpe = max(all_portfolios, key=lambda x: x["sharpe_ratio"])
        min_volatility = min(all_portfolios, key=lambda x: x["annualized_volatility"])
        
        result = {
            "all_portfolios": all_portfolios,
            "max_return_portfolio": max_return,
            "max_sharpe_portfolio": max_sharpe,
            "min_volatility_portfolio": min_volatility,
        }
        
        # Max alpha if benchmark provided
        if benchmark_return is not None:
            max_alpha = max(all_portfolios, key=lambda x: x.get("alpha", -999))
            result["max_alpha_portfolio"] = max_alpha
        
        # Calculate Most Probable Mix
        most_probable = SimulationService.find_most_probable_mix(
            returns_df, num_simulations=5000, risk_free_rate=risk_free_rate
        )
        if most_probable:
            result["most_probable_portfolio"] = most_probable
        
        return result
    
    @staticmethod
    def find_most_probable_mix(returns_df: pd.DataFrame,
                               num_simulations: int = 5000,
                               risk_free_rate: float = 0.05,
                               num_windows: int = 8,
                               trading_days: int = 252) -> Optional[Dict]:
        """
        Find the Most Probable Mix using rolling window approach
        Tests portfolios across multiple time periods to find consistently strong performers
        """
        
        if len(returns_df) < 60:  # Need enough data for windows
            return None
        
        num_assets = len(returns_df.columns)
        window_size = len(returns_df) // num_windows
        
        if window_size < 20:  # Need minimum window size
            return None
        
        # Store portfolio scores across windows
        portfolio_db = {}  # {portfolio_id: [scores]}
        
        logger.info(f"Finding Most Probable Mix across {num_windows} time windows...")
        
        for window_idx in range(num_windows):
            start_idx = window_idx * window_size
            end_idx = start_idx + window_size
            
            if end_idx > len(returns_df):
                break
            
            window_data = returns_df.iloc[start_idx:end_idx]
            window_mean = window_data.mean().values
            window_cov = window_data.cov().values
            
            # Generate portfolios for this window
            for _ in range(num_simulations):
                weights = SimulationService.generate_random_weights(num_assets)
                
                # Calculate composite score
                metrics = SimulationService.calculate_portfolio_metrics(
                    weights, window_mean, window_cov, risk_free_rate, trading_days
                )
                
                # Composite score: weighted combination of metrics
                # Higher return, higher Sharpe, lower volatility
                score = (
                    0.35 * SimulationService._normalize_value(metrics["sharpe_ratio"], 0, 3) +
                    0.25 * SimulationService._normalize_value(metrics["annualized_return"], 0, 0.5) +
                    0.20 * (1 - SimulationService._normalize_value(metrics["annualized_volatility"], 0, 0.5)) +
                    0.20 * 1.0  # Placeholder for drawdown score
                )
                
                # Create portfolio ID (rounded weights for grouping similar portfolios)
                portfolio_id = tuple(np.round(weights, 2))
                
                if portfolio_id not in portfolio_db:
                    portfolio_db[portfolio_id] = {
                        "weights": weights,
                        "scores": [],
                        "returns": [],
                        "sharpes": [],
                    }
                
                portfolio_db[portfolio_id]["scores"].append(score)
                portfolio_db[portfolio_id]["returns"].append(metrics["annualized_return"])
                portfolio_db[portfolio_id]["sharpes"].append(metrics["sharpe_ratio"])
        
        # Find portfolio with best consistency
        # High mean score + low variability = consistent performance
        best_portfolio = None
        best_consistency_score = -999
        
        for portfolio_id, data in portfolio_db.items():
            if len(data["scores"]) >= num_windows // 2:  # Appeared in at least half the windows
                mean_score = np.mean(data["scores"])
                std_score = np.std(data["scores"])
                
                # Consistency score: high mean, low std
                consistency_score = mean_score - 0.5 * std_score
                
                if consistency_score > best_consistency_score:
                    best_consistency_score = consistency_score
                    best_portfolio = data
        
        if best_portfolio is None:
            return None
        
        # Calculate final metrics on full dataset
        weights = best_portfolio["weights"]
        mean_returns = returns_df.mean().values
        cov_matrix = returns_df.cov().values
        
        final_metrics = SimulationService.calculate_portfolio_metrics(
            weights, mean_returns, cov_matrix, risk_free_rate, trading_days
        )
        
        final_metrics["consistency_score"] = float(best_consistency_score)
        final_metrics["windows_tested"] = len(best_portfolio["scores"])
        
        return final_metrics
    
    @staticmethod
    def _normalize_value(value: float, min_val: float, max_val: float) -> float:
        """Normalize value to 0-1 range"""
        if max_val == min_val:
            return 0.5
        normalized = (value - min_val) / (max_val - min_val)
        return np.clip(normalized, 0, 1)
