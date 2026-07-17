import json
import random
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any, Literal, Optional

import bcrypt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

app = FastAPI(title="Carbon Credit Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ---------------------------------------------------------------------------
# Pydantic request models
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Literal["seller", "buyer", "auditor"]


class LoginRequest(BaseModel):
    email: str
    password: str


class AuditUpdateRequest(BaseModel):
    audit_status: Literal["approved", "rejected"]
    auditor_notes: str


class BuyRequest(BaseModel):
    listing_id: str
    credits_to_buy: float = Field(..., gt=0)


class RetireRequest(BaseModel):
    reason: str


class CalculateRequest(BaseModel):
    ies_data_id: str


# ---------------------------------------------------------------------------
# Supabase helpers (urllib.request)
# ---------------------------------------------------------------------------

def _supabase_headers(extra: Optional[dict[str, str]] = None) -> dict[str, str]:
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def _encode_filter(column: str, operator: str, value: Any) -> str:
    return f"{column}={operator}.{urllib.parse.quote(str(value), safe='')}"


def supabase_request(
    method: str,
    table: str,
    *,
    filters: Optional[list[str]] = None,
    body: Optional[Any] = None,
    prefer: Optional[str] = None,
) -> Any:
    query = f"?{'&'.join(filters)}" if filters else ""
    url = f"{SUPABASE_URL}/rest/v1/{table}{query}"

    headers = _supabase_headers({"Prefer": prefer} if prefer else None)
    data = json.dumps(body).encode("utf-8") if body is not None else None

    request = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise HTTPException(status_code=exc.code, detail=detail or exc.reason) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc.reason),
        ) from exc


def supabase_get(table: str, filters: Optional[list[str]] = None) -> list[dict[str, Any]]:
    result = supabase_request("GET", table, filters=filters)
    return result if isinstance(result, list) else []


def supabase_get_one(table: str, filters: list[str]) -> Optional[dict[str, Any]]:
    rows = supabase_get(table, filters)
    return rows[0] if rows else None


def supabase_post(table: str, payload: dict[str, Any]) -> dict[str, Any]:
    result = supabase_request(
        "POST",
        table,
        body=payload,
        prefer="return=representation",
    )
    if isinstance(result, list):
        return result[0]
    return result


def supabase_patch(
    table: str,
    filters: list[str],
    payload: dict[str, Any],
) -> dict[str, Any]:
    result = supabase_request(
        "PATCH",
        table,
        filters=filters,
        body=payload,
        prefer="return=representation",
    )
    if isinstance(result, list):
        return result[0]
    return result


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {
        "id": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if "id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Carbon Credit Platform is running."}


@app.post("/auth/register")
def register(body: RegisterRequest) -> dict[str, Any]:
    existing = supabase_get("users", [_encode_filter("email", "eq", body.email)])
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = supabase_post(
        "users",
        {
            "name": body.name,
            "email": body.email,
            "password": hash_password(body.password),
            "role": body.role,
        },
    )

    token = create_access_token(user["id"], user["email"], user["role"])

    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }


@app.post("/auth/login")
def login(body: LoginRequest) -> dict[str, str]:
    user = supabase_get_one("users", [_encode_filter("email", "eq", body.email)])
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user["id"], user["email"], user["role"])
    return {"token": token}


@app.get("/ies-data")
def list_ies_data() -> list[dict[str, Any]]:
    return supabase_get("ies_data")


@app.get("/ies-data/{id}")
def get_ies_data(id: str) -> dict[str, Any]:
    row = supabase_get_one("ies_data", [_encode_filter("id", "eq", id)])
    if not row:
        raise HTTPException(status_code=404, detail="IES data not found")
    return row


@app.post("/calculate")
def calculate_credits(
    body: CalculateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    ies_data = supabase_get_one(
        "ies_data",
        [_encode_filter("id", "eq", body.ies_data_id)],
    )
    if not ies_data:
        raise HTTPException(status_code=404, detail="IES data not found")

    if ies_data.get("monthly_generation_kwh") is None:
        raise HTTPException(status_code=400, detail="monthly_generation_kwh is required")
    if ies_data.get("grid_fossil_fuel_percent") is None:
        raise HTTPException(status_code=400, detail="grid_fossil_fuel_percent is required")

    energy_kwh = float(ies_data["monthly_generation_kwh"])
    fossil_percent = float(ies_data["grid_fossil_fuel_percent"])
    co2_avoided_kg = energy_kwh * (fossil_percent / 100) * 0.82
    net_credits = co2_avoided_kg / 1000

    calculation = supabase_post(
        "credit_calculations",
        {
            "ies_data_id": body.ies_data_id,
            "seller_id": current_user["id"],
            "co2_avoided_kg": co2_avoided_kg,
            "net_credits": net_credits,
            "status": "pending",
        },
    )

    supabase_post(
        "audits",
        {
            "calculation_id": calculation["id"],
            "seller_id": current_user["id"],
            "audit_status": "pending",
        },
    )

    supabase_post(
        "claims",
        {
            "seller_id": current_user["id"],
            "calculation_id": calculation["id"],
        },
    )

    return calculation


@app.post("/claims")
def list_pending_claims(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    audits = supabase_get("audits", [_encode_filter("audit_status", "eq", "pending")])

    enriched: list[dict[str, Any]] = []
    for audit in audits:
        calculation = None
        ies_data = None

        calculation_id = audit.get("calculation_id")
        if calculation_id:
            calculation = supabase_get_one(
                "credit_calculations",
                [_encode_filter("id", "eq", calculation_id)],
            )
            if calculation and calculation.get("ies_data_id"):
                ies_data = supabase_get_one(
                    "ies_data",
                    [_encode_filter("id", "eq", calculation["ies_data_id"])],
                )

        enriched.append(
            {
                **audit,
                "credit_calculation": calculation,
                "ies_data": ies_data,
            }
        )

    return enriched


@app.put("/audit/{audit_id}")
def update_audit(
    audit_id: str,
    body: AuditUpdateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    audit = supabase_get_one("audits", [_encode_filter("id", "eq", audit_id)])
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    updated_audit = supabase_patch(
        "audits",
        [_encode_filter("id", "eq", audit_id)],
        {
            "audit_status": body.audit_status,
            "auditor_notes": body.auditor_notes,
            "reviewed_at": utc_now_iso(),
            "auditor_id": current_user["id"],
        },
    )

    if body.audit_status == "approved":
        calculation_id = audit.get("calculation_id")
        if not calculation_id:
            raise HTTPException(status_code=400, detail="Audit has no linked calculation")

        calculation = supabase_get_one(
            "credit_calculations",
            [_encode_filter("id", "eq", calculation_id)],
        )
        if not calculation:
            raise HTTPException(status_code=404, detail="Credit calculation not found")

        supabase_patch(
            "credit_calculations",
            [_encode_filter("id", "eq", calculation_id)],
            {"status": "approved"},
        )

        batch_id = f"CC-2026-{random.randint(1000, 9999)}"
        supabase_post(
            "credit_listings",
            {
                "seller_id": audit.get("seller_id") or calculation.get("seller_id"),
                "calculation_id": calculation_id,
                "credits_available": calculation.get("net_credits", 0),
                "price_per_credit_inr": 1200,
                "batch_id": batch_id,
                "status": "available",
            },
        )

    return updated_audit


@app.get("/marketplace")
def marketplace() -> list[dict[str, Any]]:
    return supabase_get("credit_listings", [_encode_filter("status", "eq", "available")])


@app.post("/buy")
def buy_credits(
    body: BuyRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    listing = supabase_get_one(
        "credit_listings",
        [_encode_filter("id", "eq", body.listing_id)],
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    credits_available = float(listing.get("credits_available", 0))
    if body.credits_to_buy > credits_available:
        raise HTTPException(status_code=400, detail="Not enough credits available")

    price_per_credit = float(listing.get("price_per_credit_inr", 0))
    total_price_inr = body.credits_to_buy * price_per_credit

    purchase = supabase_post(
        "purchases",
        {
            "buyer_id": current_user["id"],
            "listing_id": body.listing_id,
            "credits_bought": body.credits_to_buy,
            "total_price_inr": total_price_inr,
            "retirement_status": "active",
        },
    )

    new_credits_available = credits_available - body.credits_to_buy
    new_status = "sold" if new_credits_available == 0 else "partial"

    supabase_patch(
        "credit_listings",
        [_encode_filter("id", "eq", body.listing_id)],
        {
            "credits_available": new_credits_available,
            "status": new_status,
        },
    )

    return purchase


@app.post("/retire/{purchase_id}")
def retire_credits(
    purchase_id: str,
    body: RetireRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    purchase = supabase_get_one("purchases", [_encode_filter("id", "eq", purchase_id)])
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    if purchase.get("buyer_id") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to retire this purchase")

    if purchase.get("retirement_status") == "retired":
        raise HTTPException(status_code=400, detail="Purchase already retired")

    certificate_id = f"RET-2026-{random.randint(100000, 999999)}"

    retirement = supabase_post(
        "retirements",
        {
            "purchase_id": purchase_id,
            "buyer_id": current_user["id"],
            "certificate_id": certificate_id,
            "credits_retired": purchase.get("credits_bought", 0),
            "retired_at": utc_now_iso(),
            "reason": body.reason,
        },
    )

    supabase_patch(
        "purchases",
        [_encode_filter("id", "eq", purchase_id)],
        {"retirement_status": "retired"},
    )

    return retirement


@app.get("/dashboard/seller/{seller_id}")
def seller_dashboard(seller_id: str) -> dict[str, Any]:
    claims = supabase_get("claims", [_encode_filter("seller_id", "eq", seller_id)])
    listings = supabase_get("credit_listings", [_encode_filter("seller_id", "eq", seller_id)])

    total_credits_issued = sum(float(l.get("credits_available", 0)) for l in listings)
    total_revenue = sum(
        float(l.get("credits_available", 0)) * float(l.get("price_per_credit_inr", 0))
        for l in listings
    )

    return {
        "seller_id": seller_id,
        "total_claims": len(claims),
        "total_credits_issued": total_credits_issued,
        "total_revenue": total_revenue,
        "listings": listings,
    }


@app.get("/dashboard/buyer/{buyer_id}")
def buyer_dashboard(buyer_id: str) -> dict[str, Any]:
    purchases = supabase_get("purchases", [_encode_filter("buyer_id", "eq", buyer_id)])
    retirements = supabase_get("retirements", [_encode_filter("buyer_id", "eq", buyer_id)])

    total_credits_purchased = sum(float(p.get("credits_bought", 0)) for p in purchases)
    total_spent = sum(float(p.get("total_price_inr", 0)) for p in purchases)
    total_retired = sum(float(r.get("credits_retired", 0)) for r in retirements)

    return {
        "buyer_id": buyer_id,
        "total_credits_purchased": total_credits_purchased,
        "total_spent": total_spent,
        "total_retired": total_retired,
        "purchases": purchases,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)