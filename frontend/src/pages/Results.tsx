import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart3, AlertTriangle } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import type { AppState } from '../types';

interface ResultsProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Results = ({ appState }: ResultsProps) => {
  const navigate = useNavigate();
  
  // Check if data exists
  if (!appState.analyticsData || !appState.priceData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            No Analysis Data
          </h2>
          <p className="text-gray-600 mb-6">
            Please run an analysis from the Dashboard first
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-primary"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }
  
  const { analyticsData, priceData } = appState;
  const { portfolio_metrics, asset_metrics, cumulative_returns, portfolio_values, drawdown_series, correlation_matrix } = analyticsData;
  
  // Prepare chart data
  const cumulativeReturnsData = useMemo(() => {
    return priceData.dates.map((date, idx) => {
      const dataPoint: any = { date };
      Object.keys(cumulative_returns).forEach(symbol => {
        dataPoint[symbol] = cumulative_returns[symbol][idx];
      });
      return dataPoint;
    });
  }, [priceData.dates, cumulative_returns]);
  
  const portfolioValueData = useMemo(() => {
    return priceData.dates.map((date, idx) => ({
      date,
      value: portfolio_values[idx],
    }));
  }, [priceData.dates, portfolio_values]);
  
  const drawdownData = useMemo(() => {
    return priceData.dates.map((date, idx) => ({
      date,
      drawdown: drawdown_series[idx] * 100,
    }));
  }, [priceData.dates, drawdown_series]);
  
  const assetMetricsData = useMemo(() => {
    return asset_metrics.map(metric => ({
      name: metric.symbol,
      return: metric.cagr * 100,
      volatility: metric.annualized_volatility * 100,
      sharpe: metric.sharpe_ratio,
    }));
  }, [asset_metrics]);
  
  // Correlation heatmap data
  const symbols = appState.selectedAssets.map(a => a.yahoo_symbol);
  
  // Format functions
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;
  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Historical Analytics Results
        </h1>
        <p className="text-gray-600">
          Analysis period: {priceData.metadata.start_date} to {priceData.metadata.end_date} 
          ({priceData.metadata.total_days} trading days)
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KPICard
          title="Portfolio Return"
          value={(portfolio_metrics.total_return * 100).toFixed(2)}
          suffix="%"
          icon={TrendingUp}
          trend={portfolio_metrics.total_return > 0 ? 'up' : 'down'}
          color={portfolio_metrics.total_return > 0 ? 'green' : 'red'}
        />
        
        <KPICard
          title="CAGR"
          value={(portfolio_metrics.cagr * 100).toFixed(2)}
          suffix="%"
          subtitle="Annualized"
          icon={Activity}
          color="blue"
        />
        
        <KPICard
          title="Volatility"
          value={(portfolio_metrics.annualized_volatility * 100).toFixed(2)}
          suffix="%"
          subtitle="Annualized"
          icon={BarChart3}
          color="orange"
        />
        
        <KPICard
          title="Sharpe Ratio"
          value={portfolio_metrics.sharpe_ratio.toFixed(2)}
          subtitle="Risk-adjusted"
          color={portfolio_metrics.sharpe_ratio > 1 ? 'green' : 'gray'}
        />
        
        <KPICard
          title="Max Drawdown"
          value={(portfolio_metrics.max_drawdown * 100).toFixed(2)}
          suffix="%"
          icon={TrendingDown}
          trend="down"
          color="red"
        />
        
        {portfolio_metrics.alpha !== undefined && portfolio_metrics.alpha !== null && (
          <KPICard
            title="Alpha"
            value={(portfolio_metrics.alpha * 100).toFixed(2)}
            suffix="%"
            subtitle="vs Benchmark"
            trend={portfolio_metrics.alpha > 0 ? 'up' : 'down'}
            color={portfolio_metrics.alpha > 0 ? 'green' : 'red'}
          />
        )}
        
        {(portfolio_metrics.alpha === undefined || portfolio_metrics.alpha === null) && (
          <KPICard
            title="Final Value"
            value={formatCurrency(portfolio_metrics.final_value)}
            subtitle={`Initial: ${formatCurrency(appState.initialCapital)}`}
            icon={DollarSign}
            color="blue"
          />
        )}
      </div>
      
      {/* Charts Grid */}
      <div className="space-y-6">
        
        {/* Portfolio Value Chart */}
        <ChartCard
          title="Portfolio Growth"
          subtitle="Historical value of initial capital over time"
        >
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={portfolioValueData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={formatDate}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#0066FF" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Cumulative Returns Chart */}
        <ChartCard
          title="Cumulative Returns Comparison"
          subtitle="Percentage returns for each asset and portfolio"
        >
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={cumulativeReturnsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={formatPercent}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => formatPercent(value)}
                labelFormatter={formatDate}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {Object.keys(cumulative_returns).map((symbol, idx) => (
                <Line 
                  key={symbol}
                  type="monotone" 
                  dataKey={symbol} 
                  stroke={`hsl(${idx * 360 / Object.keys(cumulative_returns).length}, 70%, 50%)`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Drawdown Chart */}
        <ChartCard
          title="Portfolio Drawdown"
          subtitle="Decline from peak value over time"
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={formatPercent}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => formatPercent(value)}
                labelFormatter={formatDate}
              />
              <Area 
                type="monotone" 
                dataKey="drawdown" 
                stroke="#EF4444" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorDrawdown)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Risk vs Return Scatter */}
        <ChartCard
          title="Risk vs Historical Return"
          subtitle="Annualized volatility (risk) vs CAGR (return) for each asset"
        >
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart margin={{ top: 20, right: 30, bottom: 80, left: 45 }}>
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
                tickFormatter={formatPercent}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                type="number" 
                dataKey="return" 
                name="Return"
                label={{ 
                  value: 'CAGR (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  offset: -20,
                  style: { fontSize: '14px', fill: '#666', textAnchor: 'middle' }
                }}
                tickFormatter={formatPercent}
                stroke="#666"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                formatter={(value: number) => formatPercent(value)}
                cursor={{ strokeDasharray: '3 3' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              <Scatter name="Assets" data={assetMetricsData} fill="#0066FF">
                {assetMetricsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 360 / assetMetricsData.length}, 70%, 50%)`} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
        
        {/* Asset Metrics Table */}
        <ChartCard
          title="Asset Performance Metrics"
          subtitle="Detailed metrics for each asset in the portfolio"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Return
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CAGR
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volatility
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sharpe
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max DD
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Best Day
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Worst Day
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {asset_metrics.map((metric) => (
                  <tr key={metric.symbol} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {metric.symbol}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm text-right ${
                      metric.total_return > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(metric.total_return * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {(metric.cagr * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {(metric.annualized_volatility * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                      {metric.sharpe_ratio.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                      {(metric.max_drawdown * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600">
                      {(metric.best_day * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600">
                      {(metric.worst_day * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
        
        {/* Correlation Matrix */}
        <ChartCard
          title="Correlation Matrix"
          subtitle="Correlation between assets - useful for understanding diversification"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th className="px-2 py-2 text-xs font-medium text-gray-500 text-left" style={{ width: '90px' }}></th>
                  {symbols.map(symbol => (
                    <th key={symbol} className="px-2 py-2 text-xs font-medium text-gray-500 text-center" style={{ width: '60px' }}>
                      {symbol}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation_matrix.map((row, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2 text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis" style={{ width: '90px', height: '60px' }}>
                      {symbols[i]}
                    </td>
                    {row.map((value, j) => {
                      const intensity = Math.abs(value);
                      const color = value > 0 
                        ? `rgba(0, 102, 255, ${intensity})` 
                        : `rgba(239, 68, 68, ${intensity})`;
                      
                      return (
                        <td 
                          key={j} 
                          className="px-2 py-2 text-xs text-center border border-white"
                          style={{ backgroundColor: color, width: '60px', height: '60px' }}
                        >
                          <span className={intensity > 0.5 ? 'text-white font-medium' : 'text-gray-700'}>
                            {value.toFixed(2)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Values close to 1 (blue) indicate strong positive correlation. Values close to -1 (red) indicate negative correlation. 
            Lower correlation generally means better diversification.
          </p>
        </ChartCard>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => navigate('/simulation')}
          className="btn btn-primary"
        >
          Run Allocation Simulation
        </button>
        <button
          onClick={() => navigate('/montecarlo')}
          className="btn btn-secondary"
        >
          Run Monte Carlo
        </button>
      </div>
    </div>
  );
};

export default Results;
