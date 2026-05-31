import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Calendar, DollarSign, TrendingUp, Upload, Play, Loader } from 'lucide-react';
import type { AppState, Asset, Benchmark, SelectedAsset, DateRangePreset } from '../types';
import { 
  searchAssets, 
  searchBenchmarks, 
  fetchMarketData, 
  getRiskFreeRate,
  getIndianDemo,
  getGlobalDemo,
  calculateAnalytics 
} from '../services/api';

interface DashboardProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Dashboard = ({ appState, setAppState }: DashboardProps) => {
  const navigate = useNavigate();
  
  // Local state
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetSearchResults, setAssetSearchResults] = useState<Asset[]>([]);
  const [benchmarkSearchQuery, setBenchmarkSearchQuery] = useState('');
  const [benchmarkSearchResults, setBenchmarkSearchResults] = useState<Benchmark[]>([]);
  const [showAssetSearch, setShowAssetSearch] = useState(false);
  const [showBenchmarkSearch, setShowBenchmarkSearch] = useState(false);
  const [riskFreeMode, setRiskFreeMode] = useState<'auto' | 'manual'>('manual');
  
  // Search assets
  const handleAssetSearch = async (query: string) => {
    setAssetSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await searchAssets(query);
        setAssetSearchResults(results);
      } catch (error) {
        console.error('Asset search error:', error);
      }
    } else {
      setAssetSearchResults([]);
    }
  };
  
  // Add asset
  const handleAddAsset = (asset: Asset) => {
    if (appState.selectedAssets.length >= 15) {
      alert('Maximum 15 assets allowed for this simulation to maintain calculation stability');
      return;
    }
    
    // Check if already added
    if (appState.selectedAssets.some(a => a.yahoo_symbol === asset.yahoo_symbol)) {
      return;
    }
    
    const newAsset: SelectedAsset = {
      ...asset,
      id: `${asset.yahoo_symbol}-${Date.now()}`,
    };
    
    setAppState(prev => ({
      ...prev,
      selectedAssets: [...prev.selectedAssets, newAsset],
    }));
    
    setAssetSearchQuery('');
    setAssetSearchResults([]);
    setShowAssetSearch(false);
  };
  
  // Remove asset
  const handleRemoveAsset = (id: string) => {
    setAppState(prev => ({
      ...prev,
      selectedAssets: prev.selectedAssets.filter(a => a.id !== id),
    }));
  };
  
  // Search benchmarks
  const handleBenchmarkSearch = async (query: string) => {
    setBenchmarkSearchQuery(query);
    if (query.length >= 2) {
      try {
        const results = await searchBenchmarks(query);
        setBenchmarkSearchResults(results);
      } catch (error) {
        console.error('Benchmark search error:', error);
      }
    } else {
      setBenchmarkSearchResults([]);
    }
  };
  
  // Select benchmark
  const handleSelectBenchmark = (benchmark: Benchmark) => {
    setAppState(prev => ({
      ...prev,
      benchmark,
    }));
    setBenchmarkSearchQuery('');
    setBenchmarkSearchResults([]);
    setShowBenchmarkSearch(false);
  };
  
  // Date range preset buttons
  const handleDatePreset = (preset: DateRangePreset) => {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (preset) {
      case '6M':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '3Y':
        startDate.setFullYear(endDate.getFullYear() - 3);
        break;
      case '5Y':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case '7Y':
        startDate.setFullYear(endDate.getFullYear() - 7);
        break;
      case '10Y':
        startDate.setFullYear(endDate.getFullYear() - 10);
        break;
      case 'MAX':
        startDate.setFullYear(endDate.getFullYear() - 20);
        break;
    }
    
    setAppState(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  };
  
  // Auto fetch risk-free rate
  const handleAutoRiskFree = async () => {
    try {
      const market = appState.benchmark?.market.toLowerCase() || 'us';
      const result = await getRiskFreeRate(market);
      setAppState(prev => ({
        ...prev,
        riskFreeRate: result.rate,
        riskFreeSource: result.source as any,
      }));
    } catch (error) {
      console.error('Error fetching risk-free rate:', error);
      alert('Could not fetch automatic risk-free rate. Please enter manually.');
    }
  };
  
  // Load demo portfolio
  const handleLoadDemo = async (type: 'indian' | 'global') => {
    try {
      const demo = type === 'indian' ? await getIndianDemo() : await getGlobalDemo();
      
      const selectedAssets: SelectedAsset[] = demo.assets.map((asset: any) => ({
        ...asset,
        id: `${asset.yahoo_symbol}-${Date.now()}-${Math.random()}`,
      }));
      
      setAppState(prev => ({
        ...prev,
        selectedAssets,
        benchmark: demo.benchmark,
      }));
    } catch (error) {
      console.error('Error loading demo:', error);
      alert('Failed to load demo portfolio');
    }
  };
  
  // Run analysis
  const handleRunAnalysis = async () => {
    // Validation
    if (appState.selectedAssets.length === 0) {
      alert('Please select at least one asset');
      return;
    }
    
    if (!appState.startDate || !appState.endDate) {
      alert('Please select a date range');
      return;
    }
    
    if (new Date(appState.startDate) >= new Date(appState.endDate)) {
      alert('End date must be after start date');
      return;
    }
    
    setAppState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Fetch market data
      const symbols = appState.selectedAssets.map(a => a.yahoo_symbol);
      const benchmarkSymbol = appState.benchmark?.yahoo_symbol;
      
      const priceData = await fetchMarketData(
        symbols,
        appState.startDate,
        appState.endDate,
        benchmarkSymbol
      );
      
      if (priceData.metadata.total_days < 30) {
        throw new Error('Insufficient data: Minimum 30 overlapping trading days required');
      }
      
      // Calculate analytics
      const analyticsData = await calculateAnalytics(
        symbols,
        priceData.prices,
        priceData.dates,
        appState.weights.length > 0 ? appState.weights : undefined,
        priceData.benchmark_prices,
        appState.riskFreeRate,
        appState.initialCapital
      );
      
      setAppState(prev => ({
        ...prev,
        priceData,
        analyticsData,
        loading: false,
      }));
      
      // Navigate to results
      navigate('/results');
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      setAppState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.detail || error.message || 'Failed to run analysis',
      }));
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Portfolio Configuration
        </h1>
        <p className="text-gray-600">
          Search and select assets, choose your analysis period, and configure portfolio parameters
        </p>
      </div>
      
      {/* Error Display */}
      {appState.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{appState.error}</p>
        </div>
      )}
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Asset Selection */}
          <div className="card">
            <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-brand-blue" />
              Select Assets
            </h2>
            
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Yahoo Finance (e.g., RIL, Reliance, AAPL, BTC, Nifty...)"
                  value={assetSearchQuery}
                  onChange={(e) => handleAssetSearch(e.target.value)}
                  onFocus={() => setShowAssetSearch(true)}
                  className="input"
                />
                
                {/* Search results dropdown */}
                {showAssetSearch && assetSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {assetSearchResults.map((asset, index) => (
                      <button
                        key={index}
                        onClick={() => handleAddAsset(asset)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {asset.display_name}
                        </div>
                        <div className="text-sm text-gray-500 flex gap-2">
                          <span>{asset.display_symbol}</span>
                          <span>•</span>
                          <span>{asset.exchange}</span>
                          <span>•</span>
                          <span>{asset.asset_type}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Selected assets */}
              {appState.selectedAssets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {appState.selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="chip chip-removable"
                      onClick={() => handleRemoveAsset(asset.id)}
                    >
                      <span>{asset.display_symbol}</span>
                      <span className="text-xs opacity-70">{asset.exchange}</span>
                      <X className="w-4 h-4" />
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                {appState.selectedAssets.length} / 15 assets selected
              </div>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="card">
            <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-blue" />
              Analysis Period
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    value={appState.startDate}
                    onChange={(e) => setAppState(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    value={appState.endDate}
                    onChange={(e) => setAppState(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              
              {/* Quick range buttons */}
              <div className="flex flex-wrap gap-2">
                {['6M', '1Y', '3Y', '5Y', '7Y', '10Y', 'MAX'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleDatePreset(preset as DateRangePreset)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Benchmark Selection */}
          <div className="card">
            <h2 className="text-xl font-heading font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-blue" />
              Benchmark
            </h2>
            
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search benchmark (e.g., Nifty, S&P 500, Bitcoin...)"
                  value={benchmarkSearchQuery}
                  onChange={(e) => handleBenchmarkSearch(e.target.value)}
                  onFocus={() => setShowBenchmarkSearch(true)}
                  className="input"
                />
                
                {showBenchmarkSearch && benchmarkSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {benchmarkSearchResults.map((benchmark, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectBenchmark(benchmark)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {benchmark.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {benchmark.display_symbol} • {benchmark.market}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {appState.benchmark && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium text-blue-900">
                      {appState.benchmark.display_name}
                    </div>
                    <div className="text-sm text-blue-700">
                      {appState.benchmark.display_symbol}
                    </div>
                  </div>
                  <button
                    onClick={() => setAppState(prev => ({ ...prev, benchmark: null }))}
                    className="p-1 hover:bg-blue-100 rounded"
                  >
                    <X className="w-4 h-4 text-blue-700" />
                  </button>
                </div>
              )}
              
              <p className="text-sm text-gray-500">
                Benchmark is the reference asset or index against which the portfolio is compared to calculate alpha
              </p>
            </div>
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Portfolio Parameters */}
          <div className="card">
            <h3 className="font-heading font-semibold mb-4">Parameters</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Initial Capital
                </label>
                <input
                  type="number"
                  value={appState.initialCapital}
                  onChange={(e) => setAppState(prev => ({ ...prev, initialCapital: Number(e.target.value) }))}
                  className="input"
                  min="1000"
                  step="10000"
                />
              </div>
              
              <div>
                <label className="label">Risk-Free Rate</label>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setRiskFreeMode('auto')}
                    className={`px-3 py-1 text-sm rounded ${
                      riskFreeMode === 'auto' ? 'bg-brand-blue text-white' : 'bg-gray-100'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setRiskFreeMode('manual')}
                    className={`px-3 py-1 text-sm rounded ${
                      riskFreeMode === 'manual' ? 'bg-brand-blue text-white' : 'bg-gray-100'
                    }`}
                  >
                    Manual
                  </button>
                </div>
                
                {riskFreeMode === 'auto' ? (
                  <button
                    onClick={handleAutoRiskFree}
                    className="w-full btn btn-secondary"
                  >
                    Fetch Auto Rate
                  </button>
                ) : (
                  <input
                    type="number"
                    value={parseFloat((appState.riskFreeRate * 100).toFixed(6))}
                    onChange={(e) => setAppState(prev => ({ ...prev, riskFreeRate: Number(e.target.value) / 100 }))}
                    className="input"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  Current: {(appState.riskFreeRate * 100).toFixed(2)}% ({appState.riskFreeSource})
                </p>
              </div>
            </div>
          </div>
          
          {/* Demo Portfolios */}
          <div className="card">
            <h3 className="font-heading font-semibold mb-4">Demo Portfolios</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handleLoadDemo('indian')}
                className="w-full btn btn-secondary text-left"
              >
                Load Indian Demo
              </button>
              <button
                onClick={() => handleLoadDemo('global')}
                className="w-full btn btn-secondary text-left"
              >
                Load Global Demo
              </button>
            </div>
          </div>
          
          {/* Run Analysis Button */}
          <button
            onClick={handleRunAnalysis}
            disabled={appState.loading || appState.selectedAssets.length === 0}
            className="w-full btn btn-success flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {appState.loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
