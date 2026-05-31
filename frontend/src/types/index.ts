// TypeScript types and interfaces for Smart Allocation Lab

export interface Asset {
  display_name: string;
  display_symbol: string;
  yahoo_symbol: string;
  exchange: string;
  asset_type: string;
}

export interface Benchmark {
  display_name: string;
  display_symbol: string;
  yahoo_symbol: string;
  market: string;
  asset_type: string;
}

export interface SelectedAsset extends Asset {
  id: string;
}

export interface PriceData {
  prices: Record<string, number[]>;
  dates: string[];
  benchmark_prices?: number[];
  metadata: {
    start_date: string;
    end_date: string;
    total_days: number;
    symbols_fetched: string[];
    missing_symbols: string[];
    cached?: boolean;
  };
}

export interface AssetMetrics {
  symbol: string;
  total_return: number;
  cagr: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  best_day: number;
  worst_day: number;
}

export interface PortfolioMetrics {
  total_return: number;
  cagr: number;
  annualized_return: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  max_drawdown: number;
  alpha?: number;
  beta?: number;
  final_value: number;
}

export interface AnalyticsResponse {
  asset_metrics: AssetMetrics[];
  portfolio_metrics: PortfolioMetrics;
  correlation_matrix: number[][];
  covariance_matrix: number[][];
  cumulative_returns: Record<string, number[]>;
  portfolio_values: number[];
  drawdown_series: number[];
}

export interface PortfolioSimResult {
  weights: number[];
  annualized_return: number;
  annualized_volatility: number;
  sharpe_ratio: number;
  max_drawdown?: number;
  alpha?: number;
  consistency_score?: number;
  windows_tested?: number;
}

export interface SimulationResponse {
  all_portfolios: PortfolioSimResult[];
  max_return_portfolio: PortfolioSimResult;
  max_sharpe_portfolio: PortfolioSimResult;
  min_volatility_portfolio: PortfolioSimResult;
  max_alpha_portfolio?: PortfolioSimResult;
  most_probable_portfolio?: PortfolioSimResult;
}

export interface MonteCarloResponse {
  paths: number[][];
  final_values: number[];
  percentiles: {
    '5th': number;
    '25th': number;
    '50th': number;
    '75th': number;
    '95th': number;
  };
  mean_final_value: number;
  median_final_value: number;
  probability_of_profit: number;
  probability_of_loss: number;
  value_at_risk_95: number;
  expected_max_drawdown: number;
  num_simulations: number;
  time_horizon_days: number;
}

export interface ClusterDescription {
  assets: string[];
  size: number;
  avg_internal_correlation: number;
  description: string;
}

export interface MLClusteringResult {
  asset_clusters: Record<string, number>;
  cluster_descriptions: Record<number, ClusterDescription>;
  num_clusters: number;
}

export interface Regime {
  start_date: string;
  end_date: string;
  regime_type: string;
  mean_return: number;
  volatility: number;
  trend: number;
}

export interface DiversificationResult {
  diversification_score: number;
  interpretation: string;
}

export interface AppState {
  selectedAssets: SelectedAsset[];
  benchmark: Benchmark | null;
  startDate: string;
  endDate: string;
  initialCapital: number;
  riskFreeRate: number;
  riskFreeSource: 'auto' | 'manual' | 'fallback';
  weights: number[];
  priceData: PriceData | null;
  analyticsData: AnalyticsResponse | null;
  simulationData: SimulationResponse | null;
  monteCarloData: MonteCarloResponse | null;
  loading: boolean;
  error: string | null;
}

export type DateRangePreset = '6M' | '1Y' | '3Y' | '5Y' | '7Y' | '10Y' | 'MAX';
