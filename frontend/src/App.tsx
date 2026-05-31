import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './index.css';

// Components
import Navigation from './components/Navigation';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Results from './pages/Results';
import AllocationSim from './pages/AllocationSim';
import MonteCarloSim from './pages/MonteCarloSim';
import AIInsights from './pages/AIInsights';
import Methodology from './pages/Methodology';
import About from './pages/About';

// Types
import type { AppState } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>({
    selectedAssets: [],
    benchmark: null,
    startDate: '',
    endDate: '',
    initialCapital: 100000,
    riskFreeRate: 0.05,
    riskFreeSource: 'manual',
    weights: [],
    priceData: null,
    analyticsData: null,
    simulationData: null,
    monteCarloData: null,
    loading: false,
    error: null,
  });

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<Home setAppState={setAppState} />} />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                appState={appState} 
                setAppState={setAppState} 
              />
            } 
          />
          <Route 
            path="/results" 
            element={
              <Results 
                appState={appState} 
                setAppState={setAppState} 
              />
            } 
          />
          <Route 
            path="/simulation" 
            element={
              <AllocationSim 
                appState={appState} 
                setAppState={setAppState} 
              />
            } 
          />
          <Route 
            path="/montecarlo" 
            element={
              <MonteCarloSim 
                appState={appState} 
                setAppState={setAppState} 
              />
            } 
          />
          <Route 
            path="/ai-insights" 
            element={
              <AIInsights 
                appState={appState} 
              />
            } 
          />
          <Route path="/methodology" element={<Methodology />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
