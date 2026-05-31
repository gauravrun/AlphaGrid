// API Service for Smart Allocation Lab

import axios from 'axios';
import type {
  Asset,
  Benchmark,
  PriceData,
  AnalyticsResponse,
  SimulationResponse,
  MonteCarloResponse,
  MLClusteringResult,
  Regime,
  DiversificationResult,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Asset Search
export const searchAssets = async (query: string, limit = 25): Promise<Asset[]> => {
  const response = await api.get('/assets/search', { params: { query, limit } });
  return response.data.results;
};

export const searchBenchmarks = async (query: string, limit = 10): Promise<Benchmark[]> => {
  const response = await api.get('/assets/benchmarks/search', { params: { query, limit } });
  return response.data.results;
};

export const getIndianDemo = async () => {
  const response = await api.get('/assets/demo/indian');
  return response.data;
};

export const getGlobalDemo = async () => {
  const response = await api.get('/assets/demo/global');
  return response.data;
};

// Data Fetching
export const fetchMarketData = async (
  symbols: string[],
  startDate: string,
  endDate: string,
  benchmarkSymbol?: string
): Promise<PriceData> => {
  const response = await api.post('/data/fetch', {
    symbols,
    start_date: startDate,
    end_date: endDate,
    benchmark_symbol: benchmarkSymbol,
  });
  return response.data;
};

export const uploadCSV = async (file: File): Promise<PriceData> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/data/upload/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getRiskFreeRate = async (market: string): Promise<{ rate: number; source: string }> => {
  const response = await api.post('/data/riskfree', { market });
  return response.data;
};

// Analytics
export const calculateAnalytics = async (
  symbols: string[],
  prices: Record<string, number[]>,
  dates: string[],
  weights?: number[],
  benchmarkPrices?: number[],
  riskFreeRate = 0.05,
  initialCapital = 100000
): Promise<AnalyticsResponse> => {
  const response = await api.post('/analytics/calculate', {
    symbols,
    prices,
    dates,
    weights,
    benchmark_prices: benchmarkPrices,
    risk_free_rate: riskFreeRate,
    initial_capital: initialCapital,
  });
  return response.data;
};

// Simulation
export const runSimulation = async (
  symbols: string[],
  returnsData: Record<string, number[]>,
  numSimulations = 10000,
  riskFreeRate = 0.05,
  benchmarkReturn?: number,
  constraints?: any
): Promise<SimulationResponse> => {
  const response = await api.post('/simulation/run', {
    symbols,
    returns_data: returnsData,
    num_simulations: numSimulations,
    risk_free_rate: riskFreeRate,
    benchmark_return: benchmarkReturn,
    constraints,
  });
  return response.data;
};

// Monte Carlo
export const runMonteCarlo = async (
  weights: number[],
  meanReturns: number[],
  covMatrix: number[][],
  initialValue = 100000,
  timeHorizonDays = 252,
  numSimulations = 10000,
  returnModel = 'normal'
): Promise<MonteCarloResponse> => {
  const response = await api.post('/montecarlo/simulate', {
    weights,
    mean_returns: meanReturns,
    cov_matrix: covMatrix,
    initial_value: initialValue,
    time_horizon_days: timeHorizonDays,
    num_simulations: numSimulations,
    return_model: returnModel,
  });
  return response.data;
};

// ML Insights
export const clusterAssets = async (
  returnsData: Record<string, number[]>,
  numClusters = 3
): Promise<MLClusteringResult> => {
  const response = await api.post('/ml/cluster', returnsData, {
    params: { num_clusters: numClusters },
  });
  return response.data;
};

export const detectRegimes = async (
  returnsData: Record<string, number[]>,
  windowSize = 60
): Promise<{ regimes: Regime[]; count: number }> => {
  const response = await api.post('/ml/regimes', returnsData, {
    params: { window_size: windowSize },
  });
  return response.data;
};

export const calculateDiversification = async (
  weights: number[],
  correlationMatrix: number[][]
): Promise<DiversificationResult> => {
  const response = await api.post('/ml/diversification-score', {
    weights,
    correlation_matrix: correlationMatrix,
  });
  return response.data;
};

export const forecastVolatility = async (
  returnsData: Record<string, number[]>,
  horizonDays = 30
) => {
  const response = await api.post('/ml/forecast-volatility', returnsData, {
    params: { horizon_days: horizonDays },
  });
  return response.data;
};

export default api;
