"""
Data Service — fetches market data from Yahoo Finance chart API.
Uses direct Yahoo API (yfinance is often blocked/rate-limited).
"""
import json
import logging
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"


class DataService:
    """Service for fetching and processing market data"""
    
    _cache: Dict[str, Tuple[pd.DataFrame, datetime]] = {}
    CACHE_DURATION = timedelta(hours=1)

    @staticmethod
    def _fetch_symbol_yahoo_chart(symbol: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.Series:
        """Fetch daily close prices via Yahoo chart API (more reliable than yfinance)."""
        period1 = int(start.timestamp())
        period2 = int(end.timestamp())
        params = urllib.parse.urlencode({
            "period1": period1,
            "period2": period2,
            "interval": "1d",
            "includeAdjustedClose": "true",
        })
        url = f"{YAHOO_CHART_URL.format(symbol=urllib.parse.quote(symbol, safe=''))}?{params}"
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Smart Allocation Lab)"},
        )
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))

        results = payload.get("chart", {}).get("result") or []
        if not results:
            return pd.Series(dtype=float)

        result = results[0]
        timestamps = result.get("timestamp") or []
        if not timestamps:
            return pd.Series(dtype=float)

        indicators = result.get("indicators", {})
        adj = (indicators.get("adjclose") or [{}])[0].get("adjclose")
        closes = (indicators.get("quote") or [{}])[0].get("close")
        prices = adj if adj else closes
        if not prices:
            return pd.Series(dtype=float)

        index = pd.to_datetime(timestamps, unit="s")
        series = pd.Series(prices, index=index, name=symbol, dtype=float)
        series = series.dropna()
        return series

    @staticmethod
    def _fetch_symbol_yfinance(symbol: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.Series:
        """Fallback fetch via yfinance when chart API fails."""
        ticker = yf.Ticker(symbol)
        data = ticker.history(start=start, end=end, auto_adjust=True)
        if data.empty or len(data) < 2:
            return pd.Series(dtype=float)
        return data["Close"].dropna()

    @staticmethod
    def _fetch_symbol(symbol: str, start: pd.Timestamp, end: pd.Timestamp) -> pd.Series:
        """Try Yahoo chart API first, then yfinance."""
        try:
            series = DataService._fetch_symbol_yahoo_chart(symbol, start, end)
            if len(series) >= 2:
                return series
        except Exception as exc:
            logger.warning("Chart API failed for %s: %s", symbol, exc)

        try:
            return DataService._fetch_symbol_yfinance(symbol, start, end)
        except Exception as exc:
            logger.warning("yfinance failed for %s: %s", symbol, exc)
            return pd.Series(dtype=float)
    
    @staticmethod
    def fetch_price_data(symbols: List[str], start_date: str, end_date: str) -> Tuple[pd.DataFrame, Dict]:
        """
        FIXED: Better error handling for Yahoo Finance downloads
        """
        try:
            start = pd.to_datetime(start_date)
            end = pd.to_datetime(end_date)
            
            # Cache check
            cache_key = f"{'-'.join(sorted(symbols))}_{start_date}_{end_date}"
            if cache_key in DataService._cache:
                cached_data, cached_time = DataService._cache[cache_key]
                if datetime.now() - cached_time < DataService.CACHE_DURATION:
                    logger.info(f"Using cached data for {cache_key}")
                    return cached_data, {"cached": True}
            
            logger.info(f"Fetching data for {symbols} from {start_date} to {end_date}")
            
            # Try downloading with multiple attempts
            all_data = {}
            failed_symbols = []
            
            for symbol in symbols:
                try:
                    series = DataService._fetch_symbol(symbol, start, end)
                    if len(series) < 2:
                        logger.warning("No data for %s", symbol)
                        failed_symbols.append(symbol)
                        continue

                    # NORMALIZE INDEX: convert to timezone-naive calendar dates to prevent timezone mismatches
                    if series.index.tz is not None:
                        series.index = series.index.tz_convert(None)
                    series.index = series.index.normalize()
                    
                    # Deduplicate in case timezone shifts create multiple points on the same date
                    series = series.groupby(series.index).last()

                    all_data[symbol] = series
                    logger.info("Fetched %d days for %s", len(series), symbol)

                except Exception as e:
                    logger.error("Failed to fetch %s: %s", symbol, e)
                    failed_symbols.append(symbol)
            
            if not all_data:
                raise ValueError(
                    f"Could not fetch data for any symbols. Failed: {', '.join(failed_symbols)}. "
                    f"Please check: (1) Symbols are correct for Yahoo Finance, "
                    f"(2) Date range has trading days, (3) Try shorter date range"
                )
            
            # Combine into DataFrame
            prices_df = pd.DataFrame(all_data)
            original_len = len(prices_df)
            
            # FIXED: Forward-fill and backward-fill gaps instead of dropping, to align global calendars and holidays
            prices_df = prices_df.ffill().bfill()
            
            # Drop any remaining NaNs (e.g. dates before the newest asset's inception date)
            prices_df = prices_df.dropna()
            
            if len(prices_df) < 30:
                raise ValueError(
                    f"Insufficient overlapping data. Only {len(prices_df)} common trading days found. "
                    f"Original data had {original_len} days before alignment. "
                    f"Try: (1) Longer date range, (2) Different assets with better data overlap"
                )
            
            # Cache result
            DataService._cache[cache_key] = (prices_df, datetime.now())
            
            metadata = {
                "start_date": prices_df.index[0].strftime("%Y-%m-%d"),
                "end_date": prices_df.index[-1].strftime("%Y-%m-%d"),
                "total_days": len(prices_df),
                "symbols_fetched": list(prices_df.columns),
                "missing_symbols": failed_symbols,
                "cached": False,
            }
            
            return prices_df, metadata
            
        except Exception as e:
            logger.error(f"Error fetching data: {str(e)}")
            error_msg = str(e)
            
            # Provide helpful error messages
            if "No data" in error_msg or "empty" in error_msg.lower():
                raise ValueError(
                    f"Yahoo Finance returned no data. Common causes: "
                    f"(1) Invalid symbols - Check Yahoo Finance website for correct symbols, "
                    f"(2) Weekend/holiday dates - Try weekday dates, "
                    f"(3) Future dates - Cannot fetch future data, "
                    f"(4) Very old dates - Some assets lack historical data. "
                    f"Try: SPY, AAPL, MSFT, BTC-USD (known working symbols)"
                )
            
            raise ValueError(f"Data fetch failed: {error_msg}")
    
    @staticmethod
    def fetch_benchmark_data(symbol: str, dates_index: pd.DatetimeIndex) -> pd.Series:
        """Fetch benchmark data aligned with given dates"""
        try:
            start = dates_index[0]
            end = dates_index[-1]
            
            benchmark_prices = DataService._fetch_symbol(symbol, start, end)
            if benchmark_prices.empty:
                logger.warning(f"No benchmark data for {symbol}")
                return pd.Series(dtype=float)
            
            # NORMALIZE INDEX: convert to timezone-naive calendar dates to prevent timezone mismatches
            if benchmark_prices.index.tz is not None:
                benchmark_prices.index = benchmark_prices.index.tz_convert(None)
            benchmark_prices.index = benchmark_prices.index.normalize()
            
            # Deduplicate in case timezone shifts create multiple points on the same date
            benchmark_prices = benchmark_prices.groupby(benchmark_prices.index).last()
            
            # Align with portfolio dates
            benchmark_aligned = benchmark_prices.reindex(dates_index)
            benchmark_aligned = benchmark_aligned.ffill().bfill()
            
            return benchmark_aligned
            
        except Exception as e:
            logger.error(f"Error fetching benchmark {symbol}: {str(e)}")
            return pd.Series(dtype=float)
    
    @staticmethod
    def parse_csv_data(csv_content: str, filename: str) -> Tuple[pd.DataFrame, Dict]:
        """Parse CSV data with flexible column detection"""
        from io import StringIO
        
        try:
            df = pd.read_csv(StringIO(csv_content))
            
            # Detect date column
            date_col = DataService._detect_date_column(df)
            if not date_col:
                raise ValueError("Could not detect date column. Please ensure CSV has a date column.")
            
            # Detect price columns
            price_cols = DataService._detect_price_columns(df, date_col)
            if not price_cols:
                raise ValueError("Could not detect price columns. Please ensure CSV has numeric price data.")
            
            # Convert date column
            df[date_col] = pd.to_datetime(df[date_col])
            df = df.set_index(date_col)
            
            # Extract price data
            prices_df = df[price_cols].copy()
            
            # Convert to numeric
            for col in prices_df.columns:
                prices_df[col] = pd.to_numeric(prices_df[col], errors='coerce')
            
            # Drop NaN rows
            prices_df = prices_df.dropna()
            
            # Sort by date
            prices_df = prices_df.sort_index()
            
            metadata = {
                "detected_date_column": date_col,
                "detected_price_columns": price_cols,
                "row_count": len(prices_df),
                "date_range": f"{prices_df.index[0]} to {prices_df.index[-1]}",
                "preview": prices_df.head(5).to_dict('records'),
            }
            
            return prices_df, metadata
            
        except Exception as e:
            logger.error(f"Error parsing CSV: {str(e)}")
            raise ValueError(f"CSV parse failed: {str(e)}")
    
    @staticmethod
    def _detect_date_column(df: pd.DataFrame) -> Optional[str]:
        """Detect which column contains dates"""
        possible_names = [
            'date', 'Date', 'DATE',
            'datetime', 'DateTime', 'Datetime',
            'timestamp', 'Timestamp', 'TIMESTAMP',
            'time', 'Time', 'TIME',
        ]
        
        for col in df.columns:
            if col in possible_names:
                return col
        
        for col in df.columns:
            col_lower = col.lower()
            if any(name.lower() in col_lower for name in ['date', 'time']):
                return col
        
        for col in df.columns:
            try:
                pd.to_datetime(df[col].iloc[:5])
                return col
            except:
                continue
        
        return None
    
    @staticmethod
    def _detect_price_columns(df: pd.DataFrame, date_col: str) -> List[str]:
        """Detect which columns contain prices"""
        possible_price_names = [
            'close', 'Close', 'CLOSE',
            'adj close', 'Adj Close', 'adjusted_close',
            'price', 'Price', 'PRICE',
            'closing price', 'Closing Price',
            'ltp', 'LTP', 'last_price',
        ]
        
        price_cols = []
        
        for col in df.columns:
            if col == date_col:
                continue
            
            try:
                pd.to_numeric(df[col], errors='raise')
                
                col_lower = col.lower()
                if any(name.lower() in col_lower for name in possible_price_names):
                    price_cols.append(col)
                elif col_lower not in ['volume', 'open', 'high', 'low']:
                    price_cols.append(col)
            except:
                continue
        
        return price_cols
    
    @staticmethod
    def get_risk_free_rate(market: str = "us") -> Tuple[float, str]:
        """Attempt to fetch current risk-free rate"""
        fallback_rates = {
            "india": 0.065,
            "us": 0.045,
            "uk": 0.04,
            "global": 0.045,
            "nse": 0.065,
            "bse": 0.065,
            "nyse": 0.045,
            "nasdaq": 0.045,
        }
        
        m_lower = market.lower() if market else "us"
        
        try:
            if m_lower in ("us", "nyse", "nasdaq"):
                symbol = "^TNX"
                ticker = yf.Ticker(symbol)
                info = ticker.info
                if 'previousClose' in info and info['previousClose'] > 0:
                    rate = info['previousClose'] / 100
                    return rate, "auto"
        except Exception as e:
            logger.warning(f"Could not fetch risk-free rate: {str(e)}")
        
        return fallback_rates.get(m_lower, 0.045), "fallback"
