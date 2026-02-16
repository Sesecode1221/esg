import os
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from requests.auth import HTTPDigestAuth
import xml.etree.ElementTree as ET
from datetime import datetime, timezone, timedelta
import logging
from typing import Dict, Optional, List, Any
from dotenv import load_dotenv
import csv
import io

load_dotenv()

# ============================================
# LOGGING
# ============================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ============================================
# CORS
# ============================================
def get_allowed_origins() -> List[str]:
    origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]
    essentials = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    for e in essentials:
        if e not in origins:
            origins.append(e)
    return origins

ALLOWED_ORIGINS = get_allowed_origins()

# ============================================
# APP
# ============================================
app = FastAPI(title="eGauge Energy API", version="2.2.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# ENV
# ============================================
EGAUGE_HOST = os.getenv("EGAUGE_HOST")
EGAUGE_USER = os.getenv("EGAUGE_USER")
EGAUGE_PASS = os.getenv("EGAUGE_PASSWORD")
METER_NAME = os.getenv("EGAUGE_METER_NAME", "Bertha House")
ENERGY_TARIFF = float(os.getenv("ENERGY_TARIFF_PER_KWH", 1.99))

# ============================================
# MODELS
# ============================================
class EnergyData(BaseModel):
    meter_name: str
    timestamp: str
    current_power: float
    solar_generation: float
    grid_import: float
    grid_export: float
    raw_data: Dict[str, float]

class DetailedData(BaseModel):
    meter_name: str
    period: str
    count: int
    data: List[Dict[str, Any]]

class HealthCheck(BaseModel):
    status: str
    meter_connection: bool
    timestamp: str

# ============================================
# XML PARSER (FIXED)
# ============================================
def parse_egauge_xml(xml: str) -> Dict[str, float]:
    """
    Correctly parse eGauge XML.
    Uses <i> interpreted values (NOT <v>).
    """
    data: Dict[str, float] = {}

    try:
        root = ET.fromstring(xml)
    except ET.ParseError as e:
        logger.error(f"XML parse error: {e}")
        return data

    for r in root.findall(".//r"):
        name = r.attrib.get("n", "").strip()
        i_node = r.find("i")

        if not name or i_node is None or not i_node.text:
            continue

        try:
            value = float(i_node.text)
            data[name] = value
            logger.debug(f"Parsed {name} = {value}")
        except ValueError:
            logger.warning(f"Invalid numeric value for {name}: {i_node.text}")

    return data

# ============================================
# FETCHERS
# ============================================
def fetch_instantaneous() -> Dict[str, float]:
    url = f"{EGAUGE_HOST}/cgi-bin/egauge?inst"
    logger.info(f"Fetching instantaneous data from {url}")

    try:
        res = requests.get(
            url,
            auth=HTTPDigestAuth(EGAUGE_USER, EGAUGE_PASS),
            timeout=10
        )

        if res.status_code != 200:
            logger.error(f"Meter returned {res.status_code}")
            return {}

        return parse_egauge_xml(res.text)

    except Exception as e:
        logger.error(f"Instantaneous fetch failed: {e}")
        return {}

def fetch_totals() -> Dict[str, float]:
    url = f"{EGAUGE_HOST}/cgi-bin/egauge?tot"
    logger.info(f"Fetching totals from {url}")

    try:
        res = requests.get(
            url,
            auth=HTTPDigestAuth(EGAUGE_USER, EGAUGE_PASS),
            timeout=10
        )

        if res.status_code != 200:
            logger.error(f"Totals fetch failed: {res.status_code}")
            return {}

        return parse_egauge_xml(res.text)

    except Exception as e:
        logger.error(f"Totals fetch error: {e}")
        return {}

# ============================================
# CACHE
# ============================================
CACHE_EXPIRY_SECONDS = 60
cache: Dict[str, Any] = {}

def get_cache(key: str):
    entry = cache.get(key)
    if entry:
        value, ts = entry
        if time.time() - ts < CACHE_EXPIRY_SECONDS:
            return value
        del cache[key]
    return None

def set_cache(key: str, value: Any):
    cache[key] = (value, time.time())

# ============================================
# ROUTES
# ============================================
@app.get("/api/energy/instant", response_model=EnergyData)
async def get_instantaneous_data():
    raw_data = fetch_instantaneous()

    if not raw_data:
        raise HTTPException(status_code=503, detail="No data from meter")

    # REAL REGISTER USED BY YOUR METER
    grid_value = raw_data.get("Main Incomer", 0.0)

    return EnergyData(
        meter_name=METER_NAME,
        timestamp=datetime.now(timezone.utc).isoformat(),
        current_power=round(abs(grid_value), 2),
        solar_generation=0.0,
        grid_import=grid_value if grid_value > 0 else 0.0,
        grid_export=abs(grid_value) if grid_value < 0 else 0.0,
        raw_data=raw_data
    )

@app.get("/api/energy/debug/registers")
async def debug_registers():
    raw_data = fetch_instantaneous()

    url = f"{EGAUGE_HOST}/cgi-bin/egauge?inst"
    xml_sample = ""

    try:
        res = requests.get(
            url,
            auth=HTTPDigestAuth(EGAUGE_USER, EGAUGE_PASS),
            timeout=5
        )
        if res.status_code == 200:
            xml_sample = res.text[:1000]
    except Exception:
        pass

    return {
        "available_registers": list(raw_data.keys()),
        "register_values": raw_data,
        "raw_xml_sample": xml_sample
    }

# ============================================
# SUMMARY
# ============================================
def compute_summary(start_dt: datetime, end_dt: datetime) -> Dict:
    totals_start = fetch_totals()
    time.sleep(1)
    totals_end = fetch_totals()

    if not totals_start or not totals_end:
        return {"error": "Unable to compute totals"}

    start = totals_start.get("Main Incomer", 0)
    end = totals_end.get("Main Incomer", 0)

    delta_wh = max(end - start, 0)
    delta_kwh = round(delta_wh / 1000, 3)

    return {
        "period": {"start": start_dt.isoformat(), "end": end_dt.isoformat()},
        "energy_used_kwh": delta_kwh,
        "cost_estimate": {
            "currency": "ZAR",
            "amount": round(delta_kwh * ENERGY_TARIFF, 2),
            "tariff_per_kwh": ENERGY_TARIFF
        }
    }

@app.get("/api/energy/summary")
async def get_energy_summary(start: str, end: str):
    cache_key = f"{start}_{end}"
    cached = get_cache(cache_key)
    if cached:
        return cached

    start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
    end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))

    result = compute_summary(start_dt, end_dt)
    set_cache(cache_key, result)
    return result

# ============================================
# HEALTH
# ============================================
@app.get("/api/health", response_model=HealthCheck)
async def health_check():
    meter_ok = False

    try:
        r = requests.get(
            f"{EGAUGE_HOST}/cgi-bin/egauge?inst",
            auth=HTTPDigestAuth(EGAUGE_USER, EGAUGE_PASS),
            timeout=3
        )
        meter_ok = r.status_code == 200
    except Exception:
        pass

    return HealthCheck(
        status="healthy" if meter_ok else "degraded",
        meter_connection=meter_ok,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

# ============================================
# START
# ============================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
