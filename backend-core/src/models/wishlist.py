from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.sql import func
from src.db.session import Base

class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    
    # 누가 찜했는지 (유저가 삭제되면 찜 목록도 삭제됨: CASCADE)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # 무엇을 찜했는지 (상품이 삭제되면 찜 목록도 삭제됨: CASCADE)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    
    # 언제 찜했는지
    created_at = Column(DateTime(timezone=True), server_default=func.now())