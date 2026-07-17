import os
from pydantic import BaseModel

class Settings(BaseModel):
    """
    Application Settings configuration class utilizing standard environment variables.
    Provides easy configurations for the database (Supabase), authentication (JWT),
    and email verification services (SMTP).
    """
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://mock-supabase-url.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "mock-supabase-key-12345")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "your-jwt-secret-key-for-development-purposes-only")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_DAYS: int = 7
    
    # SMTP Configuration for OTP email logins
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "smtp@carbonos.in")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "smtp-password")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "no-reply@carbonos.in")

settings = Settings()
