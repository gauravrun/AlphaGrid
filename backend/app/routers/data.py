"""
Data Router - Market Data Fetching and CSV Upload
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from app.models.schemas import DataFetchRequest, DataFetchResponse, RiskFreeRateRequest, RiskFreeRateResponse
from app.services.data_service import DataService
from app.utils.sanitization import sanitize_data
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/fetch", response_model=DataFetchResponse)
async def fetch_market_data(request: DataFetchRequest):
    """Fetch historical price data from Yahoo Finance"""
    try:
        # Fetch main asset data
        prices_df, metadata = DataService.fetch_price_data(
            request.symbols,
            request.start_date.isoformat(),
            request.end_date.isoformat()
        )
        
        # Prepare response
        prices_dict = {}
        for col in prices_df.columns:
            prices_dict[col] = prices_df[col].tolist()
        
        dates = [d.strftime("%Y-%m-%d") for d in prices_df.index]
        
        response = {
            "prices": prices_dict,
            "dates": dates,
            "metadata": metadata,
        }
        
        # Fetch benchmark if provided
        if request.benchmark_symbol:
            try:
                benchmark_prices = DataService.fetch_benchmark_data(
                    request.benchmark_symbol,
                    prices_df.index
                )
                if len(benchmark_prices) > 0:
                    response["benchmark_prices"] = benchmark_prices.tolist()
            except Exception as e:
                logger.warning(f"Could not fetch benchmark {request.benchmark_symbol}: {str(e)}")
        
        return sanitize_data(response)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {str(e)}")


@router.post("/upload/csv")
async def upload_csv(file: UploadFile = File(...)):
    """Upload and parse CSV file"""
    try:
        # Read file content
        content = await file.read()
        csv_text = content.decode('utf-8')
        
        # Parse CSV
        prices_df, metadata = DataService.parse_csv_data(csv_text, file.filename)
        
        # Convert to response format
        prices_dict = {}
        for col in prices_df.columns:
            prices_dict[col] = prices_df[col].tolist()
        
        dates = [d.strftime("%Y-%m-%d") for d in prices_df.index]
        
        response = {
            "prices": prices_dict,
            "dates": dates,
            "metadata": metadata,
            "success": True,
        }
        return sanitize_data(response)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error parsing CSV: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse CSV: {str(e)}")


@router.post("/riskfree", response_model=RiskFreeRateResponse)
async def get_risk_free_rate(request: RiskFreeRateRequest):
    """Get risk-free rate for specified market"""
    try:
        rate, source = DataService.get_risk_free_rate(request.market)
        
        return {
            "rate": rate,
            "source": source,
            "last_updated": None,  # Could add timestamp if caching
        }
        
    except Exception as e:
        logger.error(f"Error fetching risk-free rate: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
