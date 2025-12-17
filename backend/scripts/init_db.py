"""
Database initialization script.
Creates tables and initial admin user.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from core.config import settings
from database.session import Base
from models.user import User, UserRole
from models.settings import Settings  # Import to ensure table creation
from core.security import get_password_hash


async def init_database():
    """Initialize database with tables and default data."""
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Database tables created successfully")
    
    # Create async session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    # Create default admin user
    async with async_session() as session:
        # Check if admin exists
        result = await session.execute(
            select(User).where(User.username == "admin")
        )
        existing_admin = result.scalar_one_or_none()
        
        if not existing_admin:
            admin_user = User(
                username="admin",
                email="admin@alpr-system.local",
                hashed_password=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            print("✅ Default admin user created")
            print("   Username: admin")
            print("   Password: admin123")
            print("   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!")
        else:
            print("ℹ️  Admin user already exists")
    
    await engine.dispose()
    print("✅ Database initialization complete")


if __name__ == "__main__":
    asyncio.run(init_database())
