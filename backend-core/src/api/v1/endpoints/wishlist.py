from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc

from src.api import deps
from src.models.wishlist import Wishlist
from src.models.product import Product
from src.models.user import User
from src.schemas.product import ProductResponse

router = APIRouter()

# ------------------------------------------------------------------
# 1. 위시리스트 토글 (담기 / 취소)
# ------------------------------------------------------------------
@router.post("/toggle/{product_id}")
async def toggle_wishlist(
    product_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    이미 찜한 상태면 삭제(OFF), 아니면 추가(ON)합니다.
    """
    # 1. 이미 존재하는지 확인
    stmt = select(Wishlist).where(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id
    )
    result = await db.execute(stmt)
    existing_wish = result.scalars().first()

    if existing_wish:
        # 2. 존재하면 삭제 (찜 취소)
        await db.delete(existing_wish)
        await db.commit()
        return {"status": "removed", "is_wished": False}
    else:
        # 3. 없으면 생성 (찜 하기)
        new_wish = Wishlist(user_id=current_user.id, product_id=product_id)
        db.add(new_wish)
        await db.commit()
        return {"status": "added", "is_wished": True}

# ------------------------------------------------------------------
# 2. 단일 상품 찜 여부 확인 (하트 색상 결정용)
# ------------------------------------------------------------------
@router.get("/check/{product_id}")
async def check_wishlist_status(
    product_id: int,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    현재 로그인한 유저가 특정 상품을 찜했는지 확인합니다.
    """
    stmt = select(Wishlist).where(
        Wishlist.user_id == current_user.id,
        Wishlist.product_id == product_id
    )
    result = await db.execute(stmt)
    existing_wish = result.scalars().first()
    
    return {"is_wished": existing_wish is not None}

# ------------------------------------------------------------------
# 3. 내 위시리스트 목록 조회 (모달용)
# ------------------------------------------------------------------
@router.get("/", response_model=List[ProductResponse])
async def read_wishlist(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    내가 찜한 상품들의 상세 정보를 최신순으로 가져옵니다.
    """
    # Wishlist 테이블과 Product 테이블을 JOIN하여 상품 정보를 조회
    stmt = (
        select(Product)
        .join(Wishlist, Wishlist.product_id == Product.id)
        .where(Wishlist.user_id == current_user.id)
        .order_by(desc(Wishlist.created_at)) # 최신순 정렬
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    products = result.scalars().all()
    
    return products