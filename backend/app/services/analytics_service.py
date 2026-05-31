"""
Portfolio Analytics Service
Handles all portfolio calculations using proper covariance matrix math
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional


class AnalyticsService:
    """Core analytics calculations for portfolio optimization"""
    
    TRADING_DAYS_PER_YEAR = 252  # Standard for stocks/ETFs
    CRYPTO_DAYS_PER_YEAR = 365  # For crypto assets
    
    @staticmethod
    def calculate_returns(prices: pd.Series) -> pd.Series:
        """Calculate daily returns from price series"""
        return prices.pct_change().dropna()
    
    @staticmethod
    def calculate_total_return(prices: pd.Series) -> float:
        """Calculate total return over the period"""
        if len(prices) < 2:
            return 0.0
        return (prices.iloc[-1] / prices.iloc[0]) - 1
    
    @staticmethod
    def calculate_cagr(prices: pd.Series, trading_days_per_year: int = 252) -> float:
        """Calculate Compound Annual Growth Rate"""
        if len(prices) < 2:
            return 0.0
        
        total_return = (prices.iloc[-1] / prices.iloc[0])
        num_years = len(prices) / trading_days_per_year
        
        if total_return <= 0 or num_years <= 0:
            return 0.0
        
        cagr = (total_return ** (1 / num_years)) - 1
        return cagr
    
    @staticmethod
    def calculate_volatility(returns: pd.Series, trading_days_per_year: int = 252) -> float:
        """Calculate annualized volatility"""
        if len(returns) < 2:
            return 0.0
        
        daily_vol = returns.std()
        annualized_vol = daily_vol * np.sqrt(trading_days_per_year)
        return annualized_vol
    
    @staticmethod
    def calculate_max_drawdown(prices: pd.Series) -> float:
        """Calculate maximum drawdown"""
        if len(prices) < 2:
            return 0.0
        
        cumulative = prices / prices.iloc[0]
        running_max = cumulative.expanding().max()
        drawdown = (cumulative - running_max) / running_max
        max_drawdown = drawdown.min()
        
        return max_drawdown
    
    @staticmethod
    def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float,
                              trading_days_per_year: int = 252) -> float:
        """Calculate Sharpe ratio"""
        if len(returns) < 2:
            return 0.0
        
        # Annualized return
        mean_daily_return = returns.mean()
        annualized_return = mean_daily_return * trading_days_per_year
        
        # Annualized volatility
        annualized_vol = AnalyticsService.calculate_volatility(returns, trading_days_per_year)
        
        if annualized_vol == 0:
            return 0.0
        
        sharpe = (annualized_return - risk_free_rate) / annualized_vol
        return sharpe
    
    @staticmethod
    def calculate_portfolio_return(weights: np.ndarray, returns: pd.DataFrame) -> pd.Series:
        """Calculate portfolio returns given weights and asset returns"""
        return returns.dot(weights)
    
    @staticmethod
    def calculate_portfolio_variance(weights: np.ndarray, cov_matrix: np.ndarray) -> float:
        """
        Calculate portfolio variance using covariance matrix
        Formula: σ²_p = w^T * Σ * w
        """
        portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
        return portfolio_variance
    
    @staticmethod
    def calculate_portfolio_volatility(weights: np.ndarray, cov_matrix: np.ndarray,
                                      trading_days_per_year: int = 252) -> float:
        """
        Calculate annualized portfolio volatility
        Uses covariance matrix (must be in daily terms)
        """
        daily_variance = AnalyticsService.calculate_portfolio_variance(weights, cov_matrix)
        daily_vol = np.sqrt(daily_variance)
        annualized_vol = daily_vol * np.sqrt(trading_days_per_year)
        return annualized_vol
    
    @staticmethod
    def calculate_alpha(portfolio_return: float, benchmark_return: float, 
                        risk_free_rate: float = 0.0, beta: float = 1.0) -> float:
        """Calculate Jensen's Alpha vs benchmark"""
        return portfolio_return - (risk_free_rate + beta * (benchmark_return - risk_free_rate))
    
    @staticmethod
    def calculate_beta(portfolio_returns: pd.Series, benchmark_returns: pd.Series) -> float:
        """Calculate beta vs benchmark"""
        # Align series to common dates in case they differ slightly in length
        aligned_df = pd.concat([portfolio_returns, benchmark_returns], axis=1).dropna()
        if len(aligned_df) < 2:
            return 0.0
        
        portfolio_aligned = aligned_df.iloc[:, 0]
        benchmark_aligned = aligned_df.iloc[:, 1]
        
        # Covariance of portfolio and benchmark / Variance of benchmark
        covariance = portfolio_aligned.cov(benchmark_aligned)
        benchmark_variance = benchmark_aligned.var()
        
        if benchmark_variance == 0:
            return 0.0
        
        beta = covariance / benchmark_variance
        return beta
    
    @staticmethod
    def analyze_asset(prices: pd.Series, risk_free_rate: float = 0.05,
                     trading_days_per_year: int = 252) -> Dict:
        """Comprehensive analysis of a single asset"""
        returns = AnalyticsService.calculate_returns(prices)
        
        return {
            "total_return": AnalyticsService.calculate_total_return(prices),
            "cagr": AnalyticsService.calculate_cagr(prices, trading_days_per_year),
            "annualized_volatility": AnalyticsService.calculate_volatility(returns, trading_days_per_year),
            "sharpe_ratio": AnalyticsService.calculate_sharpe_ratio(returns, risk_free_rate, trading_days_per_year),
            "max_drawdown": AnalyticsService.calculate_max_drawdown(prices),
            "best_day": returns.max() if len(returns) > 0 else 0.0,
            "worst_day": returns.min() if len(returns) > 0 else 0.0,
        }
    
    @staticmethod
    def analyze_portfolio(prices_df: pd.DataFrame, weights: np.ndarray,
                         risk_free_rate: float = 0.05,
                         initial_capital: float = 100000.0,
                         benchmark_prices: Optional[pd.Series] = None,
                         trading_days_per_year: int = 252) -> Dict:
        """Comprehensive portfolio analysis"""
        
        # Calculate returns for each asset
        returns_df = prices_df.pct_change().dropna()
        
        # Validate weights
        if not np.isclose(weights.sum(), 1.0):
            weights = weights / weights.sum()
        
        # Calculate portfolio returns
        portfolio_returns = AnalyticsService.calculate_portfolio_return(weights, returns_df)
        
        # Calculate covariance matrix (daily)
        cov_matrix = returns_df.cov().values
        
        # Portfolio metrics
        annualized_return = portfolio_returns.mean() * trading_days_per_year
        portfolio_vol = AnalyticsService.calculate_portfolio_volatility(
            weights, cov_matrix, trading_days_per_year
        )
        
        # Sharpe ratio
        if portfolio_vol > 0:
            sharpe = (annualized_return - risk_free_rate) / portfolio_vol
        else:
            sharpe = 0.0
        
        # Portfolio value over time
        portfolio_values = initial_capital * (1 + portfolio_returns).cumprod()
        
        # Total return and CAGR
        total_return = (portfolio_values.iloc[-1] / initial_capital) - 1
        num_years = len(portfolio_values) / trading_days_per_year
        cagr = ((portfolio_values.iloc[-1] / initial_capital) ** (1 / num_years)) - 1 if num_years > 0 else 0
        
        # Max drawdown
        cumulative = portfolio_values / portfolio_values.expanding().max()
        drawdown = (portfolio_values - portfolio_values.expanding().max()) / portfolio_values.expanding().max()
        max_drawdown = drawdown.min()
        
        result = {
            "total_return": total_return,
            "cagr": cagr,
            "annualized_return": annualized_return,
            "annualized_volatility": portfolio_vol,
            "sharpe_ratio": sharpe,
            "max_drawdown": max_drawdown,
            "final_value": portfolio_values.iloc[-1],
            "portfolio_values": portfolio_values.tolist(),
            "drawdown_series": drawdown.tolist(),
        }
        
        # Benchmark comparison if provided
        if benchmark_prices is not None and len(benchmark_prices) > 0:
            # Calculate daily returns for benchmark on full dates series first
            benchmark_daily_returns = benchmark_prices.pct_change().dropna()
            # Align with portfolio returns index
            benchmark_returns = benchmark_daily_returns.reindex(portfolio_returns.index)
            benchmark_returns = benchmark_returns.ffill().bfill()
            
            if len(benchmark_returns) > 0:
                benchmark_ann_return = benchmark_returns.mean() * trading_days_per_year
                alpha = annualized_return - benchmark_ann_return
                beta = AnalyticsService.calculate_beta(portfolio_returns, benchmark_returns)
                
                result["alpha"] = alpha
                result["beta"] = beta
        
        return result
    
    @staticmethod
    def calculate_efficient_frontier(returns_df: pd.DataFrame,
                                     num_portfolios: int = 10000,
                                     risk_free_rate: float = 0.05,
                                     trading_days_per_year: int = 252) -> List[Dict]:
        """Generate random portfolios for efficient frontier"""
        
        num_assets = len(returns_df.columns)
        cov_matrix = returns_df.cov().values
        mean_returns = returns_df.mean().values
        
        results = []
        
        for _ in range(num_portfolios):
            # Generate random weights
            weights = np.random.random(num_assets)
            weights /= weights.sum()
            
            # Portfolio return
            portfolio_return = np.dot(weights, mean_returns) * trading_days_per_year
            
            # Portfolio volatility
            portfolio_vol = AnalyticsService.calculate_portfolio_volatility(
                weights, cov_matrix, trading_days_per_year
            )
            
            # Sharpe ratio
            sharpe = (portfolio_return - risk_free_rate) / portfolio_vol if portfolio_vol > 0 else 0
            
            results.append({
                "weights": weights.tolist(),
                "annualized_return": portfolio_return,
                "annualized_volatility": portfolio_vol,
                "sharpe_ratio": sharpe,
            })
        
        return results
