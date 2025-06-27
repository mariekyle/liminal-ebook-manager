from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy import text
import logging
from .settings import settings

logger = logging.getLogger(__name__)

# Create database engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_migrations():
    """Applies database schema migrations if needed."""
    logger.info("Applying database schema migrations...")
    try:
        with engine.connect() as connection:
            # Use a single, robust transaction
            with connection.begin() as transaction:
                try:
                    # These columns were widened in a previous migration.
                    # We keep this for new setups.
                    connection.execute(text('ALTER TABLE books ALTER COLUMN isbn TYPE VARCHAR(500)'))
                    connection.execute(text('ALTER TABLE books ALTER COLUMN publisher TYPE VARCHAR(500)'))
                except Exception as e:
                    logger.warning(f"Could not alter isbn/publisher columns (may not exist yet on first run): {e}")

                # Use "IF NOT EXISTS" for idempotent column additions
                connection.execute(text('ALTER TABLE books ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0'))
                logger.info("Ensured 'word_count' column exists.")

                connection.execute(text('ALTER TABLE books ADD COLUMN IF NOT EXISTS tags TEXT'))
                logger.info("Ensured 'tags' column exists.")
                
                transaction.commit()
                logger.info("Schema migrations applied successfully.")
    except Exception as e:
        logger.error(f"Fatal error during database migration: {e}")
        # In case of a failure, we might want to stop the application
        # as it might be in an inconsistent state.
        raise 