from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from src.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, index=True)
    
    # 계정 상태
    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False)
    
    # ✅ [NEW] 프로필 및 추가 정보 컬럼 (Alembic 자동화용)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    birthdate = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_marketing_agreed = Column(Boolean(), default=False)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())