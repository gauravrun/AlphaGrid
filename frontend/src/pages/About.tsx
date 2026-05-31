import { Shield, AlertTriangle, Info, Code, Heart } from 'lucide-react';

const About = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          About Smart Allocation Lab
        </h1>
        <p className="text-gray-600">
          Educational portfolio analytics platform
        </p>
      </div>
      
      {/* Critical Disclaimer */}
      <div className="card bg-yellow-50 border-yellow-300 border-2 mb-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-yellow-700 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-heading font-bold text-yellow-900 mb-3">
              Important Disclaimer
            </h2>
            
            <div className="space-y-3 text-yellow-900">
              <p className="font-semibold">
                This platform is for educational and analytical purposes only. It is NOT financial advice.
              </p>
              
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Historical simulations do not predict or guarantee future returns</li>
                <li>All investments carry risk, including the risk of losing your entire investment</li>
                <li>Past performance is not indicative of future results</li>
                <li>This platform does not execute trades or connect to brokers</li>
                <li>We do not provide personalized investment recommendations</li>
                <li>Consult a qualified financial advisor before making investment decisions</li>
                <li>Market conditions, regulations, and risks can change at any time</li>
              </ul>
              
              <p className="text-sm font-medium pt-3 border-t border-yellow-300">
                By using this platform, you acknowledge that you understand these risks and limitations.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* What This Platform Does */}
      <div className="card mb-8">
        <div className="flex items-start gap-4 mb-4">
          <Info className="w-6 h-6 text-brand-blue flex-shrink-0" />
          <div>
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
              What Smart Allocation Lab Does
            </h2>
          </div>
        </div>
        
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Historical Analysis</h3>
            <p className="text-sm">
              Fetches historical price data and calculates risk-return statistics using proper quantitative formulas. 
              Includes returns, volatility, Sharpe ratios, correlations, and drawdowns.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Allocation Simulation</h3>
            <p className="text-sm">
              Tests thousands of random portfolio weight combinations to identify historically strong allocation mixes 
              based on return, risk-adjusted return (Sharpe), minimum volatility, and consistency across time periods.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Monte Carlo Simulation</h3>
            <p className="text-sm">
              Generates thousands of possible future scenarios based on historical mean returns and covariance patterns. 
              Provides probability distributions, not predictions.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">ML Insights</h3>
            <p className="text-sm">
              Uses machine learning to cluster assets by correlation patterns, detect historical market regimes, 
              and quantify portfolio diversification quality.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Educational Methodology</h3>
            <p className="text-sm">
              Explains every formula and calculation in student-friendly language to help users understand 
              the mathematics behind portfolio theory.
            </p>
          </div>
        </div>
      </div>
      
      {/* What This Platform Does NOT Do */}
      <div className="card mb-8 bg-red-50 border-red-200">
        <div className="flex items-start gap-4 mb-4">
          <Shield className="w-6 h-6 text-red-700 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-heading font-semibold text-red-900 mb-3">
              What Smart Allocation Lab Does NOT Do
            </h2>
          </div>
        </div>
        
        <ul className="list-disc list-inside space-y-2 text-sm text-red-900">
          <li>Does NOT execute trades or connect to brokers</li>
          <li>Does NOT provide guaranteed investment returns</li>
          <li>Does NOT give direct buy/sell/hold recommendations</li>
          <li>Does NOT predict future market movements</li>
          <li>Does NOT replace professional financial advice</li>
          <li>Does NOT account for taxes, transaction costs, or liquidity</li>
          <li>Does NOT guarantee that historical patterns will repeat</li>
        </ul>
      </div>
      
      {/* Technology Stack */}
      <div className="card mb-8">
        <div className="flex items-start gap-4 mb-4">
          <Code className="w-6 h-6 text-brand-blue flex-shrink-0" />
          <div>
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
              Technology Stack
            </h2>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Frontend</h3>
            <ul className="space-y-1 text-gray-700">
              <li>• React 18 + TypeScript</li>
              <li>• Vite build tool</li>
              <li>• Tailwind CSS styling</li>
              <li>• Recharts for visualizations</li>
              <li>• React Router for navigation</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Backend</h3>
            <ul className="space-y-1 text-gray-700">
              <li>• Python FastAPI</li>
              <li>• NumPy & Pandas for calculations</li>
              <li>• SciPy for statistical functions</li>
              <li>• yfinance for market data</li>
              <li>• scikit-learn for ML clustering</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Data Sources */}
      <div className="card mb-8">
        <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4">
          Data Sources & Limitations
        </h2>
        
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Market Data:</strong> Historical price data is fetched from Yahoo Finance via yfinance library. 
            Data quality and availability vary by asset and market. Some assets may have incomplete or delayed data.
          </p>
          
          <p>
            <strong>Risk-Free Rate:</strong> Automatically fetched when available, with fallback to typical rates. 
            Users should verify and adjust based on current market conditions.
          </p>
          
          <p>
            <strong>CSV Upload:</strong> Users can upload custom data files when live data is unavailable or for 
            private/proprietary assets. The platform attempts flexible column detection but may require manual mapping.
          </p>
          
          <p className="pt-3 border-t border-gray-200 text-yellow-800 bg-yellow-50 p-3 rounded">
            <strong>Data Accuracy:</strong> While we use established financial formulas and reputable data sources, 
            we cannot guarantee 100% accuracy. Always verify critical data independently.
          </p>
        </div>
      </div>
      
      {/* License & Attribution */}
      <div className="card bg-gray-50">
        <div className="flex items-start gap-4 mb-4">
          <Heart className="w-6 h-6 text-brand-blue flex-shrink-0" />
          <div>
            <h2 className="text-xl font-heading font-semibold text-gray-900 mb-3">
              Open Source & Educational Use
            </h2>
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            Smart Allocation Lab is built as an educational tool to help students and retail investors 
            understand portfolio theory, diversification, and quantitative finance concepts.
          </p>
          
          <p>
            The platform uses open-source libraries and free data sources to remain accessible. 
            No paid API keys are required for basic functionality.
          </p>
          
          <p className="font-medium text-gray-900">
            Built with modern web technologies and quantitative finance best practices.
          </p>
        </div>
      </div>
      
      {/* Version Info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Smart Allocation Lab v1.0.0</p>
        <p className="mt-1">
          Educational Portfolio Analytics Platform
        </p>
      </div>
    </div>
  );
};

export default About;
