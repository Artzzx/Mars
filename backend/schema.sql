-- Last Epoch Loot Filter Database Schema
-- Supports PostgreSQL (production) and SQLite (development)

-- ============================================================================
-- Filter Rules Table
-- Stores analyzed and user-created filter rules
-- ============================================================================

CREATE TABLE IF NOT EXISTS filter_rules (
    id SERIAL PRIMARY KEY,
    character_class VARCHAR(50) NOT NULL,
    strictness VARCHAR(20) NOT NULL,
    level_range_min INTEGER DEFAULT 1,
    level_range_max INTEGER DEFAULT 100,
    rule_type VARCHAR(10) NOT NULL,  -- SHOW, HIDE, HIGHLIGHT
    conditions JSONB NOT NULL,        -- Condition configuration
    color INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 50,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for filter_rules
CREATE INDEX IF NOT EXISTS idx_filter_rules_class_strictness
    ON filter_rules(character_class, strictness);
CREATE INDEX IF NOT EXISTS idx_filter_rules_usage
    ON filter_rules(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_filter_rules_priority
    ON filter_rules(priority DESC);

-- ============================================================================
-- Build Profiles Table
-- Stores build configurations with valued affixes
-- ============================================================================

CREATE TABLE IF NOT EXISTS build_profiles (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    character_class VARCHAR(50) NOT NULL,
    ascendancy VARCHAR(50),
    primary_stats JSONB,              -- Array of stat names
    damage_types JSONB,               -- Array of damage types
    valued_affixes JSONB NOT NULL,    -- {essential: [], high: [], medium: [], low: []}
    weapons JSONB,                    -- Array of weapon types
    offhand JSONB,                    -- Array of offhand types
    idol_affixes JSONB,               -- {small: [], humble: [], stout: [], grand: [], large: []}
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for build_profiles
CREATE INDEX IF NOT EXISTS idx_build_profiles_class
    ON build_profiles(character_class);
CREATE INDEX IF NOT EXISTS idx_build_profiles_usage
    ON build_profiles(usage_count DESC);

-- ============================================================================
-- Affixes Table
-- Complete affix database from game data
-- ============================================================================

CREATE TABLE IF NOT EXISTS affixes (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100) NOT NULL,
    tier VARCHAR(10) NOT NULL,        -- prefix or suffix
    category VARCHAR(30) NOT NULL,    -- offensive, defensive, utility, etc.
    tags JSONB,                       -- Array of tags: melee, spell, fire, etc.
    classes JSONB,                    -- Array of class restrictions (null = all)
    max_tier INTEGER DEFAULT 7,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for affixes
CREATE INDEX IF NOT EXISTS idx_affixes_category
    ON affixes(category);
CREATE INDEX IF NOT EXISTS idx_affixes_tier
    ON affixes(tier);

-- ============================================================================
-- Generated Filters Table
-- Tracks generated filters for analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS generated_filters (
    id SERIAL PRIMARY KEY,
    character_class VARCHAR(50) NOT NULL,
    strictness VARCHAR(20) NOT NULL,
    build_id VARCHAR(100),
    level INTEGER NOT NULL,
    damage_types JSONB,
    rule_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_generated_filters_date
    ON generated_filters(created_at DESC);

-- ============================================================================
-- User Sessions Table (Optional - for future user features)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Sample Data - Common Affixes
-- ============================================================================

-- Insert common offensive affixes
INSERT INTO affixes (id, name, short_name, tier, category, tags, max_tier) VALUES
    (4, 'Increased Spell Damage', 'Spell Dmg', 'prefix', 'offensive', '["spell"]', 7),
    (5, 'Added Spell Damage', 'Add Spell', 'prefix', 'offensive', '["spell"]', 7),
    (6, 'Increased Critical Strike Chance', 'Crit Chance', 'suffix', 'crit', '["attack", "spell"]', 7),
    (7, 'Critical Strike Chance', 'Crit', 'suffix', 'crit', '["attack", "spell"]', 7),
    (8, 'Increased Critical Strike Multiplier', 'Crit Multi', 'suffix', 'crit', '["attack", "spell"]', 7),
    (9, 'Critical Strike Multiplier', 'Crit Mult', 'suffix', 'crit', '["attack", "spell"]', 7),
    (10, 'Increased Fire Damage', 'Fire Dmg', 'prefix', 'elemental', '["fire"]', 7),
    (11, 'Added Fire Damage', 'Add Fire', 'prefix', 'elemental', '["fire"]', 7),
    (14, 'Increased Cold Damage', 'Cold Dmg', 'prefix', 'elemental', '["cold"]', 7),
    (15, 'Added Cold Damage', 'Add Cold', 'prefix', 'elemental', '["cold"]', 7),
    (18, 'Increased Lightning Damage', 'Light Dmg', 'prefix', 'elemental', '["lightning"]', 7),
    (19, 'Added Lightning Damage', 'Add Light', 'prefix', 'elemental', '["lightning"]', 7),
    (22, 'Increased Void Damage', 'Void Dmg', 'prefix', 'elemental', '["void"]', 7),
    (23, 'Added Void Damage', 'Add Void', 'prefix', 'elemental', '["void"]', 7),
    (27, 'Increased Physical Damage', 'Phys Dmg', 'prefix', 'physical', '["melee", "physical"]', 7),
    (28, 'Added Physical Damage', 'Add Phys', 'prefix', 'physical', '["melee", "physical"]', 7),
    (31, 'Increased Health', 'Inc Health', 'prefix', 'health', '["defensive"]', 7),
    (32, 'Added Health', 'Flat Health', 'prefix', 'health', '["defensive"]', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert defensive affixes
INSERT INTO affixes (id, name, short_name, tier, category, tags, max_tier) VALUES
    (41, 'Fire Resistance', 'Fire Res', 'suffix', 'resistance', '["fire", "defensive"]', 7),
    (42, 'Cold Resistance', 'Cold Res', 'suffix', 'resistance', '["cold", "defensive"]', 7),
    (43, 'Lightning Resistance', 'Light Res', 'suffix', 'resistance', '["lightning", "defensive"]', 7),
    (44, 'Void Resistance', 'Void Res', 'suffix', 'resistance', '["void", "defensive"]', 7),
    (45, 'Necrotic Resistance', 'Necro Res', 'suffix', 'resistance', '["necrotic", "defensive"]', 7),
    (50, 'Increased Armor', 'Armor', 'prefix', 'defensive', '["armor", "defensive"]', 7),
    (51, 'Added Armor', 'Flat Armor', 'prefix', 'defensive', '["armor", "defensive"]', 7),
    (52, 'Block Chance', 'Block', 'suffix', 'defensive', '["block", "defensive"]', 7),
    (53, 'Block Effectiveness', 'Block Eff', 'suffix', 'defensive', '["block", "defensive"]', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert attribute affixes
INSERT INTO affixes (id, name, short_name, tier, category, tags, max_tier) VALUES
    (60, 'Strength', 'Str', 'suffix', 'attribute', '["strength"]', 7),
    (61, 'Dexterity', 'Dex', 'suffix', 'attribute', '["dexterity"]', 7),
    (62, 'Intelligence', 'Int', 'suffix', 'attribute', '["intelligence"]', 7),
    (63, 'Vitality', 'Vit', 'suffix', 'attribute', '["vitality"]', 7),
    (64, 'Attunement', 'Att', 'suffix', 'attribute', '["attunement"]', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert attack speed affixes
INSERT INTO affixes (id, name, short_name, tier, category, tags, max_tier) VALUES
    (87, 'Increased Attack Speed', 'Atk Speed', 'suffix', 'offensive', '["melee", "attack"]', 7),
    (88, 'Increased Cast Speed', 'Cast Speed', 'suffix', 'offensive', '["spell"]', 7)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Sample Build Profiles
-- ============================================================================

INSERT INTO build_profiles (id, name, display_name, character_class, ascendancy, primary_stats, damage_types, valued_affixes, weapons, offhand, idol_affixes) VALUES
    (
        'warpath-voidknight',
        'warpath-voidknight',
        'Warpath Void Knight',
        'Sentinel',
        'Void Knight',
        '["strength", "vitality"]',
        '["void", "physical"]',
        '{"essential": [21, 22, 23, 60, 63], "high": [27, 28, 31, 32, 87], "medium": [50, 51, 40, 41, 42], "low": [6, 7, 100]}',
        '["ONE_HANDED_SWORD", "TWO_HANDED_SWORD", "ONE_HANDED_AXE", "TWO_HANDED_AXE"]',
        '["SHIELD"]',
        '{"small": [837, 831], "humble": [872, 862, 867, 869], "stout": [894, 892], "grand": [124, 326, 894, 892], "large": [862, 872]}'
    ),
    (
        'frostbite-sorcerer',
        'frostbite-sorcerer',
        'Frostbite Sorcerer',
        'Mage',
        'Sorcerer',
        '["intelligence", "attunement"]',
        '["cold"]',
        '{"essential": [13, 14, 15, 16, 62], "high": [4, 5, 88, 9], "medium": [31, 32, 40, 41, 42], "low": [70, 71, 100]}',
        '["TWO_HANDED_STAFF", "WAND"]',
        '["CATALYST"]',
        '{"small": [], "humble": [], "stout": [], "grand": [], "large": []}'
    ),
    (
        'lightningblast-runemaster',
        'lightningblast-runemaster',
        'Lightning Blast Runemaster',
        'Mage',
        'Runemaster',
        '["intelligence", "attunement"]',
        '["lightning"]',
        '{"essential": [17, 18, 19, 20, 62], "high": [4, 5, 88, 9], "medium": [31, 32, 70, 71], "low": [40, 41, 42, 100]}',
        '["ONE_HANDED_SCEPTRE", "WAND", "TWO_HANDED_STAFF"]',
        '["CATALYST"]',
        '{"small": [], "humble": [], "stout": [], "grand": [], "large": []}'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Update Triggers (PostgreSQL only)
-- ============================================================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for filter_rules
DROP TRIGGER IF EXISTS update_filter_rules_updated_at ON filter_rules;
CREATE TRIGGER update_filter_rules_updated_at
    BEFORE UPDATE ON filter_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for build_profiles
DROP TRIGGER IF EXISTS update_build_profiles_updated_at ON build_profiles;
CREATE TRIGGER update_build_profiles_updated_at
    BEFORE UPDATE ON build_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
