import random
import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from schemas import (
    CreditCalculateRequest,
    CreditCalculationResponse,
    CreditListingResponse,
    BuyRequest,
    PurchaseResponse,
    RetireRequest,
    RetirementCertificate
)

router = APIRouter(prefix="/marketplace", tags=["Marketplace Engine"])
logger = logging.getLogger("carbon_marketplace")

# Global variables for in-memory databases (synchronized on startup)
ies_db: List[Dict[str, Any]] = []
calculations_db: List[Dict[str, Any]] = []
listings_db: List[Dict[str, Any]] = []
purchases_db: List[Dict[str, Any]] = []
retirements_db: List[Dict[str, Any]] = []

# ---------------------------------------------------------------------------
# Dynamic Valuation / Pricing Algorithm
# ---------------------------------------------------------------------------

def fetch_external_market_indicators() -> dict:
    """
    Mock external API call to fetch active global carbon market pricing indicators.
    In production, this would request live indexes from carbon registries or trading desks.
    """
    # Emulating external HTTP request delay and returns
    return {
        "market_demand_multiplier": round(random.uniform(0.98, 1.18), 2),
        "liquidity_multiplier": round(random.uniform(0.95, 1.05), 2),
        "base_credit_price_inr": round(random.uniform(1150.00, 1350.00), 2),
    }


def calculate_fair_market_price(
    vintage: int,
    project_type: str,
    quality_rating: str
) -> float:
    """
    Dynamic Pricing Algorithm:
    Computes credit fair price using Vintage adjustment, Quality rating multipliers,
    Project type factors, and external market indicators.
    
    Formula:
      Fair Price = Base Price * Vintage Adjustment * Quality Multiplier * Demand Multiplier * Liquidity Multiplier
    """
    market = fetch_external_market_indicators()
    base_price = market["base_credit_price_inr"]
    demand_mult = market["market_demand_multiplier"]
    liquidity_mult = market["liquidity_multiplier"]
    
    # 1. Vintage adjustment: deprecate 6% per year old up to a limit
    current_year = datetime.now(timezone.utc).year
    age = max(0, current_year - vintage)
    vintage_adjustment = max(0.40, 1.0 - (age * 0.06))
    
    # 2. Quality multiplier based on Project Quality Rating (AAA, AA, A, BBB etc.)
    rating_multipliers = {
        "AAA": 1.25,
        "AA": 1.15,
        "A": 1.00,
        "BBB": 0.90,
        "BB": 0.80,
        "B": 0.70
    }
    quality_multiplier = rating_multipliers.get(quality_rating.upper(), 0.85)
    
    # 3. Project type coefficients
    type_multipliers = {
        "solar": 1.05,
        "wind": 0.95,
        "biomass": 1.10,
        "methane": 1.20,
        "forestry": 1.25
    }
    type_multiplier = type_multipliers.get(project_type.lower(), 1.00)
    
    fair_price = base_price * vintage_adjustment * quality_multiplier * type_multiplier * demand_mult * liquidity_mult
    return round(fair_price, 2)


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.get("/ies-data", response_model=List[Dict[str, Any]])
def list_ies_data() -> List[Dict[str, Any]]:
    """Fetch mock India Energy Stack (IES) grid data representing regional producers."""
    return ies_db


@router.get("/ies-data/{id}", response_model=Dict[str, Any])
def get_ies_data(id: str) -> Dict[str, Any]:
    """Retrieve detailed India Energy Stack node properties by ID."""
    for entry in ies_db:
        if entry["id"] == id or entry.get("producer_id") == id:
            return entry
    raise HTTPException(status_code=404, detail="IES node not found.")


@router.post("/calculate", response_model=CreditCalculationResponse)
def calculate_credits(
    body: CreditCalculateRequest,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Calculate total carbon credits generated based on verified IES data.
    Formula: Credits (tCO2e) = generation (kWh) * (fossil percent / 100) * grid grid-emission factor (0.82 kg/kWh) / 1000
    Validates seller credentials and claims.
    """
    # Retrieve matching IES record
    ies_record = None
    for entry in ies_db:
        if entry["id"] == body.ies_data_id or entry.get("producer_id") == body.ies_data_id:
            ies_record = entry
            break
            
    if not ies_record:
        raise HTTPException(status_code=404, detail="India Energy Stack (IES) record not found.")

    # Calculations with fallback support for manual checks
    energy_kwh = body.monthly_generation_kwh if body.monthly_generation_kwh is not None else float(ies_record.get("monthly_generation_kwh", 0))
    fossil_percent = body.grid_fossil_fuel_percent if body.grid_fossil_fuel_percent is not None else float(ies_record.get("grid_fossil_fuel_percent", 0))
    
    if energy_kwh <= 0:
        raise HTTPException(status_code=400, detail="Invalid monthly energy generation value.")
        
    co2_avoided_kg = energy_kwh * (fossil_percent / 100.0) * 0.82
    net_credits = round(co2_avoided_kg / 1000.0, 4)

    calculation = {
        "id": f"CALC-{uuid.uuid4().hex[:8].upper()}",
        "ies_data_id": ies_record["id"],
        "seller_id": current_user["id"],
        "co2_avoided_kg": co2_avoided_kg,
        "net_credits": net_credits,
        "status": "approved",  # Automating validation for prototyping
        "created_at": datetime.now(timezone.utc)
    }
    
    calculations_db.append(calculation)
    
    # Auto-generate a credit listing in the marketplace
    vintage = datetime.now(timezone.utc).year - 1
    project_type = ies_record.get("energy_type", "solar")
    quality_rating = random.choice(["AAA", "AA", "A", "BBB"])
    price_per_credit = calculate_fair_market_price(vintage, project_type, quality_rating)
    
    listing = {
        "id": f"LIST-{uuid.uuid4().hex[:8].upper()}",
        "seller_id": current_user["id"],
        "calculation_id": calculation["id"],
        "credits_available": net_credits,
        "price_per_credit_inr": price_per_credit,
        "batch_id": f"CC-{vintage}-{random.randint(1000, 9999)}",
        "status": "available",
        "vintage": vintage,
        "project_type": project_type,
        "quality_rating": quality_rating
    }
    listings_db.append(listing)
    logger.info(f"Auto-created listing {listing['id']} for seller {current_user['id']}")

    return calculation


@router.get("/listings", response_model=List[CreditListingResponse])
def get_marketplace_listings() -> List[Dict[str, Any]]:
    """Retrieve active carbon credit listings available on the Listing Board."""
    return [l for l in listings_db if l["status"] in ("available", "partial")]


@router.get("/listings/valuation/{listing_id}")
def evaluate_listing_price(listing_id: str) -> dict:
    """Exposes dynamic pricing valuation factors for buyers prior to purchase."""
    listing = None
    for l in listings_db:
        if l["id"] == listing_id:
            listing = l
            break
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
        
    fair_price = calculate_fair_market_price(
        listing["vintage"],
        listing["project_type"],
        listing["quality_rating"]
    )
    
    return {
        "listing_id": listing_id,
        "vintage": listing["vintage"],
        "project_type": listing["project_type"],
        "quality_rating": listing["quality_rating"],
        "current_listing_price_inr": listing["price_per_credit_inr"],
        "calculated_fair_value_inr": fair_price,
        "valuation_variance_inr": round(fair_price - listing["price_per_credit_inr"], 2)
    }


@router.post("/buy", response_model=PurchaseResponse)
def buy_credits(
    body: BuyRequest,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Process credit purchasing. Deducts credits from active inventory,
    registers financial billing credentials, and updates listing states.
    """
    listing = None
    for l in listings_db:
        if l["id"] == body.listing_id:
            listing = l
            break
            
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found.")
        
    if listing["status"] not in ("available", "partial"):
        raise HTTPException(status_code=400, detail="Listing is no longer available.")

    credits_avail = float(listing["credits_available"])
    if body.credits_to_buy > credits_avail:
        raise HTTPException(status_code=400, detail=f"Insufficient credits. Only {credits_avail} available.")

    # Calculate financial details
    price_per_credit = float(listing["price_per_credit_inr"])
    total_price = body.credits_to_buy * price_per_credit

    # Create purchase record
    purchase = {
        "id": f"PUR-{uuid.uuid4().hex[:8].upper()}",
        "buyer_id": current_user["id"],
        "listing_id": body.listing_id,
        "credits_bought": body.credits_to_buy,
        "total_price_inr": total_price,
        "retirement_status": "active",
        "created_at": datetime.now(timezone.utc),
        # Financial validation payloads stored securely (mocked)
        "financials": {
            "upi_id": body.upi_id,
            "card_hash": hashlib_token(body.card_token) if body.card_token else None,
            "gstin": body.gstin,
            "ies_id": body.ies_id
        }
    }
    purchases_db.append(purchase)

    # Deduct listing balances
    new_credits_avail = round(credits_avail - body.credits_to_buy, 4)
    listing["credits_available"] = new_credits_avail
    
    if new_credits_avail <= 0:
        listing["status"] = "sold"
    else:
        listing["status"] = "partial"

    logger.info(f"Purchase {purchase['id']} complete. Buyer: {current_user['id']}")
    return purchase


@router.post("/retire/{purchase_id}", response_model=RetirementCertificate)
def retire_credits(
    purchase_id: str,
    body: RetireRequest,
    current_user: dict = Depends(get_current_user)
) -> dict:
    """
    Retires a purchased block of carbon offset credits permanently.
    Generates a unique digital Carbon Offset Certificate assigned to the buyer's credentials.
    """
    purchase = None
    for p in purchases_db:
        if p["id"] == purchase_id:
            purchase = p
            break
            
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase record not found.")

    if purchase["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized. You do not own this purchase.")

    if purchase["retirement_status"] == "retired":
        raise HTTPException(status_code=400, detail="Credits already retired.")

    # Retrieve buyer details
    buyer_name = current_user.get("name", "Verified Buyer")
    gstin = purchase["financials"]["gstin"]
    ies_id = purchase["financials"]["ies_id"]

    # Generate certificate credentials
    certificate_id = f"CERT-{uuid.uuid4().hex[:12].upper()}"
    verification_hash = hashlib_token(f"{certificate_id}-{purchase_id}-{buyer_name}")

    certificate = {
        "certificate_id": certificate_id,
        "purchase_id": purchase_id,
        "buyer_name": buyer_name,
        "buyer_id": current_user["id"],
        "ies_id": ies_id,
        "gstin": gstin,
        "credits_retired": purchase["credits_bought"],
        "retired_at": datetime.now(timezone.utc),
        "reason": body.reason,
        "verification_hash": verification_hash
    }
    retirements_db.append(certificate)

    # Permanent retirement status change
    purchase["retirement_status"] = "retired"
    
    logger.info(f"Certificate {certificate_id} issued. Credits retired: {purchase['credits_bought']}")
    return certificate


# Helper security token hash
def hashlib_token(payload: str) -> str:
    """Encodes billing payment credentials using simple secure hashing representation."""
    import hashlib
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]
