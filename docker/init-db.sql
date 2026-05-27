-- ============================================================
-- HONEYPOT DATABASE SCHEMA
-- ============================================================

-- Таблица GeoIP-данных по IP
CREATE TABLE IF NOT EXISTS ip_geo (
    ip              INET PRIMARY KEY,
    country         VARCHAR(100),
    country_code    VARCHAR(2),
    city            VARCHAR(100),
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    organization    VARCHAR(255),
    enriched_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Главная таблица сессий
CREATE TABLE IF NOT EXISTS sessions (
    session_id          VARCHAR(32) PRIMARY KEY,
    src_ip              INET NOT NULL,
    src_port            INTEGER,
    started_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at            TIMESTAMP WITH TIME ZONE,
    duration_seconds    DOUBLE PRECISION,
    ssh_client_version  TEXT,
    hassh               VARCHAR(32),
    tty_log_path        TEXT,
    raw_session_data    JSONB,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Попытки входа (логин/пароль)
CREATE TABLE IF NOT EXISTS logins (
    id          BIGSERIAL PRIMARY KEY,
    session_id  VARCHAR(32) REFERENCES sessions(session_id) ON DELETE CASCADE,
    username    TEXT,
    password    TEXT,
    success     BOOLEAN NOT NULL,
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Выполненные команды
CREATE TABLE IF NOT EXISTS commands (
    id          BIGSERIAL PRIMARY KEY,
    session_id  VARCHAR(32) REFERENCES sessions(session_id) ON DELETE CASCADE,
    command     TEXT,
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Попытки загрузки файлов (потенциально malware)
CREATE TABLE IF NOT EXISTS downloads (
    id          BIGSERIAL PRIMARY KEY,
    session_id  VARCHAR(32) REFERENCES sessions(session_id) ON DELETE CASCADE,
    url         TEXT,
    filename    TEXT,
    sha256      VARCHAR(64),
    file_size   BIGINT,
    timestamp   TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sessions_src_ip       ON sessions(src_ip);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at   ON sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_hassh        ON sessions(hassh);

CREATE INDEX IF NOT EXISTS idx_logins_session        ON logins(session_id);
CREATE INDEX IF NOT EXISTS idx_logins_password       ON logins(password);
CREATE INDEX IF NOT EXISTS idx_logins_username       ON logins(username);
CREATE INDEX IF NOT EXISTS idx_logins_timestamp      ON logins(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_commands_session      ON commands(session_id);
CREATE INDEX IF NOT EXISTS idx_commands_command      ON commands(command);
CREATE INDEX IF NOT EXISTS idx_commands_timestamp    ON commands(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_downloads_session     ON downloads(session_id);
CREATE INDEX IF NOT EXISTS idx_downloads_sha256      ON downloads(sha256);

CREATE INDEX IF NOT EXISTS idx_ip_geo_country        ON ip_geo(country_code);
