import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, Legend } from 'recharts';
import { Play, Loader, AlertTriangle, TrendingUp } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import type { AppState } from '../types';
import { runMonteCarlo } from '../services/api';

interface MonteCarloSimProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const MonteCarloSim = ({ appState, setAppState }: MonteCarloSimProps) => {
  const navigate = useNavigate();
  
  const [portfolioMix, setPortfolioMix] = useState<'equal' | 'max_sharpe' | 'max_return' | 'min_volatility' | 'most_probable'>('max_sharpe');
  const [timeHorizon, setTimeHorizon] = useState(252); // 1 year
  const [numSimulations, setNumSimulations] = useState(10000);
  const [returnModel, setReturnModel] = useState<'normal' | 't-distribution'>('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRequiredData = Boolean(appState.priceData && appState.analyticsData);
  const { monteCarloData } = appState;

  // Hooks must run on every render (Rules of Hooks) — do not return early before these
  const pathChartData = useMemo(() => {
    if (!monteCarloData?.paths?.length) return [];

    const numDays = monteCarloData.paths[0]?.length || 0;
    const data: Record<string, number>[] = [];

    for (let day = 0; day < numDays; day++) {
      const dataPoint: Record<string, number> = { day };

      monteCarloData.paths.slice(0, 10).forEach((path, idx) => {
        if (path[day] != null) {
          dataPoint[`path${idx}`] = path[day];
        }
      });

      const valuesAtDay = monteCarloData.paths
        .map((path) => path[day])
        .filter((v): v is number => v != null && !Number.isNaN(v));
      if (valuesAtDay.length === 0) continue;

      valuesAtDay.sort((a, b) => a - b);
      dataPoint.p5 = valuesAtDay[Math.floor(valuesAtDay.length * 0.05)] ?? valuesAtDay[0];
      dataPoint.p95 = valuesAtDay[Math.floor(valuesAtDay.length * 0.95)] ?? valuesAtDay[valuesAtDay.length - 1];
      dataPoint.median = valuesAtDay[Math.floor(valuesAtDay.length * 0.5)] ?? valuesAtDay[0];

      data.push(dataPoint);
    }

    return data;
  }, [monteCarloData]);

  const distributionData = useMemo(() => {
    if (!monteCarloData?.final_values?.length) return [];

    const finalValues = monteCarloData.final_values;
    const min = Math.min(...finalValues);
    const max = Math.max(...finalValues);

    if (!Number.isFinite(min) || !Number.isFinite(max)) return [];

    const numBins = 50;
    const binSize = max > min ? (max - min) / numBins : 1;

    const bins: { range: string; count: number; binStart: number; binEnd: number }[] = [];
    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * binSize;
      const binEnd = i === numBins - 1 ? max + 0.01 : binStart + binSize;
      const count = finalValues.filter((v) => v >= binStart && v < binEnd).length;

      bins.push({
        range: `${(binStart / 1000).toFixed(0)}k`,
        count,
        binStart,
        binEnd,
      });
    }

    return bins;
  }, [monteCarloData]);

  const convergenceData = useMemo(() => {
    if (!monteCarloData?.final_values?.length) return [];

    const finalValues = monteCarloData.final_values;
    const sizes = [1000, 5000, 10000].filter(s => s <= finalValues.length);

    const getPercentile = (arr: number[], p: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * p)] ?? sorted[0];
    };

    return sizes.map(size => {
      const subset = finalValues.slice(0, size);
      const mean = subset.reduce((a, b) => a + b, 0) / size;
      const median = getPercentile(subset, 0.5);
      const p5 = getPercentile(subset, 0.05);
      const p95 = getPercentile(subset, 0.95);

      return {
        name: `${size.toLocaleString()}`,
        sizeVal: size,
        p5,
        median,
        p95,
        mean,
      };
    });
  }, [monteCarloData]);

  const scatterConvergenceData = useMemo(() => {
    if (!monteCarloData?.final_values?.length) return [];

    const finalValues = monteCarloData.final_values;
    const sizes = [1000, 5000, 10000].filter(s => s <= finalValues.length);
    const scatterPoints: { sizeVal: number; value: number }[] = [];

    sizes.forEach(size => {
      const subset = finalValues.slice(0, size);
      // Take 100 evenly distributed samples from the subset
      const sampleSize = Math.min(100, subset.length);
      const step = Math.floor(subset.length / sampleSize);
      for (let i = 0; i < sampleSize; i++) {
        const val = subset[i * step] ?? subset[0];
        scatterPoints.push({
          sizeVal: size,
          value: val,
        });
      }
    });

    return scatterPoints;
  }, [monteCarloData]);
  
  const handleRunMonteCarlo = async () => {
    if (!appState.priceData || !appState.analyticsData) return;
    setLoading(true);
    setError(null);
    
    try {
      // Determine weights based on selected mix
      let weights: number[];
      
      if (portfolioMix === 'equal') {
        const numAssets = appState.selectedAssets.length;
        weights = Array(numAssets).fill(1 / numAssets);
      } else if (portfolioMix === 'max_sharpe' && appState.simulationData) {
        weights = appState.simulationData.max_sharpe_portfolio.weights;
      } else if (portfolioMix === 'max_return' && appState.simulationData) {
        weights = appState.simulationData.max_return_portfolio.weights;
      } else if (portfolioMix === 'min_volatility' && appState.simulationData) {
        weights = appState.simulationData.min_volatility_portfolio.weights;
      } else if (portfolioMix === 'most_probable' && appState.simulationData?.most_probable_portfolio) {
        weights = appState.simulationData.most_probable_portfolio.weights;
      } else {
        // Default to equal weight if simulation data not available
        const numAssets = appState.selectedAssets.length;
        weights = Array(numAssets).fill(1 / numAssets);
      }
      
      // Calculate mean returns and covariance matrix from historical data
      const prices = appState.priceData.prices;
      const symbols = Object.keys(prices);
      
      // Calculate returns
      const returnsMatrix: number[][] = [];
      symbols.forEach(symbol => {
        const priceArray = prices[symbol];
        const returns: number[] = [];
        for (let i = 1; i < priceArray.length; i++) {
          returns.push((priceArray[i] - priceArray[i-1]) / priceArray[i-1]);
        }
        returnsMatrix.push(returns);
      });
      
      // Calculate mean returns (daily)
      const meanReturns = returnsMatrix.map(returns => {
        const sum = returns.reduce((a, b) => a + b, 0);
        return (sum / returns.length) * 252; // Annualized
      });
      
      // Calculate covariance matrix (daily, then annualize)
      const numAssets = symbols.length;
      const numObs = returnsMatrix[0].length;
      const covMatrix: number[][] = [];
      
      for (let i = 0; i < numAssets; i++) {
        covMatrix[i] = [];
        for (let j = 0; j < numAssets; j++) {
          let covariance = 0;
          for (let k = 0; k < numObs; k++) {
            covariance += (returnsMatrix[i][k] - meanReturns[i]/252) * 
                          (returnsMatrix[j][k] - meanReturns[j]/252);
          }
          covariance = (covariance / (numObs - 1)) * 252; // Annualized
          covMatrix[i][j] = covariance;
        }
      }
      
      const monteCarloData = await runMonteCarlo(
        weights,
        meanReturns,
        covMatrix,
        appState.initialCapital,
        timeHorizon,
        numSimulations,
        returnModel
      );
      
      setAppState(prev => ({ ...prev, monteCarloData }));
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Monte Carlo simulation failed');
      setLoading(false);
    }
  };
  
  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (!hasRequiredData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            No Analysis Data
          </h2>
          <p className="text-gray-600 mb-6">
            Please run a historical analysis from the Dashboard first
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Monte Carlo Future Scenarios
        </h1>
        <p className="text-gray-600">
          Run probability-based simulations to understand potential future outcomes and risk ranges
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {/* Configuration */}
      {!monteCarloData && (
        <div className="card mb-8">
          <h2 className="text-xl font-heading font-semibold mb-4">Simulation Parameters</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Portfolio Mix</label>
              <select
                value={portfolioMix}
                onChange={(e) => setPortfolioMix(e.target.value as any)}
                className="input"
              >
                <option value="equal">Equal Weight</option>
                {appState.simulationData && (
                  <>
                    <option value="max_sharpe">Max Sharpe (from Simulation)</option>
                    <option value="max_return">Max Return (from Simulation)</option>
                    <option value="min_volatility">Min Volatility (from Simulation)</option>
                    {appState.simulationData.most_probable_portfolio && (
                      <option value="most_probable">Most Probable (from Simulation)</option>
                    )}
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="label">Time Horizon</label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(Number(e.target.value))}
                className="input"
              >
                <option value={21}>1 Month (21 days)</option>
                <option value={126}>6 Months (126 days)</option>
                <option value={252}>1 Year (252 days)</option>
                <option value={756}>3 Years (756 days)</option>
                <option value={1260}>5 Years (1260 days)</option>
              </select>
            </div>
            
            <div>
              <label className="label">Number of Simulations</label>
              <select
                value={numSimulations}
                onChange={(e) => setNumSimulations(Number(e.target.value))}
                className="input"
              >
                <option value={1000}>1,000</option>
                <option value={5000}>5,000</option>
                <option value={10000}>10,000</option>
              </select>
            </div>
            
            <div>
              <label className="label">Return Model</label>
              <select
                value={returnModel}
                onChange={(e) => setReturnModel(e.target.value as any)}
                className="input"
              >
                <option value="normal">Normal Distribution</option>
                <option value="t-distribution">T-Distribution (Fat Tails)</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleRunMonteCarlo}
            disabled={loading}
            className="mt-6 btn btn-success w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Running Monte Carlo...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Monte Carlo Simulation
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Results */}
      {monteCarloData && (
        <>
          {/* Key Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
            <KPICard
              title="Median Outcome"
              value={formatCurrency(monteCarloData.median_final_value)}
              color="blue"
            />
            
            <KPICard
              title="Mean Outcome"
              value={formatCurrency(monteCarloData.mean_final_value)}
              color="gray"
            />
            
            <KPICard
              title="Best Case (95th)"
              value={formatCurrency(monteCarloData.percentiles['95th'])}
              color="green"
              icon={TrendingUp}
            />
            
            <KPICard
              title="Worst Case (5th)"
              value={formatCurrency(monteCarloData.percentiles['5th'])}
              color="red"
            />
            
            <KPICard
              title="Prob. of Profit"
              value={monteCarloData.probability_of_profit * 100}
              suffix="%"
              color={monteCarloData.probability_of_profit > 0.5 ? 'green' : 'red'}
            />
          </div>
          
          {/* Path Chart */}
          <ChartCard
            title="Scenario Paths"
            subtitle={`${monteCarloData.num_simulations.toLocaleString()} simulated paths over ${monteCarloData.time_horizon_days} days`}
          >
            {pathChartData.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No path data to display.</p>
            ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={pathChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  label={{ value: 'Days', position: 'bottom', offset: 0 }}
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                
                {/* Sample paths */}
                {[...Array(10)].map((_, idx) => (
                  <Line 
                    key={idx}
                    type="monotone" 
                    dataKey={`path${idx}`} 
                    stroke="#ddd" 
                    strokeWidth={1}
                    dot={false}
                    opacity={0.3}
                  />
                ))}
                
                {/* Percentile bands */}
                <Line 
                  type="monotone" 
                  dataKey="p95" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                  name="95th Percentile"
                />
                <Line 
                  type="monotone" 
                  dataKey="median" 
                  stroke="#0066FF" 
                  strokeWidth={3}
                  dot={false}
                  name="Median"
                />
                <Line 
                  type="monotone" 
                  dataKey="p5" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={false}
                  name="5th Percentile"
                />
              </LineChart>
            </ResponsiveContainer>
            )}
          </ChartCard>
          
          {/* Distribution */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <ChartCard
              title="Distribution of Final Values"
              subtitle="Histogram of possible outcomes"
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="range" 
                    stroke="#666"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis stroke="#666" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0066FF" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard
              title="Percentile Breakdown"
              subtitle="Range of possible outcomes"
            >
              <div className="space-y-3">
                {Object.entries(monteCarloData.percentiles).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">{key} Percentile</span>
                    <span className="font-bold text-gray-900">{formatCurrency(value)}</span>
                  </div>
                ))}
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-700">Value at Risk (95%)</span>
                    <span className="font-bold text-blue-900">
                      {formatCurrency(monteCarloData.value_at_risk_95)}
                    </span>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Convergence and Spread Chart */}
          <div className="mt-6">
            <ChartCard
              title="Simulation Size Convergence & Spread"
              subtitle="Comparison of raw simulated trial outcomes (Spread) and how boundaries (5th, 50th, 95th percentiles) stabilize across 1k, 5k, and 10k runs"
            >
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number" 
                    dataKey="sizeVal" 
                    name="Simulation Size"
                    domain={[0, 11000]}
                    ticks={convergenceData.map(d => d.sizeVal)}
                    tickFormatter={(val) => `${val.toLocaleString()} Runs`}
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="value" 
                    name="Final Value"
                    tickFormatter={formatCurrency}
                    stroke="#666"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  />
                  <Legend />
                  
                  {/* Raw simulated outcomes spread */}
                  <Scatter 
                    name="Simulated Trials Spread" 
                    data={scatterConvergenceData} 
                    fill="#9CA3AF" 
                    opacity={0.25}
                  />
                  
                  {/* Median line */}
                  <Scatter 
                    name="Median (50th Percentile)" 
                    data={convergenceData.map(d => ({ sizeVal: d.sizeVal, value: d.median }))} 
                    fill="#0066FF" 
                    shape="circle"
                    line={{ stroke: '#0066FF', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />

                  {/* 95th percentile line */}
                  <Scatter 
                    name="95th Percentile (Best Case)" 
                    data={convergenceData.map(d => ({ sizeVal: d.sizeVal, value: d.p95 }))} 
                    fill="#10B981" 
                    shape="triangle"
                    line={{ stroke: '#10B981', strokeWidth: 2 }}
                  />

                  {/* 5th percentile line */}
                  <Scatter 
                    name="5th Percentile (Worst Case)" 
                    data={convergenceData.map(d => ({ sizeVal: d.sizeVal, value: d.p5 }))} 
                    fill="#EF4444" 
                    shape="wye"
                    line={{ stroke: '#EF4444', strokeWidth: 2 }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          
          {/* Important Note */}
          <div className="mt-6 card bg-yellow-50 border-yellow-200">
            <h3 className="font-heading font-semibold text-yellow-900 mb-2">
              Important: Understanding Monte Carlo Simulations
            </h3>
            <p className="text-sm text-yellow-800">
              Monte Carlo simulations estimate a probability range based on historical behavior and assumptions. 
              They do NOT predict the future. Actual returns may differ significantly from these scenarios due to 
              changing market conditions, unforeseen events, and model limitations. Use these results as one input 
              among many for decision-making, not as a guarantee of future performance.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-6 flex gap-4 justify-center">
            <button
              onClick={() => setAppState(prev => ({ ...prev, monteCarloData: null }))}
              className="btn btn-secondary"
            >
              Run New Simulation
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MonteCarloSim;
