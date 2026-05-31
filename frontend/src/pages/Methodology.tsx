import { BookOpen } from 'lucide-react';

const Methodology = () => {
  const sections = [
    {
      title: 'Historical Return',
      formula: 'Return = (P_end - P_start) / P_start',
      explanation: 'Historical return measures the percentage change in an asset\'s price over a period. For example, if a stock goes from ₹100 to ₹120, the return is 20%.',
    },
    {
      title: 'Daily Returns',
      formula: 'R_t = (P_t / P_{t-1}) - 1',
      explanation: 'Daily returns show the day-to-day percentage change in price. These are calculated for each trading day and used as the foundation for many other metrics.',
    },
    {
      title: 'CAGR (Compound Annual Growth Rate)',
      formula: 'CAGR = (P_end / P_start)^(1 / years) - 1',
      explanation: 'CAGR smooths out returns over multiple years, showing the equivalent constant annual growth rate. It\'s useful for comparing investments over different time periods.',
    },
    {
      title: 'Variance',
      formula: 'Variance = Σ(R_i - Mean)² / (N - 1)',
      explanation: 'Variance measures how spread out returns are from their average. Higher variance means more unpredictable returns.',
    },
    {
      title: 'Standard Deviation (Volatility)',
      formula: 'Volatility = √Variance × √252',
      explanation: 'Standard deviation is the square root of variance and represents typical price fluctuation. We multiply by √252 to annualize daily volatility (252 trading days per year).',
    },
    {
      title: 'Covariance',
      formula: 'Cov(X,Y) = Σ[(X_i - X̄)(Y_i - Ȳ)] / (N - 1)',
      explanation: 'Covariance measures how two assets move together. Positive covariance means they tend to move in the same direction; negative means opposite directions.',
    },
    {
      title: 'Correlation',
      formula: 'Correlation = Cov(X,Y) / (σ_X × σ_Y)',
      explanation: 'Correlation standardizes covariance to a -1 to +1 scale. Values near +1 indicate strong positive correlation, near -1 strong negative correlation, and near 0 little relationship.',
    },
    {
      title: 'Portfolio Return',
      formula: 'R_p = Σ(w_i × R_i)',
      explanation: 'Portfolio return is the weighted average of individual asset returns. If Asset A returns 10% with 60% weight and Asset B returns 20% with 40% weight, portfolio return is (0.6 × 10%) + (0.4 × 20%) = 14%.',
    },
    {
      title: 'Portfolio Variance (Critical!)',
      formula: 'σ²_p = w^T × Σ × w',
      explanation: 'Portfolio variance is NOT a simple average of individual variances. It uses the covariance matrix (Σ) to account for how assets move together. This is why diversification reduces risk - combining uncorrelated assets lowers overall portfolio variance.',
    },
    {
      title: 'Portfolio Volatility',
      formula: 'σ_p = √(w^T × Σ × w) × √252',
      explanation: 'Portfolio volatility is the square root of portfolio variance, annualized. This is the true portfolio risk measure.',
    },
    {
      title: 'Sharpe Ratio',
      formula: 'Sharpe = (R_p - R_f) / σ_p',
      explanation: 'Sharpe ratio measures risk-adjusted return. It shows how much excess return you earn per unit of volatility. Higher is better. A Sharpe > 1 is considered good; > 2 is excellent.',
    },
    {
      title: 'Benchmark',
      formula: 'N/A (Reference Index)',
      explanation: 'A benchmark is a reference index (like Nifty 50 or S&P 500) used to compare your portfolio\'s performance. It answers: "Did I beat the market?"',
    },
    {
      title: 'Alpha',
      formula: 'Alpha = R_portfolio - R_benchmark',
      explanation: 'Alpha measures excess return beyond the benchmark. Positive alpha means you outperformed; negative means underperformed. For example, if your portfolio returned 15% and Nifty returned 11%, alpha is +4%.',
    },
    {
      title: 'Beta (vs Benchmark)',
      formula: 'Beta = Cov(R_p, R_b) / Var(R_b)',
      explanation: 'Beta measures sensitivity to market movements. Beta = 1 means your portfolio moves with the market; Beta > 1 means more volatile than market; Beta < 1 means less volatile.',
    },
    {
      title: 'Drawdown',
      formula: 'DD_t = (Peak_t - Value_t) / Peak_t',
      explanation: 'Drawdown measures decline from a previous peak. If your portfolio went from ₹100k to ₹120k (peak) then dropped to ₹90k, drawdown is (120k - 90k) / 120k = 25%.',
    },
    {
      title: 'Maximum Drawdown',
      formula: 'Max DD = Largest DD over period',
      explanation: 'Maximum drawdown is the worst peak-to-trough decline over the analysis period. It tells you the maximum historical loss you would have faced.',
    },
    {
      title: 'Allocation Simulation',
      formula: 'Test N random weight combinations',
      explanation: 'We generate thousands of random portfolios (all weights sum to 100%) and calculate their historical return, volatility, and Sharpe ratio. This maps out the "efficient frontier" of possible portfolios.',
    },
    {
      title: 'Efficient Frontier',
      formula: 'Risk-return combinations',
      explanation: 'The efficient frontier shows the set of portfolios offering maximum return for each level of risk. Portfolios on this frontier are "efficient" - you can\'t get higher return without taking more risk.',
    },
    {
      title: 'Most Probable Mix',
      formula: 'Rolling window consistency test',
      explanation: 'We split historical data into multiple time windows and test portfolios across each window. The "Most Probable Mix" is the allocation that performs consistently well across different periods - not just the highest return, but the most reliable.',
    },
    {
      title: 'Monte Carlo Simulation',
      formula: 'Generate random paths using μ and Σ',
      explanation: 'Monte Carlo simulates thousands of possible future paths using historical mean returns (μ) and covariance matrix (Σ). Each simulation generates random daily returns that preserve the historical correlation structure, then compounds them over the time horizon. The result is a probability distribution of future outcomes.',
    },
    {
      title: 'Value at Risk (VaR)',
      formula: 'VaR_95 = 5th percentile of outcomes',
      explanation: 'VaR tells you the maximum likely loss at a given confidence level. VaR at 95% confidence means there\'s only a 5% chance your loss will exceed this amount.',
    },
  ];
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-brand-blue" />
          Methodology & Formulas
        </h1>
        <p className="text-gray-600">
          Educational explanations of every calculation used in Smart Allocation Lab
        </p>
      </div>
      
      {/* Introduction */}
      <div className="card mb-8 bg-blue-50 border-blue-200">
        <h2 className="text-xl font-heading font-semibold text-blue-900 mb-3">
          How to Use This Guide
        </h2>
        <p className="text-blue-800 mb-3">
          This page explains the mathematics and statistics behind portfolio analysis in simple language. 
          Each concept includes the formula, what it means, and why it matters for investors.
        </p>
        <p className="text-sm text-blue-700">
          Understanding these concepts will help you interpret the results and make better-informed decisions.
        </p>
      </div>
      
      {/* Formulas */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-blue text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">
                  {section.title}
                </h3>
                
                <div className="bg-gray-100 rounded-lg p-3 mb-3 font-mono text-sm">
                  {section.formula}
                </div>
                
                <p className="text-gray-700">
                  {section.explanation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Key Differences */}
      <div className="mt-8 card bg-purple-50 border-purple-200">
        <h2 className="text-xl font-heading font-semibold text-purple-900 mb-4">
          Key Differences to Understand
        </h2>
        
        <div className="space-y-4 text-purple-800">
          <div>
            <h3 className="font-semibold mb-1">Historical Simulation vs Monte Carlo</h3>
            <p className="text-sm">
              <strong>Historical simulation</strong> asks "What allocation worked best in the past?" using actual historical data. 
              <strong>Monte Carlo</strong> asks "What could happen in the future?" by generating thousands of possible scenarios based on historical statistics.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">Variance vs Volatility</h3>
            <p className="text-sm">
              <strong>Variance</strong> is the average squared deviation from the mean. 
              <strong>Volatility</strong> (standard deviation) is the square root of variance and represents typical fluctuation in percentage terms.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">Covariance vs Correlation</h3>
            <p className="text-sm">
              <strong>Covariance</strong> measures how two assets move together (units depend on the assets). 
              <strong>Correlation</strong> standardizes this to a -1 to +1 scale, making it easier to interpret.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-1">Return vs CAGR</h3>
            <p className="text-sm">
              <strong>Total Return</strong> is the simple percentage change over the entire period. 
              <strong>CAGR</strong> smooths this into an equivalent annual rate, making it easier to compare investments over different time periods.
            </p>
          </div>
        </div>
      </div>
      
      {/* Why Portfolio Math Matters */}
      <div className="mt-8 card bg-green-50 border-green-200">
        <h2 className="text-xl font-heading font-semibold text-green-900 mb-4">
          Why Portfolio Variance Uses a Covariance Matrix
        </h2>
        
        <p className="text-green-800 mb-3">
          This is the most important concept in portfolio theory:
        </p>
        
        <p className="text-green-800 mb-3">
          Portfolio risk is NOT just the weighted average of individual asset risks. If Asset A has 20% volatility 
          and Asset B has 30% volatility, a 50/50 portfolio does NOT have 25% volatility.
        </p>
        
        <p className="text-green-800 mb-3">
          The actual portfolio volatility depends on how the assets move together (correlation). If they're 
          uncorrelated or negatively correlated, the portfolio volatility will be LOWER than 25% - this is the 
          benefit of diversification.
        </p>
        
        <p className="text-green-800">
          The covariance matrix captures these relationships, which is why we use the formula σ²_p = w^T × Σ × w 
          instead of a simple average.
        </p>
      </div>
      
      {/* Limitations */}
      <div className="mt-8 card bg-yellow-50 border-yellow-200">
        <h2 className="text-xl font-heading font-semibold text-yellow-900 mb-4">
          Model Limitations
        </h2>
        
        <ul className="space-y-2 text-sm text-yellow-800">
          <li>• Historical data may not represent future conditions</li>
          <li>• Assumes returns follow statistical distributions (which may not hold during crises)</li>
          <li>• Does not account for transaction costs, taxes, or liquidity constraints</li>
          <li>• Correlation patterns can change over time (especially during market stress)</li>
          <li>• Simulations cannot predict rare events (black swans)</li>
          <li>• Equal weighting or optimized weights are based on past data</li>
        </ul>
      </div>
    </div>
  );
};

export default Methodology;
