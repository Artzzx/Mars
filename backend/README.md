# Last Epoch Loot Filter Backend

Python FastAPI backend service for generating Last Epoch loot filters by analyzing patterns and applying user-specified criteria.

## Features

- **Filter Generation**: Generate valid Last Epoch XML filters (v5 format) from user criteria
- **Build Analysis**: Analyze build profiles to recommend optimal affixes
- **Strictness Levels**: Support for multiple strictness levels (Regular, Strict, Very Strict, etc.)
- **Database Integration**: SQLite for development, PostgreSQL for production
- **REST API**: Full REST API with OpenAPI documentation

## Project Structure

```
backend/
├── app.py          # FastAPI application and endpoints
├── models.py       # Pydantic data models
├── analyzer.py     # Database filter analysis
├── generator.py    # Filter generation engine
├── templates.py    # Rule templates and configurations
├── db.py           # Database connection and operations
├── schema.sql      # Database schema
└── requirements.txt
```

## Installation

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

## Running the Server

```bash
# Development mode with auto-reload
uvicorn app:app --reload --port 8000

# Production mode
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Filter Generation

#### POST /api/generate-filter
Generate a complete loot filter and download as XML.

```json
{
    "character_class": "Sentinel",
    "level": 75,
    "strictness": "strict",
    "damage_types": ["void", "physical"],
    "priority_stats": {
        "offensive": ["melee_void_damage", "attack_speed"],
        "defensive": ["health", "armor"]
    },
    "weapon_types": ["TWO_HANDED_SWORD"],
    "hide_normal": true,
    "hide_magic": true,
    "min_legendary_potential": 1
}
```

#### POST /api/preview-filter
Preview filter generation without creating full XML.

### Analysis

#### POST /api/analyze-build
Analyze a build and return recommended affixes.

```json
{
    "character_class": "Mage",
    "damage_types": ["cold"],
    "build_id": "frostbite-sorcerer"
}
```

#### GET /api/recommended-affixes
Get recommended affixes for a class and damage types.

### Configuration

- `GET /api/strictness-levels` - Get all strictness configurations
- `GET /api/classes` - Get all character classes
- `GET /api/damage-types` - Get all damage types
- `GET /api/builds` - Get all build profiles

## Environment Variables

```bash
# Database (PostgreSQL)
USE_POSTGRES=true
DB_HOST=localhost
DB_PORT=5432
DB_NAME=filters_db
DB_USER=user
DB_PASSWORD=password

# SQLite fallback (default)
SQLITE_PATH=./filters.db
```

## Database Setup

### SQLite (Development)
The SQLite database is created automatically on first run.

### PostgreSQL (Production)
```bash
# Create database
createdb filters_db

# Run schema
psql -d filters_db -f schema.sql
```

## Example Usage

### Python Client

```python
import requests

# Generate a filter
response = requests.post(
    "http://localhost:8000/api/generate-filter",
    json={
        "character_class": "Sentinel",
        "level": 75,
        "strictness": "strict",
        "damage_types": ["void", "physical"],
        "weapon_types": ["TWO_HANDED_SWORD"],
        "hide_normal": True,
        "hide_magic": True,
    }
)

# Save the XML filter
with open("my_filter.xml", "wb") as f:
    f.write(response.content)
```

### cURL

```bash
# Generate filter
curl -X POST "http://localhost:8000/api/generate-filter" \
    -H "Content-Type: application/json" \
    -d '{"character_class":"Sentinel","level":75,"strictness":"strict"}' \
    -o filter.xml

# Analyze build
curl -X POST "http://localhost:8000/api/analyze-build" \
    -H "Content-Type: application/json" \
    -d '{"character_class":"Mage","damage_types":["cold"]}'
```

## Strictness Levels

| Level | Description |
|-------|-------------|
| Regular | Recommended for leveling. Shows most items. |
| Strict | Recommended for Empowered Monolith. Hides low LP uniques. |
| Very Strict | Focus on T7 items. High LP uniques only. |
| Uber Strict | Endgame. Very high LP requirements. |
| GIGA Strict | Maximum efficiency. Only the best items shown. |

## License

MIT
