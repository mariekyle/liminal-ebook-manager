from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["health"])

@router.get('/')
async def root():
    """Root endpoint"""
    return {
        'message': 'Liminal Ebook Manager API',
        'version': '1.0.0',
        'docs': '/docs'
    }

@router.get('/health')
async def health_check():
    """Health check endpoint"""
    return {'status': 'healthy', 'timestamp': datetime.utcnow()} 