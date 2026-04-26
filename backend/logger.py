import sys
from pathlib import Path
from loguru import logger

BASE_DIR = Path(__file__).resolve().parent

LOG_FILE = BASE_DIR / "backend.log"
logger.remove()

logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO",
    colorize=True
)

logger.add(
    str(LOG_FILE),
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="5 MB",
    retention="3 days",
    compression="zip",
    backtrace=True,
    diagnose=True         
)

def get_logger(name: str):
    return logger.bind(name=name)
