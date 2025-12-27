"""
API Routers package

This module exports all the routers used by the FastAPI application.
"""

from . import titles
from . import sync

# For backward compatibility and cleaner imports
__all__ = ['titles', 'sync']
