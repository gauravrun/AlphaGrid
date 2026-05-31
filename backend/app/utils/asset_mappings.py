"""
Asset search — powered by Yahoo Finance search API (real instruments only).
"""

from app.services.yahoo_search_service import (
    search_yahoo_assets,
    search_yahoo_benchmarks,
)


def search_assets(query: str, limit: int = 25) -> list[dict]:
    """Return only instruments that exist on Yahoo Finance."""
    return search_yahoo_assets(query, limit)


def search_benchmarks(query: str, limit: int = 15) -> list[dict]:
    """Return indices/ETFs from Yahoo Finance suitable as benchmarks."""
    return search_yahoo_benchmarks(query, limit)
