import structlog
import logging
from typing import Any, Dict, Optional
from .config import settings

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Get logger instance
logger = structlog.get_logger()


def get_logger(name: Optional[str] = None) -> structlog.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


def log_request(request_id: str, method: str, path: str, status_code: int, duration: float):
    """Log HTTP request details"""
    logger.info(
        "http_request",
        request_id=request_id,
        method=method,
        path=path,
        status_code=status_code,
        duration=duration
    )


def log_user_action(user_id: str, action: str, details: Optional[Dict[str, Any]] = None):
    """Log user actions for audit purposes"""
    logger.info(
        "user_action",
        user_id=user_id,
        action=action,
        details=details or {}
    )


def log_error(error: Exception, context: Optional[Dict[str, Any]] = None):
    """Log errors with context"""
    logger.error(
        "error_occurred",
        error_type=type(error).__name__,
        error_message=str(error),
        context=context or {}
    ) 