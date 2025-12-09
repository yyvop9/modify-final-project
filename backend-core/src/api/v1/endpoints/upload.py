from typing import Any
from fastapi import APIRouter, UploadFile, File
import shutil
import os
from uuid import uuid4

router = APIRouter()

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...)) -> Any:
    # 1. [FIX] 절대 경로 하드코딩 (Docker 내부 경로)
    # 헷갈리지 않게 무조건 여기로 저장합니다.
    UPLOAD_DIR = "/app/src/static/images"
    
    # 폴더가 없으면 생성
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 2. 파일 저장
    file_extension = file.filename.split(".")[-1]
    new_filename = f"{uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, new_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    print(f"✅ [Upload] Saved to: {file_path}")

    # 3. URL 반환 (/static/... 경로는 main.py에서 연결)
    return {"url": f"/static/images/{new_filename}"}