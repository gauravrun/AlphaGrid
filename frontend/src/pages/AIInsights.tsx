import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, AlertTriangle, Loader, Key, Send } from 'lucide-react';
import type { AppState } from '../types';
import { generateLLMInsights } from '../services/llmService';

interface AIInsightsProps {
  appState: AppState;
}

const AIInsights = ({ appState }: AIInsightsProps) => {
  const navigate = useNavigate();
  
  const [apiKey, setApiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  
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
  
  const handleGenerate = async () => {
    if (!apiKey) {
      setError("Please enter your Gemini API Key first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      const res = await generateLLMInsights('gemini', 'gemini-3.5-flash', apiKey, appState);
      setResponse(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Brain className="w-8 h-8 text-brand-blue" />
          Gemini Portfolio Insights
        </h1>
        <p className="text-gray-600">
          Connect your Google Gemini model to analyze your portfolio metrics instantly.
        </p>
      </div>
      
      <div className="card mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-500" />
            Gemini API Key (Sent only to your backend)
          </label>
          <input 
            type="password"
            className="input-field w-full max-w-md"
            placeholder="Enter Gemini API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        
        <button 
          className="btn btn-primary w-full md:w-auto flex items-center gap-2 justify-center"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {loading ? 'Analyzing...' : 'Generate Insights'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {response && (
        <div className="card bg-white shadow-sm border border-gray-200">
          <h2 className="text-xl font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Analysis Results
          </h2>
          <div className="prose prose-blue max-w-none whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
            {response}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
