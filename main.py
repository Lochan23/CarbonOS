import json
import os
import random
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import auth
import marketplace
import dashboard

app = FastAPI(
    title="CarbonOS Carbon-Credit Platform",
    description="Production-ready FastAPI backend supporting verification, calculation, and marketplace trading of carbon offsets.",
    version="1.0.0"
)

# Global CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register router files
app.include_router(auth.router)
app.include_router(marketplace.router)
app.include_router(dashboard.router)


# ---------------------------------------------------------------------------
# Database preloading on startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
def load_mock_databases() -> None:
    """
    On startup, parses MockDemo.json to populate the in-memory dictionary and list stores.
    Generates default marketplace listings to showcase listing board analytics instantly.
    """
    mock_demo_path = "MockDemo.json"
    if not os.path.exists(mock_demo_path):
        print(f"[Warning] Startup: {mock_demo_path} file not found. In-memory databases are empty.")
        return

    try:
        with open(mock_demo_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Load users into auth users_db
        users_list = data.get("users", [])
        for u in users_list:
            email = u["email"].lower()
            auth.users_db[email] = {
                "id": u["id"],
                "name": u["name"],
                "email": email,
                # Keep bcrypt hashes or create standard hashing representations
                "password": u.get("password_hash") or auth.hash_password("demo123"),
                "role": u["role"]
            }
        print(f"[Startup] Preloaded {len(users_list)} authenticated users from MockDemo.json.")

        # 2. Load India Energy Stack nodes
        ies_list = data.get("ies_data", [])
        marketplace.ies_db.extend(ies_list)
        print(f"[Startup] Preloaded {len(ies_list)} India Energy Stack regional records.")

        # 3. Create default active credit listings
        # Select first two solar/biomass projects to register active credits listings
        demo_seller = users_list[0] if users_list else {"id": "mock-seller-id"}
        
        for idx, entry in enumerate(ies_list[:3]):
            energy_kwh = float(entry.get("monthly_generation_kwh", 6200))
            fossil_percent = float(entry.get("grid_fossil_fuel_percent", 70))
            co2_avoided_kg = energy_kwh * (fossil_percent / 100.0) * 0.82
            net_credits = round(co2_avoided_kg / 1000.0, 4)

            calc_id = f"CALC-{uuid.uuid4().hex[:8].upper()}"
            calculation = {
                "id": calc_id,
                "ies_data_id": entry["id"],
                "seller_id": demo_seller["id"],
                "co2_avoided_kg": co2_avoided_kg,
                "net_credits": net_credits,
                "status": "approved",
                "created_at": datetime.now(timezone.utc)
            }
            marketplace.calculations_db.append(calculation)

            vintage = 2025
            project_type = entry.get("energy_type", "solar")
            rating = ["AAA", "AA", "A"][idx % 3]
            price = marketplace.calculate_fair_market_price(vintage, project_type, rating)

            listing = {
                "id": f"LIST-{uuid.uuid4().hex[:8].upper()}",
                "seller_id": demo_seller["id"],
                "calculation_id": calc_id,
                "credits_available": net_credits,
                "price_per_credit_inr": price,
                "batch_id": f"CC-{vintage}-{random.randint(1000, 9999)}",
                "status": "available",
                "vintage": vintage,
                "project_type": project_type,
                "quality_rating": rating
            }
            marketplace.listings_db.append(listing)

        print(f"[Startup] Pre-populated Marketplace Listings board with default entries.")

    except Exception as e:
        print(f"[Error] Startup preloading failed: {e}")


@app.get("/")
def root() -> dict:
    """Health check root endpoint confirming server execution state."""
    return {
        "status": "online",
        "message": "CarbonOS backend server is running.",
        "api_docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    # Launch local server using standard host configurations
    uvicorn.run(app, host="0.0.0.0", port=8000)