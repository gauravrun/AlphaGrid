"""
Assets Router - Asset and Benchmark Search
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List
from app.models.schemas import AssetSearchRequest, AssetInfo
from app.utils.asset_mappings import search_assets, search_benchmarks

router = APIRouter()


@router.get("/search")
async def search_assets_endpoint(
    query: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(25, ge=1, le=50)
):
    """Search Yahoo Finance for real instruments by name or symbol"""
    try:
        results = search_assets(query, limit)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/benchmarks/search")
async def search_benchmarks_endpoint(
    query: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(15, ge=1, le=25)
):
    """Search Yahoo Finance for benchmark indices and ETFs"""
    try:
        results = search_benchmarks(query, limit)
        return {"results": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/demo/indian")
async def get_indian_demo():
    """Get preset Indian demo portfolio"""
    return {
        "assets": [
            {"display_name": "Reliance Industries", "display_symbol": "RELIANCE", "yahoo_symbol": "RELIANCE.NS"},
            {"display_name": "Tata Consultancy Services", "display_symbol": "TCS", "yahoo_symbol": "TCS.NS"},
            {"display_name": "HDFC Bank", "display_symbol": "HDFCBANK", "yahoo_symbol": "HDFCBANK.NS"},
            {"display_name": "NiftyBees", "display_symbol": "NIFTYBEES", "yahoo_symbol": "NIFTYBEES.NS"},
            {"display_name": "GoldBees", "display_symbol": "GOLDBEES", "yahoo_symbol": "GOLDBEES.NS"},
        ],
        "benchmark": {"display_name": "Nifty 50", "display_symbol": "NIFTY 50", "yahoo_symbol": "^NSEI", "market": "NSE", "asset_type": "Index"}
    }


@router.get("/demo/global")
async def get_global_demo():
    """Get preset global demo portfolio"""
    return {
        "assets": [
            {"display_name": "S&P 500", "display_symbol": "SPY", "yahoo_symbol": "SPY"},
            {"display_name": "Nasdaq 100", "display_symbol": "QQQ", "yahoo_symbol": "QQQ"},
            {"display_name": "Gold (GLD ETF)", "display_symbol": "GLD", "yahoo_symbol": "GLD"},
            {"display_name": "Bitcoin", "display_symbol": "BTC", "yahoo_symbol": "BTC-USD"},
            {"display_name": "US Treasury Bonds", "display_symbol": "TLT", "yahoo_symbol": "TLT"},
        ],
        "benchmark": {"display_name": "S&P 500", "display_symbol": "SPY", "yahoo_symbol": "SPY", "market": "US", "asset_type": "ETF"}
    }
