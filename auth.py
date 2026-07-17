import random
import logging
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
import bcrypt

from config import settings
from schemas import OTPRequest, OTPVerify, RegisterRequest, LoginRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()
logger = logging.getLogger("carbon_auth")

# Global variables for mock databases (pre-populated on startup)
otp_db: Dict[str, Dict[str, Any]] = {}  # email -> {code: str, expires_at: datetime}
users_db: Dict[str, Dict[str, Any]] = {}  # email.lower() -> user dict

# ---------------------------------------------------------------------------
# Password hashing & JWT helpers
# ---------------------------------------------------------------------------

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify password using bcrypt."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    """Create JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS)
    payload = {
        "id": user_id,
        "email": email,
        "role": role,
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI Dependency to retrieve and validate the authenticated user from JWT."""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
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


# ---------------------------------------------------------------------------
# SMTP & Emailing logic
# ---------------------------------------------------------------------------

def send_otp_email(email: str, otp_code: str) -> None:
    """
    Attempts to send a 6-digit OTP code to the user's email address via SMTP.
    If the SMTP credentials are not configured or connection fails, it falls back
    to logging the email contents beautifully to the terminal logs for development.
    """
    subject = f"CarbonOS Authentication OTP: {otp_code}"
    body = f"""Hello,

You have requested a secure verification code to login or register on CarbonOS Carbon-Credit Marketplace.

Your verification One-Time Password (OTP) is:

👉 {otp_code} 👈

This code is valid for 5 minutes. If you did not request this code, please ignore this email.

Best regards,
CarbonOS Solutions Team
"""

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = settings.SMTP_FROM_EMAIL
    msg["To"] = email

    try:
        # Standard TLS SMTP sending routine
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=5) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [email], msg.as_string())
        logger.info(f"Successfully sent OTP email to {email}")
        print(f"\n[SMTP SUCCESS] Sent OTP to {email}: {otp_code}\n")
    except Exception as e:
        # Fallback print for development mode
        logger.warning(f"SMTP sending failed, falling back to logger. Details: {e}")
        print(f"\n==================================================")
        print(f"  [MOCK SMTP OUTBOX] - DEVELOPER VIEW")
        print(f"  TO: {email}")
        print(f"  FROM: {settings.SMTP_FROM_EMAIL}")
        print(f"  SUBJECT: {subject}")
        print(f"  ----------------------------------------------")
        print(f"  OTP CODE: {otp_code} (Expires in 5 minutes)")
        print(f"==================================================\n")


# ---------------------------------------------------------------------------
# Routing endpoints
# ---------------------------------------------------------------------------

@router.post("/otp/request")
def request_otp(body: OTPRequest) -> dict:
    """Generate and send a 6-digit OTP to the requested email address."""
    email = body.email.lower()
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    # Store OTP details in memory
    otp_db[email] = {
        "code": otp_code,
        "expires_at": expires_at,
    }

    # Execute email sender
    send_otp_email(email, otp_code)

    return {"message": "OTP generated and sent.", "email": email}


@router.post("/otp/verify")
def verify_otp(body: OTPVerify) -> dict:
    """Verify code input. If user profile exists, returns session token."""
    email = body.email.lower()
    
    if email not in otp_db:
        raise HTTPException(status_code=400, detail="No OTP code requested for this email.")

    record = otp_db[email]
    
    # Check expiration
    if datetime.now(timezone.utc) > record["expires_at"]:
        del otp_db[email]
        raise HTTPException(status_code=400, detail="OTP code has expired.")

    # Match code
    if record["code"] != body.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")

    # Verification successful - remove code from store
    del otp_db[email]

    user = users_db.get(email)
    if not user:
        return {
            "message": "OTP verified successfully. User profile not found, please register.",
            "email": email,
            "verified": True,
            "registered": False,
        }

    # Generate token
    token = create_access_token(user["id"], user["email"], user["role"])
    return {
        "message": "OTP verified. Login successful.",
        "token": token,
        "verified": True,
        "registered": True,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }


@router.post("/register")
def register(body: RegisterRequest) -> dict:
    """Registers a new user, hashes password, saves to local mock DB, and returns token."""
    email = body.email.lower()
    if email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    import uuid
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": body.name,
        "email": email,
        "password": hash_password(body.password),
        "role": body.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    users_db[email] = user
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


@router.post("/login")
def login(body: LoginRequest) -> dict:
    """Authenticates username/password and issues standard JWT token."""
    email = body.email.lower()
    user = users_db.get(email)
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

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
