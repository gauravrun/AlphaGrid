"""
Yahoo Finance symbol search — returns only real instruments from Yahoo's catalog.
"""
from __future__ import annotations

import json
import logging
import urllib.parse
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)

YAHOO_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search"

# Quote types that typically have price history on Yahoo Finance
ALLOWED_QUOTE_TYPES = frozenset({
    "EQUITY",
    "ETF",
    "INDEX",
    "CRYPTOCURRENCY",
    "MUTUALFUND",
    "CURRENCY",
})

BENCHMARK_QUOTE_TYPES = frozenset({"INDEX", "ETF"})

QUOTE_TYPE_LABELS: dict[str, str] = {
    "EQUITY": "Stock",
    "ETF": "ETF",
    "INDEX": "Index",
    "CRYPTOCURRENCY": "Cryptocurrency",
    "MUTUALFUND": "Mutual Fund",
    "CURRENCY": "Currency",
}

# Map Yahoo exchange display names to short labels
EXCHANGE_LABELS: dict[str, str] = {
    "NSE": "NSE",
    "NSI": "NSE",
    "Bombay": "BSE",
    "BSE": "BSE",
    "NASDAQ": "NASDAQ",
    "NYSE": "NYSE",
    "NYSEArca": "NYSE Arca",
    "NYSE MKT": "NYSE",
    "CCC": "Crypto",
    "PCX": "Crypto",
    "SNP": "Index",
}

# Expand common abbreviations so Yahoo returns the right instrument
SEARCH_ALIASES: dict[str, str] = {
    "ril": "reliance industries",
    "reliance": "reliance industries",
    "tcs": "tata consultancy services",
    "infy": "infosys",
    "hdfc": "hdfc bank",
    "icici": "icici bank",
    "nifty": "nifty 50",
    "sensex": "sensex",
    "btc": "bitcoin usd",
    "eth": "ethereum usd",
    "aapl": "apple",
    "msft": "microsoft",
    "goog": "google",
    "googl": "google",
    "amzn": "amazon",
    "tsla": "tesla",
    "spy": "s&p 500 etf",
    "qqq": "nasdaq 100 etf",
}


def _normalize_exchange(quote: dict[str, Any]) -> str:
    exch = quote.get("exchDisp") or quote.get("exchange") or ""
    if isinstance(exch, str) and exch in EXCHANGE_LABELS:
        return EXCHANGE_LABELS[exch]
    if isinstance(exch, str) and exch:
        return exch
    quote_type = quote.get("quoteType", "")
    if quote_type == "CRYPTOCURRENCY":
        return "Crypto"
    if quote_type == "INDEX":
        return "Index"
    return "Global"


def _to_display_symbol(yahoo_symbol: str, quote: dict[str, Any]) -> str:
    """Strip Yahoo suffixes (.NS, .BO, -USD) for UI; keep yahoo_symbol for fetching."""
    symbol = yahoo_symbol.upper()
    exchange = _normalize_exchange(quote)

    if symbol.endswith(".NS"):
        return symbol[:-3]
    if symbol.endswith(".BO"):
        return symbol[:-3]
    if symbol.endswith(".NSI"):
        return symbol[:-4]

    quote_type = quote.get("quoteType", "")
    if quote_type == "CRYPTOCURRENCY" and "-" in symbol:
        return symbol.split("-")[0]

    if symbol.startswith("^"):
        short = quote.get("shortname") or quote.get("longname")
        if short and len(short) <= 24:
            return short.strip()
        return symbol[1:]

    return symbol


def _to_asset_type(quote_type: str, exchange: str) -> str:
    label = QUOTE_TYPE_LABELS.get(quote_type, quote_type or "Instrument")
    if quote_type == "EQUITY" and exchange in ("NSE", "BSE"):
        return "Indian Stock" if exchange == "NSE" else "Indian Stock (BSE)"
    return label


def _quote_to_asset(quote: dict[str, Any]) -> dict[str, str]:
    yahoo_symbol = quote.get("symbol", "").strip()
    if not yahoo_symbol:
        raise ValueError("Missing symbol")

    exchange = _normalize_exchange(quote)
    display_symbol = _to_display_symbol(yahoo_symbol, quote)
    display_name = (
        quote.get("longname")
        or quote.get("shortname")
        or display_symbol
    ).strip()

    return {
        "display_name": display_name,
        "display_symbol": display_symbol,
        "yahoo_symbol": yahoo_symbol,
        "exchange": exchange,
        "asset_type": _to_asset_type(quote.get("quoteType", ""), exchange),
    }


def _fetch_quotes(query: str, count: int) -> list[dict[str, Any]]:
    params = urllib.parse.urlencode({
        "q": query,
        "quotesCount": min(count, 50),
        "newsCount": 0,
        "enableFuzzyQuery": True,
    })
    url = f"{YAHOO_SEARCH_URL}?{params}"
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Smart Allocation Lab)"},
    )
    with urllib.request.urlopen(request, timeout=12) as response:
        data = json.loads(response.read().decode("utf-8"))
    return data.get("quotes") or []


def _score_quote(quote: dict[str, Any], query: str) -> int:
    """Rank results: exact symbol match first, then name match."""
    q = query.upper().strip()
    symbol = (quote.get("symbol") or "").upper()
    name = ((quote.get("shortname") or "") + (quote.get("longname") or "")).upper()
    score = 0

    if symbol == q or symbol.replace(".NS", "") == q or symbol.replace(".BO", "") == q:
        score += 100
    if symbol.startswith(q) or q in symbol:
        score += 40
    if q in name:
        score += 20
    quote_type = quote.get("quoteType", "")
    exchange = _normalize_exchange(quote)
    if quote_type == "EQUITY" and exchange == "NSE":
        score += 15
    elif quote_type == "EQUITY" and exchange == "BSE":
        score += 8
    if quote_type == "CRYPTOCURRENCY":
        score += 12
        if q in ("BTC", "ETH", "SOL") and symbol.startswith(q):
            score += 40
    if quote_type == "INDEX":
        score += 8
    return score


def _dedupe_assets(assets: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    out: list[dict[str, str]] = []
    for asset in assets:
        key = asset["yahoo_symbol"].upper()
        if key in seen:
            continue
        seen.add(key)
        out.append(asset)
    return out


def _search_queries(query: str) -> list[str]:
    """Build Yahoo search queries; short abbreviations use alias-only to avoid wrong tickers."""
    alias = SEARCH_ALIASES.get(query.lower())
    if alias and len(query) <= 4:
        return [alias]
    if alias:
        return [query, alias]
    return [query]


def search_yahoo_assets(query: str, limit: int = 25) -> list[dict[str, str]]:
    """
    Search Yahoo Finance for real instruments only.
    No synthetic / guessed symbols.
    """
    query = query.strip()
    if not query:
        return []

    queries = _search_queries(query)

    raw_quotes: list[dict[str, Any]] = []
    per_query = max(limit // len(queries) + 5, 15)

    for q in queries:
        try:
            raw_quotes.extend(_fetch_quotes(q, per_query))
        except Exception as exc:
            logger.warning("Yahoo search failed for %r: %s", q, exc)

    if not raw_quotes:
        return []

    # Filter to supported quote types
    filtered = [
        q for q in raw_quotes
        if q.get("quoteType") in ALLOWED_QUOTE_TYPES and q.get("symbol")
    ]

    filtered.sort(key=lambda q: _score_quote(q, query), reverse=True)

    results: list[dict[str, str]] = []
    for quote in filtered:
        try:
            results.append(_quote_to_asset(quote))
        except ValueError:
            continue
        if len(results) >= limit:
            break

    return _dedupe_assets(results)[:limit]


def search_yahoo_benchmarks(query: str, limit: int = 15) -> list[dict[str, str]]:
    """Search Yahoo for indices and ETFs suitable as benchmarks."""
    query = query.strip()
    if not query:
        return []

    queries = _search_queries(query)

    raw_quotes: list[dict[str, Any]] = []
    for q in queries:
        try:
            raw_quotes.extend(_fetch_quotes(q, 25))
        except Exception as exc:
            logger.warning("Yahoo benchmark search failed for %r: %s", q, exc)

    filtered = [
        q for q in raw_quotes
        if q.get("symbol")
        and (
            q.get("quoteType") in BENCHMARK_QUOTE_TYPES
            or (q.get("symbol") or "").startswith("^")
        )
    ]

    filtered.sort(key=lambda q: _score_quote(q, query), reverse=True)

    results: list[dict[str, str]] = []
    for quote in filtered:
        try:
            asset = _quote_to_asset(quote)
            results.append({
                "display_name": asset["display_name"],
                "display_symbol": asset["display_symbol"],
                "yahoo_symbol": asset["yahoo_symbol"],
                "market": asset["exchange"],
                "asset_type": asset["asset_type"],
            })
        except ValueError:
            continue
        if len(results) >= limit:
            break

    return _dedupe_assets(results)[:limit]
