import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Globe, LineChart, BarChart3, TrendingUp, Shield, BookOpen } from 'lucide-react';
import { getGlobalDemo } from '../services/api';
import type { AppState, SelectedAsset } from '../types';

interface HomeProps {
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const Home = ({ setAppState }: HomeProps) => {
  const navigate = useNavigate();
  
  const handleLoadDemo = async () => {
    try {
      const demo = await getGlobalDemo();
      
      const selectedAssets: SelectedAsset[] = demo.assets.map((asset: any) => ({
        ...asset,
        id: `${asset.yahoo_symbol}-${Date.now()}-${Math.random()}`,
      }));
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 3); // 3 years historical data
      
      setAppState(prev => ({
        ...prev,
        selectedAssets,
        benchmark: demo.benchmark,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        weights: Array(demo.assets.length).fill(1 / demo.assets.length),
        error: null,
      }));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error loading demo portfolio from Home page:', error);
      alert('Failed to load demo portfolio. Navigating to Dashboard.');
      navigate('/dashboard');
    }
  };
  const features = [
    {
      icon: Globe,
      title: 'Global Asset Search',
      description: 'Search Yahoo Finance for any listed stock, ETF, index, or crypto — real symbols only, no guessed tickers',
    },
    {
      icon: LineChart,
      title: 'Historical Risk-Return Analysis',
      description: 'Calculate returns, volatility, Sharpe ratios, drawdowns, and correlations using proper covariance matrix mathematics',
    },
    {
      icon: BarChart3,
      title: 'Portfolio Allocation Simulation',
      description: 'Test thousands of allocation combinations to identify historically strong and efficient portfolios',
    },
    {
      icon: TrendingUp,
      title: 'Monte Carlo Future Scenarios',
      description: 'Run probability-based simulations to understand potential future outcomes and risk ranges',
    },
    {
      icon: Shield,
      title: 'Benchmark & Alpha Tracking',
      description: 'Compare your portfolio against any market index and calculate historical alpha performance',
    },
    {
      icon: BookOpen,
      title: 'Educational Methodology',
      description: 'Learn the formulas and concepts behind every calculation in student-friendly language',
    },
  ];
  
  const workflow = [
    'Search and select global assets',
    'Choose date range and benchmark',
    'Analyze historical performance',
    'Simulate allocation combinations',
    'Run Monte Carlo future scenarios',
  ];
  
  const supportedAssets = [
    'Indian Stocks (NSE/BSE)',
    'US Stocks (NYSE/NASDAQ)',
    'Global Indices',
    'ETFs',
    'Cryptocurrencies',
    'Commodities',
  ];
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-brand text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-heading font-bold mb-6">
              Smart Allocation Lab
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              Analyze, simulate, and understand diversified portfolios using historical data, statistics, and Monte Carlo simulation
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/dashboard" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-navy rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Start Analysis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button 
                onClick={handleLoadDemo}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-brand-navy transition-colors"
              >
                Run Demo Portfolio
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            Platform Features
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card card-hover">
                  <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-blue" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Workflow Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            How It Works
          </h2>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            {workflow.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                </div>
                <p className="text-gray-700 font-medium">{step}</p>
                {index < workflow.length - 1 && (
                  <ArrowRight className="hidden md:block w-5 h-5 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Supported Assets */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-heading font-bold text-center mb-12">
            Supported Asset Classes
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {supportedAssets.map((asset, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-brand-teal rounded-full"></div>
                <span className="font-medium text-gray-800">{asset}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Disclaimer */}
      <section className="py-12 bg-yellow-50 border-y border-yellow-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-yellow-900 font-medium">
            ⚠️ Important: Historical simulations are educational and are not financial advice. 
            Future returns are uncertain. This platform does not execute trades or provide 
            guaranteed investment returns.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
