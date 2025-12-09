import logging
import os  # [필수]
from contextlib import asynccontextmanager
import redis.asyncio as redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi.staticfiles import StaticFiles # 정적 파일 서빙용
from src.config.settings import settings
from src.core.security import setup_superuser 
from src.db.session import engine, async_session_maker 
from src.middleware.exception_handler import global_exception_handler
from src.api.v1 import api_router 

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------
# 1. Lifespan 이벤트 핸들러 (Startup/Shutdown 관리)
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 시작 및 종료 시 이벤트를 처리합니다."""
    
    # [Startup] Redis 및 Rate Limiter 초기화
    try:
        redis_connection = redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis_connection)
        logger.info("✅ Rate Limiter System Ready.")
    except Exception as e:
        logger.error(f"⚠️ Redis Connection Failed. Rate Limiter will be inactive: {e}")
    
    # [Startup] 초기 관리자 계정 생성 및 DB 유효성 검사
    async with async_session_maker() as session:
        try:
            await setup_superuser(session)
            logger.info("Default superuser setup checked/completed.")
        except Exception as e:
            logger.error(f"Failed to set up superuser (DB Error likely): {e}")

    yield # 애플리케이션 실행

    # [Shutdown] 리소스 해제
    if 'redis_connection' in locals():
        await redis_connection.close()
    await engine.dispose() 
    logger.info("Application shutdown complete.")

# --------------------------------------------------------------------------
# 2. FastAPI 애플리케이션 인스턴스 생성
# --------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan, 
    docs_url="/docs" if settings.ENVIRONMENT == "dev" else None,
    openapi_url="/openapi.json"
)

# --------------------------------------------------------------------------
# 3. CORS 미들웨어 설정
# --------------------------------------------------------------------------
origins = [
    "http://localhost",
    "http://localhost:80",
    "http://localhost:5173", 
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    "http://localhost:3000", 
    "http://127.0.0.1:3000",
    settings.FRONTEND_URL, 
    "http://0.0.0.0:5173" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# 4. 예외 핸들러 및 라우터 포함
# --------------------------------------------------------------------------
app.add_exception_handler(Exception, global_exception_handler)
app.include_router(api_router, prefix=settings.API_V1_STR)

# --------------------------------------------------------------------------
# 5. [업그레이드됨] 정적 파일 설정 (절대 경로 사용) 🚨 핵심!
# --------------------------------------------------------------------------
try:
    # 현재 파일(main.py)이 있는 위치: /app/src
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    
    # 정적 파일 경로: /app/src/static
    static_dir = os.path.join(BASE_DIR, "static")
    image_dir = os.path.join(static_dir, "images")
    
    # 폴더가 없으면 생성
    os.makedirs(image_dir, exist_ok=True)
    
    # 마운트 (이 경로가 틀리면 이미지가 안 나옵니다)
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    
    logger.info(f"✅ Static file serving enabled: /static -> {static_dir}")
except Exception as e:
    logger.error(f"⚠️ Failed to setup static file serving: {e}")

# --------------------------------------------------------------------------
# 6. 루트 엔드포인트
# --------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    return {"status": "ok", "env": settings.ENVIRONMENT}

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API Service"}

@app.get("/debug/images")
def debug_images():
    import os
    # 우리가 설정한 절대 경로
    check_path = "/app/src/static/images"
    
    if not os.path.exists(check_path):
        return {"status": "error", "message": f"폴더가 없습니다: {check_path}"}
        
    files = os.listdir(check_path)
    return {
        "status": "ok",
        "path": check_path,
        "file_count": len(files),
        "files": files  # 파일 목록 전체 출력
    }