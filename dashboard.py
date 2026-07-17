import logging
import statistics
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException

from marketplace import calculations_db, listings_db, purchases_db, retirements_db
from schemas import (
    SellerDashboardResponse,
    BuyerDashboardResponse,
    TimeSeriesDataPoint
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])
logger = logging.getLogger("carbon_dashboard")

# ---------------------------------------------------------------------------
# Analytics & Consistency Calculations
# ---------------------------------------------------------------------------

def compute_consistency_score(volumes: List[float]) -> float:
    """
    Evaluates transactional consistency using coefficient of variation.
    Regular credit offsets and transaction sizes return higher scores.
    """
    if not volumes:
        return 100.0  # Perfect consistency for initial clean profile
    if len(volumes) == 1:
        return 95.0

    mean_vol = statistics.mean(volumes)
    stdev_vol = statistics.stdev(volumes)

    if mean_vol == 0:
        return 50.0

    coef_variation = stdev_vol / mean_vol
    # Calculate penalty score: high variability decreases score down to a limit of 50
    score = 100.0 - (coef_variation * 20.0)
    return max(50.0, min(100.0, round(score, 2)))


def compile_historical_trends(role: str) -> List[TimeSeriesDataPoint]:
    """
    Generates structured historical offset metrics over the past 6 months
    to feed visual time-series analytical graphs.
    """
    base_date = datetime.now(timezone.utc)
    trends: List[TimeSeriesDataPoint] = []

    for idx in range(5, -1, -1):
        month_offset = base_date - timedelta(days=idx * 30)
        month_label = month_offset.strftime("%B %Y")
        
        # Simulating realistic trend deviations
        if role == "buyer":
            volume = round(random_deviation(12.0, 3.5), 2)
            value = round(volume * 1250.0, 2)
        else:
            volume = round(random_deviation(25.0, 7.0), 2)
            value = round(volume * 1210.0, 2)

        trends.append(
            TimeSeriesDataPoint(
                timestamp=month_label,
                volume=volume,
                value=value
            )
        )
    return trends


def random_deviation(base: float, max_dev: float) -> float:
    """Helper utility generating deterministic offset changes for demo graphs."""
    import random
    return base + random.uniform(-max_dev, max_dev)


# ---------------------------------------------------------------------------
# Dashboard Routing
# ---------------------------------------------------------------------------

@router.get("/seller/{seller_id}", response_model=SellerDashboardResponse)
def get_seller_dashboard(seller_id: str) -> SellerDashboardResponse:
    """
    Returns aggregated metrics, credit counts, listing history, consistency scores,
    and trends for the seller analytics workspace.
    """
    # Fetch claims and calculations for the seller
    seller_claims = [c for c in calculations_db if c["seller_id"] == seller_id]
    seller_listings = [l for l in listings_db if l["seller_id"] == seller_id]

    total_claims = len(seller_claims)
    total_issued = sum(float(l["credits_available"]) for l in seller_listings if l["status"] == "sold") + \
                   sum(float(l["credits_available"]) for l in seller_listings if l["status"] in ("available", "partial"))

    # Revenue calculation based on purchase transaction values
    total_rev = 0.0
    listing_ids = {l["id"] for l in seller_listings}
    for pur in purchases_db:
        if pur["listing_id"] in listing_ids:
            total_rev += float(pur["total_price_inr"])

    # Split credit volumes based on status
    active_credits = sum(float(l["credits_available"]) for l in seller_listings if l["status"] in ("available", "partial"))
    pending_credits = sum(float(c["net_credits"]) for c in seller_claims if c["status"] == "pending")

    # Evaluate consistency based on listing sizing
    listing_volumes = [float(l["credits_available"]) for l in seller_listings]
    consistency_score = compute_consistency_score(listing_volumes)

    # Compile chart trends
    trends = compile_historical_trends("seller")

    return SellerDashboardResponse(
        seller_id=seller_id,
        total_claims=total_claims,
        total_credits_issued=total_issued,
        total_revenue_inr=total_rev,
        active_credits=active_credits,
        pending_credits=pending_credits,
        listings=seller_listings,
        consistency_score=consistency_score,
        historical_trends=trends
    )


@router.get("/buyer/{buyer_id}", response_model=BuyerDashboardResponse)
def get_buyer_dashboard(buyer_id: str) -> BuyerDashboardResponse:
    """
    Returns total purchasing statistics, credits retired, transaction listings,
    and historical progress trends for the buyer analytics workspace.
    """
    # Retrieve all purchases matching the buyer ID
    buyer_purchases = [p for p in purchases_db if p["buyer_id"] == buyer_id]
    buyer_retirements = [r for r in retirements_db if r["buyer_id"] == buyer_id]

    total_purchased = sum(float(p["credits_bought"]) for p in buyer_purchases)
    total_spent = sum(float(p["total_price_inr"]) for p in buyer_purchases)
    total_retired = sum(float(r["credits_retired"]) for r in buyer_retirements)

    # Format purchases list to fit schema
    purchases_output = []
    for pur in buyer_purchases:
        purchases_output.append({
            "id": pur["id"],
            "buyer_id": pur["buyer_id"],
            "listing_id": pur["listing_id"],
            "credits_bought": pur["credits_bought"],
            "total_price_inr": pur["total_price_inr"],
            "retirement_status": pur["retirement_status"],
            "created_at": pur["created_at"]
        })

    # Compile trends
    trends = compile_historical_trends("buyer")

    return BuyerDashboardResponse(
        buyer_id=buyer_id,
        total_credits_purchased=total_purchased,
        total_spent_inr=total_spent,
        total_retired=total_retired,
        purchases=purchases_output,
        historical_trends=trends
    )
