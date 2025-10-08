// frontend/src/config.js

const config = {
  // App Configuration
  APP: {
    NAME: "SmartFishing",
    VERSION: "1.0.0",
    DESCRIPTION: "IoT + AI system for safe and sustainable fishing",
    AUTHOR: "Team SmartFishing - ACEathon 2025",
    REPOSITORY: "https://github.com/your-username/smartfishing",
  },

  // API Configuration
  API: {
    BASE_URL: process.env.REACT_APP_API_URL || "https://api.smartfishing.tech",
    TIMEOUT: 10000,
    ENDPOINTS: {
      WEATHER: "/api/weather",
      FISHING_ZONES: "/api/zones",
      SENSOR_DATA: "/api/sensors",
      SOS_ALERT: "/api/sos",
      USER_LOCATION: "/api/location",
    },
  },

  // Weather API Configuration
  WEATHER: {
    PROVIDER: "openweathermap", // openweathermap | weatherbit | mock
    API_KEY: process.env.REACT_APP_WEATHER_API_KEY || "demo_key",
    UPDATE_INTERVAL: 300000, // 5 minutes in milliseconds
    ALERT_THRESHOLDS: {
      WIND_SPEED: 25, // km/h
      WAVE_HEIGHT: 2.5, // meters
      RAIN_INTENSITY: 20, // mm/h
      STORM_DISTANCE: 50, // km
    },
  },

  // Fishing Zone Prediction Configuration
  FISHING_ZONES: {
    UPDATE_INTERVAL: 900000, // 15 minutes
    CONFIDENCE_THRESHOLD: 60, // Minimum confidence percentage
    MAX_ZONES: 5,
    FACTORS: {
      WATER_TEMP: { MIN: 20, MAX: 30, IDEAL: 26 },
      OXYGEN_LEVEL: { MIN: 5, IDEAL: 8 }, // mg/L
      PH_LEVEL: { MIN: 6.5, MAX: 8.5, IDEAL: 7.2 },
      CLOUD_COVER: { MAX: 70 }, // percentage
    },
  },

  // IoT Sensor Configuration
  IOT: {
    SENSOR_UPDATE_INTERVAL: 60000, // 1 minute
    SENSORS: {
      WATER_TEMP: { UNIT: "°C", PRECISION: 1 },
      PH_LEVEL: { UNIT: "pH", PRECISION: 2 },
      OXYGEN: { UNIT: "mg/L", PRECISION: 1 },
      TURBIDITY: { UNIT: "NTU", PRECISION: 0 },
    },
    CONNECTIVITY: {
      TYPE: "LoRaWAN", // LoRaWAN | GSM | Satellite
      HEARTBEAT_INTERVAL: 300000, // 5 minutes
    },
  },

  // Emergency & Safety Configuration
  SAFETY: {
    SOS: {
      CONTACTS: [
        "coast_guard",
        "nearby_boats",
        "family_primary",
        "family_secondary",
      ],
      LOCATION_UPDATE_INTERVAL: 30000, // 30 seconds during emergency
      AUTO_ALERT_DELAY: 10000, // 10 seconds
    },
    ALERT_LEVELS: {
      LOW: { COLOR: "#27AE60", SOUND: "gentle" },
      MEDIUM: { COLOR: "#F39C12", SOUND: "warning" },
      HIGH: { COLOR: "#E74C3C", SOUND: "urgent" },
      CRITICAL: { COLOR: "#8B0000", SOUND: "emergency" },
    },
  },

  // Map Configuration
  MAP: {
    PROVIDER: "mapbox", // mapbox | leaflet | google
    API_KEY: process.env.REACT_APP_MAP_API_KEY || "demo_map_key",
    DEFAULT_ZOOM: 10,
    DEFAULT_CENTER: {
      LAT: 19.0760, // Mumbai coordinates
      LNG: 72.8777,
    },
    TILE_LAYER: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },

  // Notification Configuration
  NOTIFICATIONS: {
    ENABLED: true,
    TYPES: {
      WEATHER_ALERT: { PRIORITY: "high", DURATION: 10000 },
      ZONE_UPDATE: { PRIORITY: "medium", DURATION: 5000 },
      SAFETY_WARNING: { PRIORITY: "critical", DURATION: 0 }, // Until dismissed
      SYSTEM: { PRIORITY: "low", DURATION: 3000 },
    },
    SMS: {
      ENABLED: true,
      PROVIDER: "twilio", // twilio | fast2sms | mock
      API_KEY: process.env.REACT_APP_SMS_API_KEY,
    },
  },

  // User Interface Configuration
  UI: {
    THEME: {
      PRIMARY: "#0077b6",
      SECONDARY: "#03045e",
      SUCCESS: "#27AE60",
      WARNING: "#F39C12",
      DANGER: "#E74C3C",
      BACKGROUND: "#FFFFFF",
      TEXT: "#2C3E50",
    },
    FONTS: {
      HEADING: "'Montserrat', sans-serif",
      BODY: "'Open Sans', sans-serif",
      MONOSPACE: "'Fira Code', monospace",
    },
    BREAKPOINTS: {
      MOBILE: 768,
      TABLET: 1024,
      DESKTOP: 1200,
    },
    ANIMATION: {
      DURATION: 300,
      EASING: "ease-in-out",
    },
  },

  // Local Storage Keys
  STORAGE: {
    USER_PREFERENCES: "smartfishing_preferences",
    LOCATION_HISTORY: "smartfishing_location_history",
    FISHING_DATA: "smartfishing_catch_data",
    ALERT_HISTORY: "smartfishing_alert_history",
    OFFLINE_DATA: "smartfishing_offline_cache",
  },

  // Feature Flags
  FEATURES: {
    AI_PREDICTIONS: true,
    REAL_TIME_ALERTS: true,
    OFFLINE_MODE: true,
    MULTI_LANGUAGE: false,
    VOICE_ALERTS: false,
    COMMUNITY_FEATURES: true,
  },

  // Development & Debug Configuration
  DEBUG: {
    LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    MOCK_DATA: process.env.NODE_ENV === 'development',
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN,
  },

  // External Services
  EXTERNAL_SERVICES: {
    SENTRY: {
      ENABLED: process.env.NODE_ENV === 'production',
      DSN: process.env.REACT_APP_SENTRY_DSN,
    },
    ANALYTICS: {
      ENABLED: true,
      GOOGLE_ANALYTICS_ID: process.env.REACT_APP_GA_ID,
    },
  },
};

// Environment-specific overrides
const environmentConfig = {
  development: {
    API: {
      BASE_URL: "http://localhost:3001",
    },
    DEBUG: {
      MOCK_DATA: true,
      LOG_LEVEL: "debug",
    },
    FEATURES: {
      OFFLINE_MODE: true,
    },
  },
  production: {
    API: {
      BASE_URL: "https://api.smartfishing.tech",
    },
    DEBUG: {
      MOCK_DATA: false,
      LOG_LEVEL: "error",
    },
  },
};

// Merge environment-specific config
const env = process.env.NODE_ENV || 'development';
const finalConfig = {
  ...config,
  ...environmentConfig[env],
};

// Freeze config to prevent accidental modifications
Object.freeze(finalConfig);

export default finalConfig;
