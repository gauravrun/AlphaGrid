import api from './api';
import type { AppState } from '../types';

export interface GenerateInsightsRequest {
  provider: string;
  model: string;
  api_key: string;
  prompt: string;
}

export const generateLLMInsights = async (
  provider: string,
  model: string,
  apiKey: string,
  appState: AppState
): Promise<string> => {
  // Construct a prompt summarizing the appState
  const analytics = appState.analyticsData?.portfolio_metrics;
  const mc = appState.monteCarloData;
  const benchmark = appState.benchmark;
  
  const prompt = `
Please analyze my portfolio.

**Portfolio Summary:**
- Annualized Return: ${(analytics?.annualized_return || 0) * 100}%
- Annualized Volatility: ${(analytics?.annualized_volatility || 0) * 100}%
- Sharpe Ratio: ${analytics?.sharpe_ratio}
- Max Drawdown: ${(analytics?.max_drawdown || 0) * 100}%
- Benchmark: ${benchmark?.display_name || 'None'}

**Monte Carlo Simulation (10k paths, 1 year):**
- Median Expected Value: ${mc?.median_final_value}
- 95% Value at Risk: ${mc?.value_at_risk_95}
- Probability of Profit: ${(mc?.probability_of_profit || 0) * 100}%

Provide actionable insights on diversification, risk, and expected future performance based on these metrics. Format the response nicely using Markdown.
`;

  const request: GenerateInsightsRequest = {
    provider,
    model,
    api_key: apiKey,
    prompt,
  };

  const response = await api.post('/llm/generate', request);
  return response.data.content;
};
