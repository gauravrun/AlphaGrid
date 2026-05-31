"""
Monte Carlo Simulation Service
Generates future portfolio scenarios based on historical statistics
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class MonteCarloService:
    """Monte Carlo future scenario simulation"""
    
    @staticmethod
    def simulate_portfolio_paths(weights: np.ndarray,
                                 mean_returns: np.ndarray,
                                 cov_matrix: np.ndarray,
                                 initial_value: float,
                                 time_horizon_days: int,
                                 num_simulations: int,
                                 return_model: str = "normal",
                                 trading_days_per_year: int = 252) -> Dict:
        """
        Run Monte Carlo simulation for portfolio
        
        Args:
            weights: Portfolio weights
            mean_returns: Annualized mean returns for each asset
            cov_matrix: Annualized covariance matrix
            initial_value: Initial portfolio value
            time_horizon_days: Number of days to simulate
            num_simulations: Number of simulation runs
            return_model: "normal", "bootstrap", or "t-distribution"
            
        Returns:
            Dictionary with paths and statistics
        """
        
        # Convert annualized stats to daily
        daily_mean_returns = mean_returns / trading_days_per_year
        daily_cov_matrix = cov_matrix / trading_days_per_year
        
        all_paths = []
        final_values = []
        
        logger.info(f"Running {num_simulations} Monte Carlo simulations for {time_horizon_days} days...")
        
        for sim_idx in range(num_simulations):
            if return_model == "normal":
                # Generate correlated random returns using multivariate normal
                random_returns = np.random.multivariate_normal(
                    daily_mean_returns,
                    daily_cov_matrix,
                    time_horizon_days
                )
            elif return_model == "t-distribution":
                # Use t-distribution for fat tails
                df = 5  # Degrees of freedom
                random_returns = np.random.standard_t(df, size=(time_horizon_days, len(weights)))
                # Scale by volatility
                random_returns = random_returns * np.sqrt(np.diag(daily_cov_matrix)) + daily_mean_returns
            else:  # bootstrap
                # Bootstrap from historical returns (if available)
                # For now, fall back to normal
                random_returns = np.random.multivariate_normal(
                    daily_mean_returns,
                    daily_cov_matrix,
                    time_horizon_days
                )
            
            # Calculate portfolio returns for each day
            portfolio_returns = random_returns.dot(weights)
            
            # Calculate portfolio value over time
            portfolio_path = initial_value * (1 + portfolio_returns).cumprod()
            
            # Add initial value at start
            full_path = np.insert(portfolio_path, 0, initial_value)
            
            all_paths.append(full_path.tolist())
            final_values.append(full_path[-1])
        
        # Convert to numpy for statistics
        final_values = np.array(final_values)
        
        # Calculate statistics
        percentiles = {
            "5th": float(np.percentile(final_values, 5)),
            "25th": float(np.percentile(final_values, 25)),
            "50th": float(np.percentile(final_values, 50)),
            "75th": float(np.percentile(final_values, 75)),
            "95th": float(np.percentile(final_values, 95)),
        }
        
        mean_final = float(np.mean(final_values))
        median_final = float(np.median(final_values))
        
        # Probability metrics
        prob_profit = float(np.sum(final_values > initial_value) / num_simulations)
        prob_loss = float(np.sum(final_values < initial_value) / num_simulations)
        
        # Value at Risk (95% confidence)
        var_95 = float(initial_value - np.percentile(final_values, 5))
        
        # Expected maximum drawdown
        expected_max_dd = MonteCarloService._calculate_expected_max_drawdown(all_paths)
        
        # Sample paths for visualization (send only 100 paths to frontend)
        sample_indices = np.random.choice(num_simulations, min(100, num_simulations), replace=False)
        sample_paths = [all_paths[i] for i in sample_indices]
        
        return {
            "paths": sample_paths,  # Only sample for performance
            "final_values": final_values.tolist(),
            "percentiles": percentiles,
            "mean_final_value": mean_final,
            "median_final_value": median_final,
            "probability_of_profit": prob_profit,
            "probability_of_loss": prob_loss,
            "value_at_risk_95": var_95,
            "expected_max_drawdown": expected_max_dd,
            "num_simulations": num_simulations,
            "time_horizon_days": time_horizon_days,
        }
    
    @staticmethod
    def _calculate_expected_max_drawdown(all_paths: List[List[float]]) -> float:
        """Calculate expected maximum drawdown across all simulations"""
        max_drawdowns = []
        
        for path in all_paths:
            path_array = np.array(path)
            running_max = np.maximum.accumulate(path_array)
            drawdown = (path_array - running_max) / running_max
            max_dd = np.min(drawdown)
            max_drawdowns.append(max_dd)
        
        return float(np.mean(max_drawdowns))
    
    @staticmethod
    def compare_scenarios(scenarios: List[Dict]) -> Dict:
        """
        Compare multiple Monte Carlo scenarios
        Useful for comparing different portfolio mixes
        """
        comparison = {
            "scenarios": scenarios,
            "summary": {}
        }
        
        for idx, scenario in enumerate(scenarios):
            name = scenario.get("name", f"Scenario {idx + 1}")
            comparison["summary"][name] = {
                "median_final": scenario["median_final_value"],
                "prob_profit": scenario["probability_of_profit"],
                "var_95": scenario["value_at_risk_95"],
            }
        
        return comparison
