# Smart Allocation Lab

**Multi-asset portfolio analytics, optimization, and Monte Carlo simulation platform**

Smart Allocation Lab is a comprehensive educational fintech application for analyzing historical portfolio performance, simulating allocation strategies, running Monte Carlo future scenarios, and understanding diversification through machine learning insights.

## 🎯 Features

- **Global Asset Search**: Search and analyze stocks, ETFs, indices, crypto, and commodities from markets worldwide
- **Historical Risk-Return Analysis**: Calculate returns, volatility, Sharpe ratios, drawdowns, and correlations using proper covariance matrix mathematics
- **Portfolio Allocation Simulation**: Test thousands of allocation combinations to identify historically strong and efficient portfolios
- **Monte Carlo Future Scenarios**: Run probability-based simulations to understand potential future outcomes and risk ranges
- **Benchmark & Alpha Tracking**: Compare portfolios against any market index and calculate historical alpha performance
- **LLM Portfolio Insights**: Instantly generate actionable portfolio insights, diversification feedback, and risk analysis using Google Gemini models.
- **Educational Methodology**: Student-friendly explanations of all formulas and calculations

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **npm** or **yarn**
- **Google Gemini API Key** (optional, for AI insights)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

API documentation (Swagger UI): `http://localhost:8000/docs`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
smart-allocation-lab/
├── backend/
│   ├── app/
│   │   ├── routers/          # API endpoints
│   │   │   ├── assets.py     # Asset search
│   │   │   ├── data.py       # Data fetching
│   │   │   ├── analytics.py  # Portfolio calculations
│   │   │   ├── simulation.py # Allocation simulation
│   │   │   ├── montecarlo.py # Monte Carlo
│   │   │   ├── ml_insights.py # Legacy ML
│   │   │   └── llm.py        # LLM integration
│   │   ├── services/         # Business logic
│   │   │   ├── data_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── simulation_service.py
│   │   │   ├── montecarlo_service.py
│   │   │   └── ml_service.py
│   │   ├── models/           # Pydantic schemas
│   │   ├── utils/            # Asset mappings, validators
│   │   └── main.py           # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API client
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Helper functions
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔧 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **NumPy & Pandas** - Numerical computations
- **SciPy** - Statistical functions
- **yfinance** - Market data fetching
- **requests** - HTTP client for LLMs
- **scikit-learn** - Machine learning
- **Pydantic** - Data validation

## 📊 How It Works

### 1. Data Collection
- Search and select up to 15 global assets
- Choose custom date ranges
- Fetch historical data from Yahoo Finance or upload CSV files

### 2. Historical Analysis
- Calculate individual asset metrics (return, volatility, Sharpe ratio)
- Compute portfolio metrics using covariance matrix mathematics
- Compare against selected benchmark to calculate alpha

### 3. Allocation Simulation
- Generate thousands of random portfolio weight combinations
- Identify optimal mixes: Max Return, Max Sharpe, Min Volatility
- Calculate "Most Probable Mix" using rolling window consistency tests

### 4. Monte Carlo Simulation
- Generate probability-based future scenarios
- Calculate percentile ranges (5th, 25th, 50th, 75th, 95th)
- Estimate Value at Risk and probability of profit/loss

### 5. LLM Insights
- Bring your own Google Gemini API key
- Analyze your calculated portfolio metrics natively in the browser
- Receive actionable financial feedback via state-of-the-art Generative AI

## 📈 Formulas & Mathematics

All calculations use industry-standard quantitative finance formulas:

- **Portfolio Variance**: σ²_p = w^T × Σ × w (uses covariance matrix, not simple average)
- **Sharpe Ratio**: (Return - Risk-Free Rate) / Volatility
- **Alpha**: Portfolio Return - Benchmark Return
- **CAGR**: (Ending Value / Starting Value)^(1/years) - 1
- **Maximum Drawdown**: Largest peak-to-trough decline

See the **Methodology** page in the app for detailed explanations.

## ⚠️ Important Disclaimers

**This platform is for educational purposes only. It is NOT financial advice.**

- Historical simulations do not predict future returns
- All investments carry risk
- Past performance is not indicative of future results
- This platform does not execute trades
- Consult a qualified financial advisor before investing

## 🌐 Deployment

### Backend Deployment (Render/Railway/Heroku)

```bash
# Backend runs on port 8000
# Set environment variables if needed
# Deploy Python FastAPI app with uvicorn
```

### Frontend Deployment (Vercel/Netlify)

```bash
# Build for production
npm run build

# Deploy the 'dist' folder
# Set VITE_API_URL environment variable to backend URL
```

### Environment Variables

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:8000/api
```

**Backend** (optional):
```
# No required environment variables for basic functionality
# All features work with free data sources
```

## 🎓 Educational Use

Smart Allocation Lab is designed to help students and retail investors understand:

- Portfolio theory and modern portfolio theory (MPT)
- Diversification benefits through correlation analysis
- Risk-adjusted return metrics (Sharpe ratio)
- Monte Carlo simulation for scenario analysis
- Quantitative finance calculations
- Machine learning applications in finance

## 🔒 Privacy & Data

- No user data is stored or tracked
- All calculations happen in-session
- Market data fetched from public Yahoo Finance API
- No paid API keys required
- No login or authentication needed

## 🐛 Known Limitations

- Yahoo Finance data availability varies by asset
- Some assets may have incomplete historical data
- Risk-free rate auto-fetch may not work for all markets
- Monte Carlo assumes historical patterns continue (which may not be true)
- Does not account for taxes, transaction costs, or slippage

## 📝 License

Educational project - free to use and modify.

## 🤝 Contributing

This is an educational platform. Contributions welcome for:
- Additional asset mappings
- Improved statistical models
- Better error handling
- UI/UX enhancements
- Documentation improvements

## 📧 Support

For issues or questions:
- Check the Methodology page for formula explanations
- Review API documentation at `/docs`
- Ensure all dependencies are installed correctly

---

**Built with modern web technologies and quantitative finance best practices.**

Version 1.0.0
