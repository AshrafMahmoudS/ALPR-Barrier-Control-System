"""
Application configuration management using Pydantic Settings.
"""
import json
from typing import List, Optional, Union
from pydantic import Field, PostgresDsn, RedisDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_prefix="",
        validate_default=True
    )

    # API Configuration
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: int = Field(default=8000, description="API port")
    API_PREFIX: str = Field(default="/api/v1", description="API prefix")
    API_WORKERS: int = Field(default=4, description="Number of workers")

    # Database Configuration
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_DB: str = Field(default="alpr_system")
    POSTGRES_USER: str = Field(default="alpr_admin")
    POSTGRES_PASSWORD: str = Field(default="changeme")

    DATABASE_URL: Optional[str] = None

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
        """Construct database URL from components if not provided."""
        if isinstance(v, str):
            return v
        values = info.data
        return f"postgresql+asyncpg://{values.get('POSTGRES_USER')}:{values.get('POSTGRES_PASSWORD')}@{values.get('POSTGRES_HOST')}:{values.get('POSTGRES_PORT')}/{values.get('POSTGRES_DB')}"

    # Redis Configuration
    REDIS_HOST: str = Field(default="localhost")
    REDIS_PORT: int = Field(default=6379)
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = Field(default=0)

    REDIS_URL: Optional[str] = None

    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def assemble_redis_connection(cls, v: Optional[str], info) -> str:
        """Construct Redis URL from components if not provided."""
        if isinstance(v, str):
            return v
        values = info.data
        password = f":{values.get('REDIS_PASSWORD')}@" if values.get('REDIS_PASSWORD') else ""
        return f"redis://{password}{values.get('REDIS_HOST')}:{values.get('REDIS_PORT')}/{values.get('REDIS_DB')}"

    # Security Configuration
    SECRET_KEY: str = Field(default="change-this-secret-key-in-production")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)

    # CORS Configuration
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173")
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True)

    @property
    def cors_origins_list(self) -> List[str]:
        """Get CORS origins as a list."""
        if isinstance(self.CORS_ORIGINS, str):
            # Try to parse as JSON first
            try:
                parsed = json.loads(self.CORS_ORIGINS)
                if isinstance(parsed, list):
                    return parsed
            except (json.JSONDecodeError, ValueError):
                pass
            # Fall back to comma-separated
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        return self.CORS_ORIGINS

    # ALPR Configuration
    ALPR_COUNTRY: str = Field(default="us", description="ALPR country code")
    ALPR_REGION: str = Field(default="", description="ALPR region")
    ALPR_CONFIDENCE_THRESHOLD: float = Field(default=80.0)
    ALPR_TOP_N: int = Field(default=10)
    ALPR_PROCESS_INTERVAL: float = Field(default=0.5)

    # Camera Configuration
    ENTRY_CAMERA_ID: int = Field(default=0)
    ENTRY_CAMERA_NAME: str = Field(default="Entry Camera")
    ENTRY_CAMERA_RESOLUTION_WIDTH: int = Field(default=1920)
    ENTRY_CAMERA_RESOLUTION_HEIGHT: int = Field(default=1080)
    ENTRY_CAMERA_FPS: int = Field(default=30)

    EXIT_CAMERA_ID: int = Field(default=1)
    EXIT_CAMERA_NAME: str = Field(default="Exit Camera")
    EXIT_CAMERA_RESOLUTION_WIDTH: int = Field(default=1920)
    EXIT_CAMERA_RESOLUTION_HEIGHT: int = Field(default=1080)
    EXIT_CAMERA_FPS: int = Field(default=30)

    # GPIO Configuration
    BARRIER_ENTRY_PIN: int = Field(default=17)
    BARRIER_EXIT_PIN: int = Field(default=27)
    SENSOR_ENTRY_PIN: int = Field(default=22)
    SENSOR_EXIT_PIN: int = Field(default=23)
    GPIO_MODE: str = Field(default="BCM")

    # Barrier Control
    BARRIER_OPEN_DURATION: int = Field(default=5, description="Seconds")
    BARRIER_TIMEOUT: int = Field(default=10, description="Seconds")
    BARRIER_SAFETY_CHECK: bool = Field(default=True)

    # Parking Configuration
    TOTAL_PARKING_CAPACITY: int = Field(default=100)
    ENABLE_VISITOR_PARKING: bool = Field(default=False)
    MAX_PARKING_DURATION_HOURS: int = Field(default=24)

    # Logging Configuration
    LOG_LEVEL: str = Field(default="INFO")
    LOG_FORMAT: str = Field(default="json")
    LOG_FILE_PATH: str = Field(default="/var/log/alpr-system/app.log")
    LOG_MAX_SIZE_MB: int = Field(default=100)
    LOG_BACKUP_COUNT: int = Field(default=5)

    # Image Storage Configuration
    ENABLE_IMAGE_CAPTURE: bool = Field(default=True)
    IMAGE_STORAGE_PATH: str = Field(default="/var/alpr-system/images")
    IMAGE_RETENTION_DAYS: int = Field(default=30)
    IMAGE_FORMAT: str = Field(default="jpg")
    IMAGE_QUALITY: int = Field(default=85)

    # System Configuration
    ENVIRONMENT: str = Field(default="development")
    DEBUG: bool = Field(default=False)
    TIMEZONE: str = Field(default="UTC")

    # Project Information
    PROJECT_NAME: str = "ALPR Barrier Control System"
    PROJECT_VERSION: str = "1.0.0"
    PROJECT_DESCRIPTION: str = "Automated License Plate Recognition for Parking Barrier Control"


# Global settings instance
settings = Settings()
