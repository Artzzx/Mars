"""
FastAPI Application for Last Epoch Loot Filter Backend

REST API endpoints for filter generation and analysis.
"""

import logging
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse

from models import (
    FilterRequest, BuildAnalysisRequest, AnalysisResponse,
    FilterResponse, HealthResponse, CharacterClass, DamageType,
    StrictnessLevel
)
from db import init_database, close_database, get_database
from analyzer import FilterAnalyzer
from generator import FilterGenerator
from templates import STRICTNESS_CONFIGS, get_strictness_config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Application version
VERSION = "1.0.0"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Last Epoch Filter Backend...")
    init_database()
    logger.info("Database initialized")
    yield
    # Shutdown
    logger.info("Shutting down...")
    close_database()
    logger.info("Database connection closed")


# Create FastAPI application
app = FastAPI(
    title="Last Epoch Loot Filter API",
    description="Backend service for generating Last Epoch loot filters",
    version=VERSION,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Initialize services (lazy loading)
_analyzer: Optional[FilterAnalyzer] = None
_generator: Optional[FilterGenerator] = None


def get_analyzer() -> FilterAnalyzer:
    """Get or create the filter analyzer instance"""
    global _analyzer
    if _analyzer is None:
        _analyzer = FilterAnalyzer(get_database())
    return _analyzer


def get_generator() -> FilterGenerator:
    """Get or create the filter generator instance"""
    global _generator
    if _generator is None:
        _generator = FilterGenerator(get_analyzer())
    return _generator


# ============================================================================
# Health Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """Check API health status"""
    db = get_database()
    return HealthResponse(
        status="healthy",
        version=VERSION,
        database_connected=db.is_connected()
    )


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint"""
    return {
        "name": "Last Epoch Loot Filter API",
        "version": VERSION,
        "docs": "/docs",
    }


# ============================================================================
# Filter Generation Endpoints
# ============================================================================

@app.post("/api/generate-filter", tags=["Filter Generation"])
async def generate_filter(request: FilterRequest):
    """
    Generate a complete loot filter based on user criteria.

    Returns an XML file that can be imported directly into Last Epoch.
    """
    try:
        generator = get_generator()
        xml_content = generator.generate(request)

        # Generate filename
        build_name = request.build_id or request.character_class
        filename = f"{build_name}_{request.strictness}_filter.xml"

        return Response(
            content=xml_content,
            media_type="application/xml",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        logger.error(f"Error generating filter: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-filter/json", response_model=FilterResponse, tags=["Filter Generation"])
async def generate_filter_json(request: FilterRequest):
    """
    Generate a loot filter and return as JSON with metadata.

    Useful for previewing the filter before downloading.
    """
    try:
        generator = get_generator()
        xml_content = generator.generate(request)

        # Get preview info
        preview = generator.generate_preview(request)

        return FilterResponse(
            xml=xml_content,
            metadata={
                "name": f"{request.build_id or request.character_class} Filter",
                "filterIcon": 1,
                "filterIconColor": 11,
                "description": f"Generated for {request.character_class} at level {request.level}",
                "lastModifiedInVersion": "1.3.0",
                "lootFilterVersion": 5,
            },
            rule_count=preview["total_rules"],
            warnings=[]
        )
    except Exception as e:
        logger.error(f"Error generating filter: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/preview-filter", tags=["Filter Generation"])
async def preview_filter(request: FilterRequest):
    """
    Preview filter generation without creating full XML.

    Returns a summary of what rules would be generated.
    """
    try:
        generator = get_generator()
        preview = generator.generate_preview(request)
        return preview
    except Exception as e:
        logger.error(f"Error previewing filter: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Analysis Endpoints
# ============================================================================

@app.post("/api/analyze-build", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_build(request: BuildAnalysisRequest):
    """
    Analyze a build and return recommended affixes and rule patterns.

    This endpoint helps users understand what affixes are valuable
    for their build before generating a filter.
    """
    try:
        analyzer = get_analyzer()

        # Create a filter request for analysis
        filter_request = FilterRequest(
            character_class=request.character_class,
            level=75,
            strictness=StrictnessLevel.STRICT,
            damage_types=request.damage_types,
            build_id=request.build_id,
        )

        patterns = analyzer.analyze_patterns(filter_request)

        # Format affix recommendations
        affix_recommendations = []
        for affix in patterns.get("affix_priorities", [])[:20]:
            affix_recommendations.append({
                "id": affix["id"],
                "name": affix.get("name", f"Affix {affix['id']}"),
                "score": affix["score"],
                "category": affix.get("category", "unknown"),
                "sources": affix.get("sources", []),
            })

        # Format rule preview
        rule_preview = []
        for rule in patterns.get("common_rules", [])[:10]:
            rule_preview.append({
                "pattern": rule["pattern"],
                "type": rule["rule_type"],
                "usage": str(rule["total_usage"]),
            })

        return AnalysisResponse(
            recommended_affixes=affix_recommendations,
            build_profile=patterns.get("build_profile"),
            strictness_config=patterns.get("strictness_config", {}),
            rule_preview=rule_preview,
        )
    except Exception as e:
        logger.error(f"Error analyzing build: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recommended-affixes", tags=["Analysis"])
async def get_recommended_affixes(
    character_class: CharacterClass,
    damage_types: List[DamageType] = Query(default=[]),
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    Get recommended affixes for a character class and damage types.
    """
    try:
        analyzer = get_analyzer()
        affixes = analyzer.get_recommended_affixes(
            character_class=character_class.value,
            damage_types=[dt.value for dt in damage_types],
            limit=limit
        )
        return {"affixes": affixes}
    except Exception as e:
        logger.error(f"Error getting recommended affixes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Configuration Endpoints
# ============================================================================

@app.get("/api/strictness-levels", tags=["Configuration"])
async def get_strictness_levels():
    """Get all available strictness levels and their configurations"""
    return {
        "levels": [
            {
                "id": config.id,
                "name": config.name,
                "description": config.description,
                "order": config.order,
                "minLegendaryPotential": config.minLegendaryPotential,
                "minWeaversWill": config.minWeaversWill,
                "showRarities": [r.value for r in config.showRarities],
                "hideRarities": [r.value for r in config.hideRarities],
            }
            for config in STRICTNESS_CONFIGS.values()
        ]
    }


@app.get("/api/strictness/{strictness_id}", tags=["Configuration"])
async def get_strictness_level(strictness_id: str):
    """Get a specific strictness level configuration"""
    config = get_strictness_config(strictness_id)
    if not config:
        raise HTTPException(status_code=404, detail="Strictness level not found")

    return config.model_dump()


@app.get("/api/classes", tags=["Configuration"])
async def get_character_classes():
    """Get all available character classes"""
    return {
        "classes": [
            {"id": c.value, "name": c.value}
            for c in CharacterClass
        ]
    }


@app.get("/api/damage-types", tags=["Configuration"])
async def get_damage_types():
    """Get all available damage types"""
    return {
        "damage_types": [
            {"id": dt.value, "name": dt.value.capitalize()}
            for dt in DamageType
        ]
    }


# ============================================================================
# Build Profile Endpoints
# ============================================================================

@app.get("/api/builds", tags=["Build Profiles"])
async def get_build_profiles():
    """Get all available build profiles"""
    try:
        db = get_database()
        profiles = db.get_all_build_profiles()
        return {"builds": profiles}
    except Exception as e:
        logger.error(f"Error getting build profiles: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/builds/{build_id}", tags=["Build Profiles"])
async def get_build_profile(build_id: str):
    """Get a specific build profile"""
    try:
        db = get_database()
        profile = db.get_build_profile(build_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Build profile not found")
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting build profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
