"""
Settings endpoints for application configuration.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.session import get_db
from models.settings import Settings
from schemas.settings import (
    SettingsResponse,
    SettingsUpdate,
    SystemSettings,
    CameraSettings,
    ALPRSettings,
    NotificationSettings
)
from core.dependencies import get_current_user_id


router = APIRouter()


async def get_or_create_settings(db: AsyncSession) -> Settings:
    """Get existing settings or create default settings."""
    query = select(Settings).where(Settings.id == "default")
    result = await db.execute(query)
    settings = result.scalar_one_or_none()

    if not settings:
        # Create default settings
        settings = Settings(id="default")
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get current application settings.
    """
    settings = await get_or_create_settings(db)

    return SettingsResponse(
        system=SystemSettings(
            site_name=settings.site_name,
            timezone=settings.timezone,
            language=settings.language,
            date_format=settings.date_format,
            time_format=settings.time_format
        ),
        camera=CameraSettings(
            resolution=settings.resolution,
            fps=settings.fps,
            exposure=settings.exposure,
            contrast=settings.contrast,
            brightness=settings.brightness,
            entry_camera_ip=settings.entry_camera_ip,
            exit_camera_ip=settings.exit_camera_ip
        ),
        alpr=ALPRSettings(
            confidence_threshold=settings.confidence_threshold,
            min_plate_size=settings.min_plate_size,
            max_plate_size=settings.max_plate_size,
            processing_timeout=settings.processing_timeout,
            enable_ocr=settings.enable_ocr,
            plate_format=settings.plate_format
        ),
        notifications=NotificationSettings(
            email_enabled=settings.email_enabled,
            email_address=settings.email_address or "",
            sms_enabled=settings.sms_enabled,
            sms_number=settings.sms_number or "",
            webhook_enabled=settings.webhook_enabled,
            webhook_url=settings.webhook_url or "",
            notify_on_entry=settings.notify_on_entry,
            notify_on_exit=settings.notify_on_exit,
            notify_on_denied=settings.notify_on_denied
        )
    )


@router.put("/settings", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Update application settings.

    Only the provided fields will be updated. Fields not included in the request
    will remain unchanged.
    """
    settings = await get_or_create_settings(db)

    # Update system settings
    if settings_update.system:
        settings.site_name = settings_update.system.site_name
        settings.timezone = settings_update.system.timezone
        settings.language = settings_update.system.language
        settings.date_format = settings_update.system.date_format
        settings.time_format = settings_update.system.time_format

    # Update camera settings
    if settings_update.camera:
        settings.resolution = settings_update.camera.resolution
        settings.fps = settings_update.camera.fps
        settings.exposure = settings_update.camera.exposure
        settings.contrast = settings_update.camera.contrast
        settings.brightness = settings_update.camera.brightness
        settings.entry_camera_ip = settings_update.camera.entry_camera_ip
        settings.exit_camera_ip = settings_update.camera.exit_camera_ip

    # Update ALPR settings
    if settings_update.alpr:
        settings.confidence_threshold = settings_update.alpr.confidence_threshold
        settings.min_plate_size = settings_update.alpr.min_plate_size
        settings.max_plate_size = settings_update.alpr.max_plate_size
        settings.processing_timeout = settings_update.alpr.processing_timeout
        settings.enable_ocr = settings_update.alpr.enable_ocr
        settings.plate_format = settings_update.alpr.plate_format

    # Update notification settings
    if settings_update.notifications:
        settings.email_enabled = settings_update.notifications.email_enabled
        settings.email_address = settings_update.notifications.email_address
        settings.sms_enabled = settings_update.notifications.sms_enabled
        settings.sms_number = settings_update.notifications.sms_number
        settings.webhook_enabled = settings_update.notifications.webhook_enabled
        settings.webhook_url = settings_update.notifications.webhook_url
        settings.notify_on_entry = settings_update.notifications.notify_on_entry
        settings.notify_on_exit = settings_update.notifications.notify_on_exit
        settings.notify_on_denied = settings_update.notifications.notify_on_denied

    await db.commit()
    await db.refresh(settings)

    # Return updated settings
    return SettingsResponse(
        system=SystemSettings(
            site_name=settings.site_name,
            timezone=settings.timezone,
            language=settings.language,
            date_format=settings.date_format,
            time_format=settings.time_format
        ),
        camera=CameraSettings(
            resolution=settings.resolution,
            fps=settings.fps,
            exposure=settings.exposure,
            contrast=settings.contrast,
            brightness=settings.brightness,
            entry_camera_ip=settings.entry_camera_ip,
            exit_camera_ip=settings.exit_camera_ip
        ),
        alpr=ALPRSettings(
            confidence_threshold=settings.confidence_threshold,
            min_plate_size=settings.min_plate_size,
            max_plate_size=settings.max_plate_size,
            processing_timeout=settings.processing_timeout,
            enable_ocr=settings.enable_ocr,
            plate_format=settings.plate_format
        ),
        notifications=NotificationSettings(
            email_enabled=settings.email_enabled,
            email_address=settings.email_address or "",
            sms_enabled=settings.sms_enabled,
            sms_number=settings.sms_number or "",
            webhook_enabled=settings.webhook_enabled,
            webhook_url=settings.webhook_url or "",
            notify_on_entry=settings.notify_on_entry,
            notify_on_exit=settings.notify_on_exit,
            notify_on_denied=settings.notify_on_denied
        )
    )
