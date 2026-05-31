import math
import numpy as np
import pandas as pd
from typing import Any

def sanitize_data(val: Any) -> Any:
    """
    Recursively sanitizes data structure to make it JSON-compliant.
    Replaces NaN, Inf, and -Inf with 0.0 (or default value).
    Also converts numpy types/arrays to python lists/scalars.
    """
    if isinstance(val, dict):
        return {k: sanitize_data(v) for k, v in val.items()}
    elif isinstance(val, list):
        return [sanitize_data(x) for x in val]
    elif isinstance(val, tuple):
        return tuple(sanitize_data(x) for x in val)
    elif isinstance(val, np.ndarray):
        # Convert numpy array to list after cleaning it
        cleaned_arr = np.nan_to_num(val, nan=0.0, posinf=0.0, neginf=0.0)
        return sanitize_data(cleaned_arr.tolist())
    elif isinstance(val, (np.float32, np.float64)):
        fval = float(val)
        if math.isnan(fval) or math.isinf(fval):
            return 0.0
        return fval
    elif isinstance(val, (np.int32, np.int64)):
        return int(val)
    elif isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return 0.0
        return val
    elif isinstance(val, int):
        return val
    elif isinstance(val, str):
        return val
    elif isinstance(val, pd.Series):
        return sanitize_data(val.tolist())
    elif isinstance(val, pd.DataFrame):
        return sanitize_data(val.to_dict())
    # Return as-is if no match
    return val
