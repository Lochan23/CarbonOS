from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field

class OTPRequest(BaseModel):
    """Schema for requesting a login OTP code."""
    email: str = Field(..., description="User email address")

class OTPVerify(BaseModel):
    """Schema for verifying a submitted OTP code."""
    email: str = Field(..., description="User email address")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")

class RegisterRequest(BaseModel):
    """Schema for registering a new user."""
    name: str = Field(..., min_length=2, max_length=50, description="Full name")
    email: str = Field(..., description="Email address")
    password: str = Field(..., min_length=6, description="Password (min 6 characters)")
    role: Literal["seller", "buyer", "auditor"] = Field(..., description="User marketplace role")

class LoginRequest(BaseModel):
    """Schema for logging in using password auth."""
    email: str = Field(..., description="Email address")
    password: str = Field(..., description="Password")

class TokenResponse(BaseModel):
    """Schema for JWT token emission responses."""
    token: str
    token_type: str = "bearer"
    role: str

class CreditCalculateRequest(BaseModel):
    """Schema for seller carbon offset credit generation calculations."""
    ies_data_id: str = Field(..., description="Unique ID pointing to verified India Energy Stack entry")
    monthly_generation_kwh: Optional[float] = Field(None, gt=0, description="Optional override for energy generated in kWh")
    grid_fossil_fuel_percent: Optional[float] = Field(None, ge=0, le=100, description="Optional override for grid fossil fuel percentage")

class CreditCalculationResponse(BaseModel):
    """Schema representing calculation output for credits estimation."""
    id: str
    ies_data_id: str
    seller_id: str
    co2_avoided_kg: float
    net_credits: float
    status: str
    created_at: datetime

class CreditListingResponse(BaseModel):
    """Schema representing an active listing on the CarbonOS Board."""
    id: str
    seller_id: str
    calculation_id: str
    credits_available: float
    price_per_credit_inr: float
    batch_id: str
    status: str
    vintage: int
    project_type: str
    quality_rating: str

class BuyRequest(BaseModel):
    """Schema for buyer purchase actions in the Marketplace."""
    listing_id: str = Field(..., description="The marketplace listing reference identifier")
    credits_to_buy: float = Field(..., gt=0, description="Volume of credits to buy")
    upi_id: Optional[str] = Field(None, description="Buyer's UPI address for payment")
    card_token: Optional[str] = Field(None, description="Buyer's encrypted credit card transaction token")
    gstin: str = Field(..., description="Buyer Goods and Services Tax Identification Number")
    ies_id: str = Field(..., description="Buyer regional registry matching IES ID")

class PurchaseResponse(BaseModel):
    """Schema representing successful transaction purchase history entries."""
    id: str
    buyer_id: str
    listing_id: str
    credits_bought: float
    total_price_inr: float
    retirement_status: str
    created_at: datetime

class RetireRequest(BaseModel):
    """Schema for credit retirement rationale."""
    reason: str = Field(..., min_length=5, description="Climate action offset claim reason")

class RetirementCertificate(BaseModel):
    """Schema representing a digital offset certificate issued after retiring carbon credits."""
    certificate_id: str
    purchase_id: str
    buyer_name: str
    buyer_id: str
    ies_id: str
    gstin: str
    credits_retired: float
    retired_at: datetime
    reason: str
    verification_hash: str

class TimeSeriesDataPoint(BaseModel):
    """Schema representing chronological metrics for dashboard trends."""
    timestamp: str
    volume: float
    value: float

class SellerDashboardResponse(BaseModel):
    """Schema representing aggregated metrics for seller dashboards."""
    seller_id: str
    total_claims: int
    total_credits_issued: float
    total_revenue_inr: float
    active_credits: float
    pending_credits: float
    listings: List[CreditListingResponse]
    consistency_score: float
    historical_trends: List[TimeSeriesDataPoint]

class BuyerDashboardResponse(BaseModel):
    """Schema representing aggregated metrics for buyer dashboards."""
    buyer_id: str
    total_credits_purchased: float
    total_spent_inr: float
    total_retired: float
    purchases: List[PurchaseResponse]
    historical_trends: List[TimeSeriesDataPoint]
