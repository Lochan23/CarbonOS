"""
Carbon Credit Calculation & Valuation Engine (Backend Module)
================================================================
Ye module backend service (Flask/FastAPI) me import karke use hota hai.
Koi print() nahi hai - har function apni value return karta hai,
aur errors ke liye exceptions raise karta hai (logging ke through track hote hain).

Flow:
    1. Frontend se activity data aata hai (energy_kwh, gas_type, quantity, etc.)
    2. GWP se CO2e me convert hota hai (agar gas-based input hai)
    3. Emission Factor API se EF fetch hota hai -> baseline/project/leakage calculate hote hain
    4. Un teeno se total Credits (tCO2e) nikalte hain
    5. Pricing API se factors fetch hote hain -> 1 credit ki fair value (price) calculate hoti hai
    6. Total valuation = credits * price_per_credit
"""

import logging
import requests

logger = logging.getLogger("carbon_credit_engine")

# -----------------------------------------------------------------
# CONFIG - apne actual API endpoints yaha set karo
# -----------------------------------------------------------------
EMISSION_FACTOR_API_URL = "https://your-emission-factor-api.com/api/v1/emission-factor"
PRICING_FACTOR_API_URL = "https://your-pricing-api.com/api/v1/pricing-factors"

# GWP (Global Warming Potential) values - IPCC AR6, 100-year basis
# Ye static/standard values hain, isliye API se nahi, constant table se aate hain
GWP_FACTORS = {
    "CO2": 1,
    "CH4": 28,     # Methane
    "N2O": 265,    # Nitrous Oxide
    "SF6": 23500,
    "HFC": 1430,   # generic average, methodology ke hisaab se specific gas ka use karo
}


# ===================================================================
# STEP 1: GWP se CO2 equivalent me convert karna
# ===================================================================
def convert_to_co2e(gas_type: str, quantity_kg: float) -> float:
    """
    Kisi bhi greenhouse gas ki quantity ko CO2 equivalent (kg CO2e) me convert karta hai.

    Parameters:
        gas_type (str): 'CO2', 'CH4', 'N2O', 'SF6', 'HFC' etc.
        quantity_kg (float): Gas ki quantity (kg me)

    Returns:
        float: CO2 equivalent quantity (kg CO2e)

    Raises:
        ValueError: agar gas_type table me nahi mila
    """
    gas_key = gas_type.upper()
    if gas_key not in GWP_FACTORS:
        raise ValueError(f"Unknown gas_type '{gas_type}', GWP table me nahi mila")

    co2e_kg = quantity_kg * GWP_FACTORS[gas_key]
    return co2e_kg


# ===================================================================
# STEP 2: Emission Factor API call
# ===================================================================
def get_emission_factor(region: str, source_type: str, year: int) -> float:
    """
    API se Emission Factor (EF) fetch karta hai.

    Parameters:
        region (str): 'IN', 'US' etc.
        source_type (str): 'grid', 'diesel', 'petrol', 'manufacturing' etc.
        year (int): reference year

    Returns:
        float: Emission factor (kgCO2/kWh ya kgCO2/liter)

    Raises:
        requests.exceptions.RequestException, KeyError, ValueError
    """
    try:
        response = requests.get(
            EMISSION_FACTOR_API_URL,
            params={"region": region, "source_type": source_type, "year": year},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        return float(data["emission_factor"])
    except (requests.exceptions.RequestException, KeyError, ValueError) as e:
        logger.error(f"get_emission_factor failed for region={region}, source={source_type}: {e}")
        raise


# ===================================================================
# STEP 3: Baseline / Project / Leakage Emission
# ===================================================================
def calculate_baseline_emission(activity_data: float, ef: float) -> float:
    """Baseline Emission (kg CO2) = activity_data * ef"""
    return activity_data * ef


def calculate_project_emission(activity_data: float, ef: float) -> float:
    """Project Emission (kg CO2) = activity_data * ef"""
    return activity_data * ef


def calculate_leakage(leakage_activity_data: float, leakage_ef: float,
                       leakage_factor: float = 1.0) -> float:
    """Leakage Emission (kg CO2) = leakage_activity_data * leakage_ef * leakage_factor"""
    return leakage_activity_data * leakage_ef * leakage_factor


# ===================================================================
# STEP 4: Credits Calculation (backend-safe, no print)
# ===================================================================
def calculate_credits(baseline_emission: float, project_emission: float,
                       leakage: float) -> float:
    """
    Net emission reduction se Carbon Credits (tCO2e) nikalta hai.

    Parameters:
        baseline_emission (float): kg CO2
        project_emission (float): kg CO2
        leakage (float): kg CO2

    Returns:
        float: Total credits generated (tCO2e). Negative reduction par 0.0 return hota hai.
    """
    net_reduction_kg = baseline_emission - project_emission - leakage

    if net_reduction_kg < 0:
        logger.warning("Net reduction negative hai, credits = 0")
        return 0.0

    return round(net_reduction_kg / 1000, 4)


# ===================================================================
# STEP 5: Pricing Factor API call
# ===================================================================
def get_pricing_factors(methodology: str, registry: str, rating: str,
                         vintage_year: int, project_id: str) -> dict:
    """
    Pricing API se fair-value calculation ke liye zaroori factors fetch karta hai.

    Parameters:
        methodology (str): e.g. 'solar', 'ev', 'redd+', 'methane_capture'
        registry (str): e.g. 'verra', 'gold_standard'
        rating (str): quality rating, e.g. 'AA', 'BBB'
        vintage_year (int): credit ka issuance year
        project_id (str): unique project identifier

    Returns:
        dict: {
            "base_price": float,
            "quality_multiplier": float,
            "vintage_adjustment": float,
            "market_adjustment": float,
            "liquidity_adjustment": float
        }

    Raises:
        requests.exceptions.RequestException, KeyError, ValueError
    """
    try:
        response = requests.get(
            PRICING_FACTOR_API_URL,
            params={
                "methodology": methodology,
                "registry": registry,
                "rating": rating,
                "vintage_year": vintage_year,
                "project_id": project_id
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        return {
            "base_price": float(data["base_price"]),
            "quality_multiplier": float(data["quality_multiplier"]),
            "vintage_adjustment": float(data["vintage_adjustment"]),
            "market_adjustment": float(data["market_adjustment"]),
            "liquidity_adjustment": float(data["liquidity_adjustment"]),
        }
    except (requests.exceptions.RequestException, KeyError, ValueError) as e:
        logger.error(f"get_pricing_factors failed for project_id={project_id}: {e}")
        raise


# ===================================================================
# STEP 6: 1 Carbon Credit ki Fair Value (Price) Calculate karna
# ===================================================================
def calculate_credit_value(pricing_factors: dict) -> float:
    """
    Pricing factors se 1 Carbon Credit ki fair value (price) nikalta hai.

    Formula:
        fair_value = base_price
                     * quality_multiplier
                     * vintage_adjustment
                     * market_adjustment
                     * liquidity_adjustment

    Parameters:
        pricing_factors (dict): get_pricing_factors() se aaya hua dict

    Returns:
        float: 1 credit ki fair value (currency unit, e.g. USD)
    """
    fair_value = (
        pricing_factors["base_price"]
        * pricing_factors["quality_multiplier"]
        * pricing_factors["vintage_adjustment"]
        * pricing_factors["market_adjustment"]
        * pricing_factors["liquidity_adjustment"]
    )
    return round(fair_value, 4)


# ===================================================================
# STEP 7: ORCHESTRATOR - Backend endpoint ke liye main function
# ===================================================================
def calculate_full_valuation(
    region: str,
    year: int,
    source_type: str,
    activity_data_kwh: float,
    project_energy_used_kwh: float,
    leakage_activity: float,
    leakage_source_type: str,
    methodology: str,
    registry: str,
    rating: str,
    vintage_year: int,
    project_id: str,
    gas_type: str = None,
    gas_quantity_kg: float = None,
) -> dict:
    """
    End-to-end function: frontend se aaya activity data leke
    credits + price_per_credit + total_value return karta hai.
    Isko seedha Flask/FastAPI route me call kar sakte ho.

    Returns:
        dict: {
            "credits": float,
            "price_per_credit": float,
            "total_value": float
        }
    """
    # Agar gas-based input diya gaya hai (methane/CO2 etc), CO2e me convert karo
    if gas_type and gas_quantity_kg is not None:
        activity_data_kwh = convert_to_co2e(gas_type, gas_quantity_kg)

    # Emission factors API se lao
    baseline_ef = get_emission_factor(region, source_type, year)
    project_ef = get_emission_factor(region, source_type, year)
    leakage_ef = get_emission_factor(region, leakage_source_type, year)

    # Baseline / Project / Leakage calculate karo
    baseline_emission = calculate_baseline_emission(activity_data_kwh, baseline_ef)
    project_emission = calculate_project_emission(project_energy_used_kwh, project_ef)
    leakage = calculate_leakage(leakage_activity, leakage_ef)

    # Credits nikalo
    credits = calculate_credits(baseline_emission, project_emission, leakage)

    # Pricing factors API se lao, fir 1 credit ki value nikalo
    pricing_factors = get_pricing_factors(methodology, registry, rating, vintage_year, project_id)
    price_per_credit = calculate_credit_value(pricing_factors)

    # Total valuation
    total_value = round(credits * price_per_credit, 4)

    return {
        "credits": credits,
        "price_per_credit": price_per_credit,
        "total_value": total_value
    }