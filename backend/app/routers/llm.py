from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import requests
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class LLMRequest(BaseModel):
    provider: str
    model: str
    api_key: str
    prompt: str

class LLMResponse(BaseModel):
    content: str

@router.post("/generate", response_model=LLMResponse)
async def generate_insights(request: LLMRequest):
    provider = request.provider.lower()
    
    try:
        if provider == "openai":
            return _call_openai(request)
        elif provider == "anthropic":
            return _call_anthropic(request)
        elif provider == "gemini":
            return _call_gemini(request)
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")
    except Exception as e:
        logger.error(f"Error calling {provider} API: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def _call_openai(req: LLMRequest) -> LLMResponse:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {req.api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": req.model,
        "messages": [
            {"role": "system", "content": "You are an expert financial quantitative analyst. Analyze the provided portfolio metrics, drawdowns, and simulation results. Provide clear, actionable insights on diversification, risk, and historical performance."},
            {"role": "user", "content": req.prompt}
        ]
    }
    
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise Exception(f"OpenAI API Error: {resp.text}")
        
    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return LLMResponse(content=content)

def _call_anthropic(req: LLMRequest) -> LLMResponse:
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": req.api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
    }
    payload = {
        "model": req.model,
        "max_tokens": 4096,
        "system": "You are an expert financial quantitative analyst. Analyze the provided portfolio metrics, drawdowns, and simulation results. Provide clear, actionable insights on diversification, risk, and historical performance.",
        "messages": [
            {"role": "user", "content": req.prompt}
        ]
    }
    
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise Exception(f"Anthropic API Error: {resp.text}")
        
    data = resp.json()
    content = data["content"][0]["text"]
    return LLMResponse(content=content)

def _call_gemini(req: LLMRequest) -> LLMResponse:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{req.model}:generateContent?key={req.api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Prepend system instruction to prompt since v1beta structure varies
    full_prompt = "System: You are an expert financial quantitative analyst. Analyze the provided portfolio metrics, drawdowns, and simulation results. Provide clear, actionable insights on diversification, risk, and historical performance.\n\nUser Data:\n" + req.prompt
    
    payload = {
        "contents": [{"parts":[{"text": full_prompt}]}]
    }
    
    resp = requests.post(url, json=payload, headers=headers)
    if resp.status_code != 200:
        raise Exception(f"Gemini API Error: {resp.text}")
        
    data = resp.json()
    content = data["candidates"][0]["content"]["parts"][0]["text"]
    return LLMResponse(content=content)
