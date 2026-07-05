-- Alias du script complet (identique à reset-schema.sql)
-- Tables : users, events, schedules, reservations

DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS reservation_status CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS event_category CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

CREATE TYPE user_role AS ENUM ('ADMIN', 'ORGANIZER', 'PARTICIPANT');

CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    first_name  VARCHAR(100)  NOT NULL,
    last_name   VARCHAR(100)  NOT NULL,
    username    VARCHAR(100)  NOT NULL UNIQUE,
    email       VARCHAR(200)  NOT NULL UNIQUE,
    phone       VARCHAR(20),
    role        user_role     NOT NULL DEFAULT 'PARTICIPANT',
    keycloak_id VARCHAR(255)  UNIQUE,
    created_at  TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_role     ON users(role);

CREATE TYPE event_category AS ENUM
    ('CONFERENCE', 'FORMATION', 'ATELIER', 'SEMINAIRE', 'AUTRE');

CREATE TYPE event_status AS ENUM ('ACTIVE', 'CANCELLED', 'COMPLETED');

CREATE TABLE events (
    id               BIGSERIAL        PRIMARY KEY,
    title            VARCHAR(200)     NOT NULL,
    description      TEXT,
    category         event_category   NOT NULL,
    max_places       INTEGER          NOT NULL CHECK (max_places > 0),
    available_places INTEGER          NOT NULL CHECK (available_places >= 0),
    organizer_id     BIGINT           NOT NULL REFERENCES users(id),
    status           event_status     NOT NULL DEFAULT 'ACTIVE',
    location         VARCHAR(300),
    image_url        VARCHAR(500),
    created_at       TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP,
    CONSTRAINT chk_places CHECK (available_places <= max_places)
);

CREATE TABLE schedules (
    id         BIGSERIAL  PRIMARY KEY,
    event_id   BIGINT     NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    date       DATE       NOT NULL,
    start_time TIME       NOT NULL,
    end_time   TIME       NOT NULL,
    room       VARCHAR(100),
    speaker    VARCHAR(200),
    CONSTRAINT chk_time CHECK (end_time > start_time)
);

CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_status    ON events(status);
CREATE INDEX idx_events_category  ON events(category);
CREATE INDEX idx_schedules_event  ON schedules(event_id);

CREATE TYPE reservation_status AS ENUM
    ('PENDING', 'CONFIRMED', 'CANCELLED');

CREATE TABLE reservations (
    id           BIGSERIAL          PRIMARY KEY,
    user_id      BIGINT             NOT NULL REFERENCES users(id),
    event_id     BIGINT             NOT NULL REFERENCES events(id),
    status       reservation_status NOT NULL DEFAULT 'PENDING',
    seat_number  INTEGER,
    created_at   TIMESTAMP          NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP,
    cancelled_at TIMESTAMP,
    CONSTRAINT uq_user_event UNIQUE (user_id, event_id)
);
