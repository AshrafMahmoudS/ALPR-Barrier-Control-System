"""
User database model for system authentication and authorization.
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid

from database.session import Base


class UserRole(str, Enum):
    """User role enumeration for access control."""
    ADMIN = "admin"          # Full system access
    OPERATOR = "operator"    # Can manage vehicles and view reports
    VIEWER = "viewer"        # Read-only access


class User(Base):
    """
    User model for system authentication and authorization.
    """
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    username = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
        comment="Unique username for login"
    )
    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="User email address"
    )
    hashed_password = Column(
        String(255),
        nullable=False,
        comment="Bcrypt hashed password"
    )
    full_name = Column(
        String(255),
        nullable=True,
        comment="User's full name"
    )
    role = Column(
        SQLEnum(UserRole),
        nullable=False,
        default=UserRole.VIEWER,
        index=True,
        comment="User role for authorization"
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        comment="Whether user account is active"
    )
    last_login = Column(
        DateTime,
        nullable=True,
        comment="Last successful login timestamp"
    )
    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="Account creation timestamp"
    )
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="Account last update timestamp"
    )

    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"

    def has_permission(self, required_role: UserRole) -> bool:
        """
        Check if user has required permission level.
        Admin > Operator > Viewer
        """
        role_hierarchy = {
            UserRole.VIEWER: 1,
            UserRole.OPERATOR: 2,
            UserRole.ADMIN: 3
        }
        return role_hierarchy[self.role] >= role_hierarchy[required_role]

    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert model to dictionary."""
        data = {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role.value if self.role else None,
            "is_active": self.is_active,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_sensitive:
            data["hashed_password"] = self.hashed_password

        return data
