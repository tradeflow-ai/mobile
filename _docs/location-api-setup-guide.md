# Location API Setup Guide

## Overview

This guide provides step-by-step instructions for setting up API credentials and environment configuration for TradeFlow's Smart Location Suggestions Service.

## API Credentials Setup

### 1. Google Places API Setup

#### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the **Places API** in the API Library
4. Enable the **Maps JavaScript API** (if needed for frontend)

#### Step 2: Create API Key
1. Navigate to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the generated API key
4. **Restrict the API key** for security:
   - Go to API key settings
   - Under **API restrictions**, select **Restrict key**
   - Choose **Places API** and **Maps JavaScript API**
   - Under **Application restrictions**, set appropriate restrictions

#### Step 3: Configure Billing
1. Go to **Billing** in Google Cloud Console
2. Link a billing account to enable API usage
3. Set up **billing alerts** to monitor costs
4. Consider setting **quotas** to prevent unexpected charges

**Security Best Practices:**
```bash
# Restrict by IP addresses (server-side)
Allowed IPs: your-server-ip-range

# Restrict by HTTP referrers (client-side)
Allowed referrers: https://yourdomain.com/*

# Restrict by Android/iOS apps
Add package name and SHA-1 fingerprint
```

### 2. Mapbox Setup (Already Configured)

TradeFlow already uses Mapbox. Verify current setup:

#### Step 1: Check Existing Configuration
```bash
# Verify current Mapbox token
echo $EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN

# Check app.json configuration
cat app.json | grep mapbox
```

#### Step 2: Add Search Box Access (if needed)
1. Log into [Mapbox Studio](https://studio.mapbox.com/)
2. Go to **Access Tokens**
3. Verify current token has **Search** scope enabled
4. If not, create new token with required scopes:
   - **Styles:Read**
   - **Fonts:Read** 
   - **Datasets:Read**
   - **Search:Read** ← Required for Search Box API

### 3. Foursquare Places API Setup

#### Step 1: Create Developer Account
1. Go to [Foursquare Developer Portal](https://developer.foursquare.com/)
2. Sign up or log in to existing account
3. Accept developer terms of service

#### Step 2: Create Project and API Key
1. Click **Create New Project**
2. Enter project details:
   - **Project Name:** TradeFlow Location Services
   - **Description:** Hardware store location suggestions for tradesman app
   - **Category:** Location Services
3. Generate API key from project dashboard
4. Note the free tier limits: 10,000 requests/month

## Environment Configuration

### 1. Environment Variables Setup

Add the following to your `.env` file:

```env
# =================================
# LOCATION API CONFIGURATION
# =================================

# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
GOOGLE_PLACES_REGION=US
GOOGLE_PLACES_LANGUAGE=en

# Mapbox (already configured)
EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN=your_existing_mapbox_token
MAPBOX_SECRET_ACCESS_TOKEN=your_mapbox_secret_token

# Foursquare Places API (backup)
FOURSQUARE_API_KEY=your_foursquare_api_key_here
FOURSQUARE_API_VERSION=20240101

# Location Service Configuration
LOCATION_CACHE_TTL=14400  # 4 hours in seconds
LOCATION_DEFAULT_RADIUS=5000  # 5km in meters
LOCATION_MAX_RESULTS=20
LOCATION_REQUEST_TIMEOUT=10000  # 10 seconds
```

### 2. App Configuration Updates

Update `app.json` with location API configuration:

```json
{
  "expo": {
    "extra": {
      "locationServices": {
        "primaryProvider": "google",
        "secondaryProvider": "mapbox", 
        "backupProvider": "foursquare",
        "cacheEnabled": true,
        "cacheTTL": 14400,
        "defaultRadius": 5000,
        "maxResults": 20
      }
    }
  }
}
```

### 3. TypeScript Configuration

Create type definitions for location services:

```typescript
// types/location.ts
export interface LocationProvider {
  name: string;
  apiKey: string;
  baseUrl: string;
  rateLimits: {
    requestsPerSecond: number;
    requestsPerMonth: number;
  };
}

export interface LocationServiceConfig {
  primaryProvider: LocationProvider;
  secondaryProvider: LocationProvider;
  backupProvider: LocationProvider;
  cache: {
    enabled: boolean;
    ttl: number;
  };
  defaults: {
    radius: number;
    maxResults: number;
    timeout: number;
  };
}
```

## Credential Management

### 1. Development Environment

For development, use `.env.local`:

```env
# Development credentials
GOOGLE_PLACES_API_KEY=dev_google_places_key
FOURSQUARE_API_KEY=dev_foursquare_key
```

### 2. Production Environment

For production, use secure environment variable management:

```bash
# Using Expo EAS Secrets (recommended)
eas secret:create --scope project --name GOOGLE_PLACES_API_KEY --value your_prod_key
eas secret:create --scope project --name FOURSQUARE_API_KEY --value your_prod_key

# Verify secrets
eas secret:list
```

### 3. Environment-Specific Configuration

Create configuration files for different environments:

```typescript
// config/location-config.ts
import Constants from 'expo-constants';

interface LocationConfig {
  googlePlaces: {
    apiKey: string;
    region: string;
    language: string;
  };
  mapbox: {
    accessToken: string;
  };
  foursquare: {
    apiKey: string;
    version: string;
  };
}

const developmentConfig: LocationConfig = {
  googlePlaces: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
    region: 'US',
    language: 'en'
  },
  mapbox: {
    accessToken: Constants.expoConfig?.extra?.mapboxAccessToken || ''
  },
  foursquare: {
    apiKey: process.env.FOURSQUARE_API_KEY || '',
    version: '20240101'
  }
};

const productionConfig: LocationConfig = {
  googlePlaces: {
    apiKey: Constants.expoConfig?.extra?.googlePlacesApiKey || '',
    region: 'US',
    language: 'en'
  },
  mapbox: {
    accessToken: Constants.expoConfig?.extra?.mapboxAccessToken || ''
  },
  foursquare: {
    apiKey: Constants.expoConfig?.extra?.foursquareApiKey || '',
    version: '20240101'
  }
};

export const locationConfig = __DEV__ ? developmentConfig : productionConfig;
```

## Security Configuration

### 1. API Key Security

**Google Places API:**
```javascript
// Restrict by IP (server-side only)
const restrictions = {
  serverIpAddresses: ['your-server-ip'],
  androidApps: [{
    packageName: 'com.tradeflow.mobile',
    sha1Fingerprint: 'your-sha1-fingerprint'
  }],
  iosApps: [{
    bundleId: 'com.tradeflow.mobile'
  }]
};
```

**Mapbox:**
```javascript
// URL restrictions for web usage
const allowedUrls = [
  'https://tradeflow.app/*',
  'https://*.tradeflow.app/*'
];
```

### 2. Rate Limiting Configuration

```typescript
// services/rate-limiter.ts
export class APIRateLimiter {
  private limits = {
    google: { requests: 30000, window: 60000 }, // 30k per minute
    mapbox: { requests: 1000, window: 1000 },   // 1k per second  
    foursquare: { requests: 50, window: 1000 }  // 50 per second
  };

  async checkLimit(provider: string): Promise<boolean> {
    // Implementation for rate limiting
  }
}
```

### 3. Error Handling Configuration

```typescript
// config/error-handling.ts
export const locationErrorConfig = {
  retryAttempts: 3,
  retryDelay: 1000, // ms
  fallbackEnabled: true,
  fallbackOrder: ['google', 'mapbox', 'foursquare'],
  timeouts: {
    google: 10000,   // 10s
    mapbox: 5000,    // 5s
    foursquare: 8000 // 8s
  }
};
```

## Monitoring and Analytics Setup

### 1. API Usage Monitoring

```typescript
// services/usage-monitor.ts
export class APIUsageMonitor {
  private metrics = {
    requestCount: 0,
    errorCount: 0,
    responseTime: 0,
    costEstimate: 0
  };

  trackRequest(provider: string, duration: number, success: boolean) {
    // Track API usage for billing and performance monitoring
  }
}
```

### 2. Cost Monitoring

```env
# Cost monitoring thresholds
DAILY_COST_LIMIT=50.00
MONTHLY_COST_LIMIT=1500.00
COST_ALERT_EMAIL=alerts@tradeflow.com
```

### 3. Performance Monitoring

```typescript
// config/monitoring.ts
export const monitoringConfig = {
  enableMetrics: true,
  sampleRate: 0.1, // 10% sampling
  endpoints: {
    metrics: 'https://api.tradeflow.com/metrics',
    alerts: 'https://api.tradeflow.com/alerts'
  },
  thresholds: {
    responseTime: 1000, // ms
    errorRate: 0.05,    // 5%
    cacheHitRate: 0.7   // 70%
  }
};
```

## Testing Configuration

### 1. Test API Keys

```env
# Test environment
GOOGLE_PLACES_API_KEY_TEST=test_google_key
FOURSQUARE_API_KEY_TEST=test_foursquare_key

# Enable test mode
LOCATION_TEST_MODE=true
LOCATION_MOCK_RESPONSES=true
```

### 2. Mock Data Setup

```typescript
// test/mocks/location-data.ts
export const mockHardwareStores = [
  {
    place_id: 'test_place_1',
    name: 'Test Hardware Store',
    location: { lat: 40.7128, lng: -74.0060 },
    rating: 4.5,
    opening_hours: { open_now: true }
  }
];
```

## Validation and Testing

### 1. Credential Validation Script

Create a validation script to test all APIs:

```typescript
// scripts/validate-credentials.ts
async function validateCredentials() {
  try {
    // Test Google Places API
    const googleTest = await testGooglePlaces();
    console.log('✅ Google Places API:', googleTest ? 'Valid' : 'Invalid');

    // Test Mapbox API  
    const mapboxTest = await testMapbox();
    console.log('✅ Mapbox API:', mapboxTest ? 'Valid' : 'Invalid');

    // Test Foursquare API
    const foursquareTest = await testFoursquare();
    console.log('✅ Foursquare API:', foursquareTest ? 'Valid' : 'Invalid');

  } catch (error) {
    console.error('❌ Credential validation failed:', error);
  }
}
```

### 2. Environment Validation

```typescript
// utils/env-validator.ts
export function validateEnvironment() {
  const required = [
    'GOOGLE_PLACES_API_KEY',
    'EXPO_PUBLIC_MAPBOX_PUBLIC_TOKEN',
    'FOURSQUARE_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

## Deployment Checklist

### Before Deployment:

- [ ] All API keys created and configured
- [ ] Environment variables set in production
- [ ] API key restrictions applied
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Billing alerts configured
- [ ] Error handling tested
- [ ] Fallback mechanisms verified
- [ ] Performance benchmarks established
- [ ] Security review completed

### Post-Deployment:

- [ ] Monitor API usage and costs
- [ ] Verify rate limiting effectiveness
- [ ] Check error rates and response times
- [ ] Validate fallback behavior
- [ ] Review security logs
- [ ] Update documentation as needed

---

**Setup Status:** Ready for implementation
**Security Level:** Production-ready with proper restrictions
**Estimated Setup Time:** 2-4 hours
**Monthly Cost Estimate:** ~$1,475 at 50k requests/month 