import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Play, Loader, AlertTriangle, TrendingUp, Shield, Activity } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import type { AppState } from '../types';
import { runSimulation } from '../services/api';

interface AllocationSimProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, value, name } = props;
  const RADIAN = Math.PI / 180;
  // Coordinates for the line starting point (on the outer radius of the slice)
  const radius = outerRadius + 8;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Coordinates for the label text (further out)
  const textRadius = outerRadius + 18;
  const tx = cx + textRadius * Math.cos(-midAngle * RADIAN);
  
  // Text anchor alignment based on angle
  const textAnchor = tx > cx ? 'start' : 'end';
  
  // Drawing an elegant line from slice to label
  const lineX1 = cx + outerRadius * Math.cos(-midAngle * RADIAN);
  const lineY1 = cy + outerRadius * Math.sin(-midAngle * RADIAN);
  
  if (value < 0.5) return null; // Don't show labels for extremely small slices (<0.5%) to keep it clean
  
  return (
    <g>
      <path 
        d={`M${lineX1},${lineY1} L${x},${y} L${tx > cx ? x + 6 : x - 6},${y}`} 
        stroke="#94A3B8" 
        strokeWidth={1.2}
        fill="none" 
      />
      <circle cx={lineX1} cy={lineY1} r={2} fill="#64748B" />
      <text 
        x={tx > cx ? x + 10 : x - 10} 
        y={y} 
        textAnchor={textAnchor} 
        fill="#334155" 
        fontSize="11px"
        fontWeight="600"
        dominantBaseline="central"
      >
        {`${name} (${value.toFixed(1)}%)`}
      </text>
    </g>
  );
};

const AllocationSim = ({ appState, setAppState }: AllocationSimProps) => {
  const navigate = useNavigate();
  const [numSimulations, setNumSimulations] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check if we have the necessary data
  if (!appState.priceData || !appState.analyticsData) {
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
  
  const handleRunSimulation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculate returns from prices
      const prices = appState.priceData!.prices;
      const symbols = Object.keys(prices);
      const returnsData: Record<string, number[]> = {};
      
      symbols.forEach(symbol => {
        const priceArray = prices[symbol];
        const returns: number[] = [];
        for (let i = 1; i < priceArray.length; i++) {
          returns.push((priceArray[i] - priceArray[i-1]) / priceArray[i-1]);
        }
        returnsData[symbol] = returns;
      });
      
      // Get benchmark return if available
      let benchmarkReturn: number | undefined;
      if (appState.analyticsData?.portfolio_metrics.alpha !== undefined && 
          appState.analyticsData?.portfolio_metrics.alpha !== null && 
          appState.benchmark) {
        benchmarkReturn = appState.analyticsData.portfolio_metrics.annualized_return - 
                         appState.analyticsData.portfolio_metrics.alpha;
      }
      
      const simulationData = await runSimulation(
        symbols,
        returnsData,
        numSimulations,
        appState.riskFreeRate,
        benchmarkReturn
      );
      
      setAppState(prev => ({ ...prev, simulationData }));
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Simulation failed');
      setLoading(false);
    }
  };
  
  const { simulationData } = appState;
  
  // Prepare scatter plot data
  const scatterData = useMemo(() => {
    if (!simulationData) return [];
    return simulationData.all_portfolios.slice(0, 5000).map(p => ({
      volatility: p.annualized_volatility * 100,
      return: p.annualized_return * 100,
      sharpe: p.sharpe_ratio,
    }));
  }, [simulationData]);

  // Map to visual color gradient by Sharpe Ratio
  const coloredScatterData = useMemo(() => {
    if (scatterData.length === 0) return [];
    const sharpes = scatterData.map(d => d.sharpe);
    const minSharpe = Math.min(...sharpes);
    const maxSharpe = Math.max(...sharpes);
    const range = maxSharpe > minSharpe ? maxSharpe - minSharpe : 1;

    return scatterData.map(d => {
      const t = (d.sharpe - minSharpe) / range;
      // Beautiful gradient matching Seaborn's viridis/plasma style (dark purple -> green -> bright yellow)
      const hue = 280 - t * 220;
      const color = `hsl(${hue}, 85%, 50%)`;
      return {
        ...d,
        color,
      };
    });
  }, [scatterData]);
  
  
  // Prepare highlighted portfolios data
  const highlightedPortfolios = useMemo(() => {
    if (!simulationData) return [];
    
    const portfolios = [
      { name: 'Max Return', data: simulationData.max_return_portfolio, color: '#10B981' },
      { name: 'Max Sharpe', data: simulationData.max_sharpe_portfolio, color: '#0066FF' },
      { name: 'Min Volatility', data: simulationData.min_volatility_portfolio, color: '#F59E0B' },
    ];
    
    if (simulationData.max_alpha_portfolio) {
      portfolios.push({ name: 'Max Alpha', data: simulationData.max_alpha_portfolio, color: '#8B5CF6' });
    }
    
    if (simulationData.most_probable_portfolio) {
      portfolios.push({ name: 'Most Probable', data: simulationData.most_probable_portfolio, color: '#EF4444' });
    }
    
    return portfolios;
  }, [simulationData]);
  
  // Prepare pie chart data for a selected portfolio
  const [selectedPortfolio, setSelectedPortfolio] = useState<'max_return' | 'max_sharpe' | 'min_volatility' | 'most_probable'>('max_sharpe');
  
  const pieChartData = useMemo(() => {
    if (!simulationData) return [];
    
    let portfolio = simulationData.max_sharpe_portfolio;
    if (selectedPortfolio === 'max_return') portfolio = simulationData.max_return_portfolio;
    if (selectedPortfolio === 'min_volatility') portfolio = simulationData.min_volatility_portfolio;
    if (selectedPortfolio === 'most_probable' && simulationData.most_probable_portfolio) {
      portfolio = simulationData.most_probable_portfolio;
    }
    
    return portfolio.weights.map((weight, idx) => ({
      name: appState.selectedAssets[idx].display_symbol,
      value: weight * 100,
    }));
  }, [simulationData, selectedPortfolio, appState.selectedAssets]);
  
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  
  const COLORS = ['#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Portfolio Allocation Simulation
        </h1>
        <p className="text-gray-600">
          Test thousands of random allocation combinations to identify historically strong and efficient portfolios
        </p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {/* Configuration */}
      {!simulationData && (
        <div className="card mb-8">
          <h2 className="text-xl font-heading font-semibold mb-4">Simulation Parameters</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
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
                <option value={25000}>25,000</option>
                <option value={50000}>50,000</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                More simulations provide better coverage but take longer to compute
              </p>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleRunSimulation}
                disabled={loading}
                className="btn btn-success w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Running {numSimulations.toLocaleString()} Simulations...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Run Allocation Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Results */}
      {simulationData && (
        <>
          {/* Highlighted Portfolios KPIs */}
          <div className="mb-8">
            <h2 className="text-xl font-heading font-semibold mb-4">Optimal Portfolios for future allocations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="text-sm font-medium text-green-700 mb-2">Max Historical Return</div>
                <div className="text-2xl font-bold text-green-900 mb-1">
                  {(simulationData.max_return_portfolio.annualized_return * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-green-600">
                  Sharpe: {simulationData.max_return_portfolio.sharpe_ratio.toFixed(2)} | 
                  Vol: {(simulationData.max_return_portfolio.annualized_volatility * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="text-sm font-medium text-blue-700 mb-2">Max Sharpe Ratio</div>
                <div className="text-2xl font-bold text-blue-900 mb-1">
                  {simulationData.max_sharpe_portfolio.sharpe_ratio.toFixed(2)}
                </div>
                <div className="text-xs text-blue-600">
                  Return: {(simulationData.max_sharpe_portfolio.annualized_return * 100).toFixed(1)}% | 
                  Vol: {(simulationData.max_sharpe_portfolio.annualized_volatility * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="text-sm font-medium text-orange-700 mb-2">Min Volatility</div>
                <div className="text-2xl font-bold text-orange-900 mb-1">
                  {(simulationData.min_volatility_portfolio.annualized_volatility * 100).toFixed(2)}%
                </div>
                <div className="text-xs text-orange-600">
                  Return: {(simulationData.min_volatility_portfolio.annualized_return * 100).toFixed(1)}% | 
                  Sharpe: {simulationData.min_volatility_portfolio.sharpe_ratio.toFixed(2)}
                </div>
              </div>
              
              {simulationData.most_probable_portfolio && (
                <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="text-sm font-medium text-purple-700 mb-2">Most Probable Mix</div>
                  <div className="text-2xl font-bold text-purple-900 mb-1">
                    {(simulationData.most_probable_portfolio.annualized_return * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-purple-600">
                    Sharpe: {simulationData.most_probable_portfolio.sharpe_ratio.toFixed(2)} | 
                    Vol: {(simulationData.most_probable_portfolio.annualized_volatility * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Efficient Frontier Scatter Plot */}
          <ChartCard
            title="Efficient Frontier"
            subtitle={`${simulationData.all_portfolios.length.toLocaleString()} simulated portfolio combinations`}
          >
            <ResponsiveContainer width="100%" height={450}>
              <ScatterChart margin={{ top: 20, right: 30, bottom: 70, left: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  dataKey="volatility" 
                  name="Volatility"
                  label={{ 
                    value: 'Annualized Volatility (%)', 
                    position: 'bottom',
                    offset: 50,
                    style: { fontSize: '14px', fill: '#666' }
                  }}
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  type="number" 
                  dataKey="return" 
                  name="Return"
                  label={{ 
                    value: 'Annualized Return (%)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -20,
                    style: { fontSize: '14px', fill: '#666', textAnchor: 'middle' }
                  }}
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  formatter={(value: number) => formatPercent(value)}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter name="All Portfolios" data={coloredScatterData} opacity={0.4}>
                  {coloredScatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
                
                {highlightedPortfolios.map((portfolio, idx) => (
                  <Scatter 
                    key={idx}
                    name={portfolio.name}
                    data={[{
                      volatility: portfolio.data.annualized_volatility * 100,
                      return: portfolio.data.annualized_return * 100,
                      sharpe: portfolio.data.sharpe_ratio,
                    }]}
                    fill={portfolio.color}
                    shape="star"
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
          
          {/* Allocation Breakdown */}
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <ChartCard
              title="Portfolio Allocation"
              subtitle="Weight distribution for selected portfolio"
              actions={
                <select
                  value={selectedPortfolio}
                  onChange={(e) => setSelectedPortfolio(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="max_sharpe">Max Sharpe</option>
                  <option value="max_return">Max Return</option>
                  <option value="min_volatility">Min Volatility</option>
                  {simulationData.most_probable_portfolio && (
                    <option value="most_probable">Most Probable</option>
                  )}
                </select>
              }
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(2)}%`} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            
            <ChartCard
              title="Weight Details"
              subtitle="Exact allocation percentages"
            >
              <div className="space-y-2">
                {pieChartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {item.value.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
          
          {/* Most Probable Mix Explanation */}
          {simulationData.most_probable_portfolio && (
            <div className="mt-6 card bg-purple-50 border-purple-200">
              <h3 className="font-heading font-semibold text-purple-900 mb-2">
                About Most Probable Mix
              </h3>
              <p className="text-sm text-purple-800">
                This mix appeared most consistently among strong historical outcomes under the selected data and constraints. 
                It is identified by testing portfolios across multiple rolling time windows and finding the allocation that 
                performs well across different market conditions. This is NOT a future guarantee, but represents a historically 
                robust allocation strategy.
              </p>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => setAppState(prev => ({ ...prev, simulationData: null }))}
              className="btn btn-secondary"
            >
              Run New Simulation
            </button>
            <button
              onClick={() => navigate('/montecarlo')}
              className="btn btn-primary"
            >
              Run Monte Carlo with These Results
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllocationSim;
