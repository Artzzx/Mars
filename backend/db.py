"""
Database Connection Module for Last Epoch Loot Filter Backend

Provides database connection management and query utilities.
Supports PostgreSQL with fallback to SQLite for development.
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
from pathlib import Path

# Try PostgreSQL first, fall back to SQLite
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

import sqlite3

logger = logging.getLogger(__name__)


class DatabaseConnection:
    """Database connection manager with PostgreSQL/SQLite support"""

    def __init__(
        self,
        host: Optional[str] = None,
        database: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        port: int = 5432,
        sqlite_path: Optional[str] = None,
    ):
        self.host = host or os.getenv("DB_HOST", "localhost")
        self.database = database or os.getenv("DB_NAME", "filters_db")
        self.user = user or os.getenv("DB_USER", "user")
        self.password = password or os.getenv("DB_PASSWORD", "password")
        self.port = port or int(os.getenv("DB_PORT", "5432"))

        # SQLite fallback path
        self.sqlite_path = sqlite_path or os.getenv(
            "SQLITE_PATH",
            str(Path(__file__).parent / "filters.db")
        )

        self.use_postgres = HAS_POSTGRES and os.getenv("USE_POSTGRES", "false").lower() == "true"
        self._connection = None

    def connect(self):
        """Establish database connection"""
        if self.use_postgres:
            try:
                self._connection = psycopg2.connect(
                    host=self.host,
                    database=self.database,
                    user=self.user,
                    password=self.password,
                    port=self.port,
                )
                logger.info("Connected to PostgreSQL database")
            except Exception as e:
                logger.warning(f"PostgreSQL connection failed: {e}, falling back to SQLite")
                self.use_postgres = False
                self._init_sqlite()
        else:
            self._init_sqlite()

    def _init_sqlite(self):
        """Initialize SQLite connection"""
        self._connection = sqlite3.connect(
            self.sqlite_path,
            check_same_thread=False
        )
        self._connection.row_factory = sqlite3.Row
        self._create_tables()
        logger.info(f"Connected to SQLite database: {self.sqlite_path}")

    def _create_tables(self):
        """Create SQLite tables if they don't exist"""
        cursor = self._connection.cursor()

        # Filter rules table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS filter_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_class VARCHAR(50),
                strictness VARCHAR(20),
                level_range_min INTEGER DEFAULT 1,
                level_range_max INTEGER DEFAULT 100,
                rule_type VARCHAR(10),
                conditions TEXT,  -- JSON stored as text
                color INTEGER DEFAULT 0,
                priority INTEGER DEFAULT 50,
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Build profiles table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS build_profiles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                character_class VARCHAR(50),
                ascendancy VARCHAR(50),
                primary_stats TEXT,  -- JSON array
                damage_types TEXT,  -- JSON array
                valued_affixes TEXT,  -- JSON object
                weapons TEXT,  -- JSON array
                offhand TEXT,  -- JSON array
                idol_affixes TEXT,  -- JSON object
                usage_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Affix database table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS affixes (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                short_name TEXT NOT NULL,
                tier VARCHAR(10),
                category VARCHAR(20),
                tags TEXT,  -- JSON array
                classes TEXT,  -- JSON array
                max_tier INTEGER DEFAULT 7
            )
        """)

        # Create indexes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_class_strictness
            ON filter_rules(character_class, strictness)
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_usage
            ON filter_rules(usage_count DESC)
        """)

        self._connection.commit()
        logger.info("Database tables created/verified")

    @contextmanager
    def cursor(self):
        """Get a database cursor with automatic cleanup"""
        if self._connection is None:
            self.connect()

        if self.use_postgres:
            cursor = self._connection.cursor(cursor_factory=RealDictCursor)
        else:
            cursor = self._connection.cursor()

        try:
            yield cursor
            self._connection.commit()
        except Exception as e:
            self._connection.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            cursor.close()

    def execute(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        """Execute a query and return results as list of dicts"""
        with self.cursor() as cursor:
            cursor.execute(query, params)
            if cursor.description:
                columns = [col[0] for col in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
            return []

    def execute_one(self, query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        """Execute a query and return single result"""
        results = self.execute(query, params)
        return results[0] if results else None

    def insert(self, table: str, data: Dict[str, Any]) -> int:
        """Insert a row and return the ID"""
        columns = ", ".join(data.keys())
        placeholders = ", ".join(["?" if not self.use_postgres else "%s"] * len(data))
        query = f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"

        with self.cursor() as cursor:
            cursor.execute(query, tuple(data.values()))
            return cursor.lastrowid

    def close(self):
        """Close database connection"""
        if self._connection:
            self._connection.close()
            self._connection = None
            logger.info("Database connection closed")

    def is_connected(self) -> bool:
        """Check if database is connected"""
        if self._connection is None:
            return False

        try:
            with self.cursor() as cursor:
                cursor.execute("SELECT 1")
            return True
        except Exception:
            return False

    # ========================================================================
    # Filter Rule Operations
    # ========================================================================

    def get_rules_for_criteria(
        self,
        character_class: str,
        strictness: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get filter rules matching criteria"""
        placeholder = "%s" if self.use_postgres else "?"
        query = f"""
            SELECT id, character_class, strictness, rule_type, conditions,
                   color, priority, usage_count, level_range_min, level_range_max
            FROM filter_rules
            WHERE character_class = {placeholder}
            AND strictness = {placeholder}
            ORDER BY usage_count DESC, priority DESC
            LIMIT {placeholder}
        """
        results = self.execute(query, (character_class, strictness, limit))

        # Parse JSON conditions for SQLite
        for row in results:
            if isinstance(row.get("conditions"), str):
                row["conditions"] = json.loads(row["conditions"])

        return results

    def save_rule(self, rule_data: Dict[str, Any]) -> int:
        """Save a filter rule to database"""
        # Serialize conditions to JSON for SQLite
        if "conditions" in rule_data and isinstance(rule_data["conditions"], dict):
            rule_data["conditions"] = json.dumps(rule_data["conditions"])

        return self.insert("filter_rules", rule_data)

    def increment_rule_usage(self, rule_id: int):
        """Increment usage count for a rule"""
        placeholder = "%s" if self.use_postgres else "?"
        query = f"UPDATE filter_rules SET usage_count = usage_count + 1 WHERE id = {placeholder}"
        with self.cursor() as cursor:
            cursor.execute(query, (rule_id,))

    # ========================================================================
    # Build Profile Operations
    # ========================================================================

    def get_build_profile(self, build_id: str) -> Optional[Dict[str, Any]]:
        """Get a build profile by ID"""
        placeholder = "%s" if self.use_postgres else "?"
        query = f"SELECT * FROM build_profiles WHERE id = {placeholder}"
        result = self.execute_one(query, (build_id,))

        if result:
            # Parse JSON fields
            for field in ["primary_stats", "damage_types", "valued_affixes",
                         "weapons", "offhand", "idol_affixes"]:
                if field in result and isinstance(result[field], str):
                    result[field] = json.loads(result[field])

        return result

    def get_all_build_profiles(self) -> List[Dict[str, Any]]:
        """Get all build profiles"""
        results = self.execute("SELECT * FROM build_profiles ORDER BY usage_count DESC")

        for row in results:
            for field in ["primary_stats", "damage_types", "valued_affixes",
                         "weapons", "offhand", "idol_affixes"]:
                if field in row and isinstance(row[field], str):
                    row[field] = json.loads(row[field])

        return results

    def save_build_profile(self, profile: Dict[str, Any]) -> str:
        """Save or update a build profile"""
        # Serialize JSON fields
        for field in ["primary_stats", "damage_types", "valued_affixes",
                     "weapons", "offhand", "idol_affixes"]:
            if field in profile and not isinstance(profile[field], str):
                profile[field] = json.dumps(profile[field])

        # Check if exists
        existing = self.get_build_profile(profile["id"])

        if existing:
            # Update
            placeholder = "%s" if self.use_postgres else "?"
            set_clause = ", ".join([f"{k} = {placeholder}" for k in profile.keys() if k != "id"])
            query = f"UPDATE build_profiles SET {set_clause} WHERE id = {placeholder}"
            values = [v for k, v in profile.items() if k != "id"] + [profile["id"]]
            with self.cursor() as cursor:
                cursor.execute(query, tuple(values))
        else:
            self.insert("build_profiles", profile)

        return profile["id"]

    # ========================================================================
    # Affix Operations
    # ========================================================================

    def get_affix(self, affix_id: int) -> Optional[Dict[str, Any]]:
        """Get an affix by ID"""
        placeholder = "%s" if self.use_postgres else "?"
        query = f"SELECT * FROM affixes WHERE id = {placeholder}"
        result = self.execute_one(query, (affix_id,))

        if result:
            for field in ["tags", "classes"]:
                if field in result and isinstance(result[field], str):
                    result[field] = json.loads(result[field])

        return result

    def get_affixes_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Get affixes by category"""
        placeholder = "%s" if self.use_postgres else "?"
        query = f"SELECT * FROM affixes WHERE category = {placeholder}"
        results = self.execute(query, (category,))

        for row in results:
            for field in ["tags", "classes"]:
                if field in row and isinstance(row[field], str):
                    row[field] = json.loads(row[field])

        return results

    def get_affixes_by_ids(self, affix_ids: List[int]) -> List[Dict[str, Any]]:
        """Get multiple affixes by their IDs"""
        if not affix_ids:
            return []

        placeholders = ", ".join(["%s" if self.use_postgres else "?"] * len(affix_ids))
        query = f"SELECT * FROM affixes WHERE id IN ({placeholders})"
        results = self.execute(query, tuple(affix_ids))

        for row in results:
            for field in ["tags", "classes"]:
                if field in row and isinstance(row[field], str):
                    row[field] = json.loads(row[field])

        return results

    def bulk_insert_affixes(self, affixes: List[Dict[str, Any]]):
        """Bulk insert affixes"""
        for affix in affixes:
            # Serialize JSON fields
            for field in ["tags", "classes"]:
                if field in affix and not isinstance(affix[field], str):
                    affix[field] = json.dumps(affix[field])

            # Use REPLACE to handle duplicates
            columns = ", ".join(affix.keys())
            placeholders = ", ".join(["?" if not self.use_postgres else "%s"] * len(affix))

            if self.use_postgres:
                query = f"""
                    INSERT INTO affixes ({columns}) VALUES ({placeholders})
                    ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    short_name = EXCLUDED.short_name
                """
            else:
                query = f"INSERT OR REPLACE INTO affixes ({columns}) VALUES ({placeholders})"

            with self.cursor() as cursor:
                cursor.execute(query, tuple(affix.values()))


# Global database instance
_db_instance: Optional[DatabaseConnection] = None


def get_database() -> DatabaseConnection:
    """Get the global database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = DatabaseConnection()
        _db_instance.connect()
    return _db_instance


def init_database(
    host: Optional[str] = None,
    database: Optional[str] = None,
    user: Optional[str] = None,
    password: Optional[str] = None,
    sqlite_path: Optional[str] = None,
) -> DatabaseConnection:
    """Initialize the global database instance"""
    global _db_instance
    _db_instance = DatabaseConnection(
        host=host,
        database=database,
        user=user,
        password=password,
        sqlite_path=sqlite_path,
    )
    _db_instance.connect()
    return _db_instance


def close_database():
    """Close the global database instance"""
    global _db_instance
    if _db_instance:
        _db_instance.close()
        _db_instance = None
