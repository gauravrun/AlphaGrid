# Quick Start Guide - Smart Allocation Lab

Get Smart Allocation Lab running in 5 minutes!

## Step 1: Install Prerequisites

Make sure you have:
- Python 3.9+ installed
- Node.js 18+ installed
- Terminal/Command Prompt access

## Step 2: Backend Setup (Terminal 1)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies (takes ~2 minutes)
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Backend ready!** 🎉 API running at http://localhost:8000

## Step 3: Frontend Setup (Terminal 2)

```bash
# Navigate to frontend
cd frontend

# Install dependencies (takes ~1 minute)
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

**Frontend ready!** 🎉 App running at http://localhost:3000

## Step 4: Try the Demo

1. Open http://localhost:3000 in your browser
2. Click "Run Demo Portfolio" on home page
3. Or go to Dashboard and click "Load Indian Demo" or "Load Global Demo"
4. Click "Run Analysis"
5. Explore Results, Simulation, and Monte Carlo pages!

## Troubleshooting

### "Port 8000 already in use"
Kill the process or use a different port:
```bash
uvicorn app.main:app --reload --port 8001
```

### "Module not found" errors
Make sure virtual environment is activated and dependencies are installed

### Frontend can't connect to backend
Check VITE_API_URL in frontend/.env points to http://localhost:8000/api

### yfinance download fails
Some assets may not be available. Try:
- Different assets (e.g., SPY, QQQ)
- Shorter date ranges
- CSV upload instead

## What to Try

### Indian Portfolio
1. Dashboard → "Load Indian Demo"
2. Adds: RELIANCE, TCS, HDFCBANK, NIFTYBEES, GOLDBEES
3. Benchmark: Nifty 50
4. Run Analysis → See historical performance
5. Run Allocation Simulation → Find optimal weights
6. Run Monte Carlo → See future scenarios

### Global Portfolio
1. Dashboard → "Load Global Demo"
2. Adds: SPY, QQQ, GLD, BTC-USD, TLT
3. Benchmark: S&P 500
4. Explore diversification across asset classes

### Custom Portfolio
1. Search for any stocks/ETFs/crypto
2. Examples: "apple", "bitcoin", "tesla", "gold"
3. Mix different asset types
4. Compare results!

## Next Steps

- Read the Methodology page to understand the formulas
- Experiment with different time periods
- Try the AI/ML Insights page
- Upload your own CSV data

## Getting Help

- **API Docs**: http://localhost:8000/docs
- **Methodology Page**: Explains all formulas
- **Check README.md**: Full documentation
- **DEPLOYMENT.md**: Production deployment guide

---

**Have fun analyzing portfolios!** 📈

Remember: This is educational software, not financial advice.
