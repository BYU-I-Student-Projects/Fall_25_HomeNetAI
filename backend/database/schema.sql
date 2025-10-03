-- HomeNetAI Weather Database Schema
-- PostgreSQL database for weather data and user management

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- User locations table
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL,
    longitude DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Weather data table (linked to user locations)
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    temperature DECIMAL(8, 2),
    apparent_temperature DECIMAL(8, 2),
    humidity DECIMAL(8, 2),
    precipitation DECIMAL(8, 2),
    precipitation_probability DECIMAL(8, 2),
    wind_speed DECIMAL(8, 2),
    wind_direction DECIMAL(8, 2),
    cloud_cover DECIMAL(8, 2),
    uv_index DECIMAL(8, 2),
    weather_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES user_locations (id) ON DELETE CASCADE
);

-- Daily weather summaries (linked to user locations)
CREATE TABLE IF NOT EXISTS daily_weather (
    id SERIAL PRIMARY KEY,
    location_id INTEGER NOT NULL,
    date DATE NOT NULL,
    temp_max DECIMAL(8, 2),
    temp_min DECIMAL(8, 2),
    precipitation_sum DECIMAL(8, 2),
    precipitation_probability_max DECIMAL(8, 2),
    wind_speed_max DECIMAL(8, 2),
    uv_index_max DECIMAL(8, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES user_locations (id) ON DELETE CASCADE,
    UNIQUE(location_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weather_location_time ON weather_data(location_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_location_date ON daily_weather(location_id, date);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
