# Location API Limitations and Best Practices

## Overview

This document outlines the limitations, constraints, and best practices for implementing Google Places API, Mapbox Search Box API, and Foursquare Places API in TradeFlow's Smart Location Suggestions Service.

## Google Places API

### Limitations

#### 1. **Rate Limits**
- **Queries per 100 seconds per user:** 1,000 requests
- **Queries per minute:** 30,000 requests
- **Daily quota:** Configurable, but subject to billing limits

#### 2. **Pricing Constraints**
- **High cost at scale:** $32+ per 1,000 requests for basic data
- **Field-based pricing:** Different costs for different data fields
- **No unlimited free tier:** Only $200 monthly credit

#### 3. **Data Restrictions**
- **Caching limitations:** 30-day limit for storing place data
- **Display requirements:** Must display "Powered by Google" attribution
- **Usage restrictions:** Cannot pre-fetch data for offline use beyond 30 days

#### 4. **Geographic Coverage**
- **Varying quality:** Data quality varies significantly by region
- **Rural areas:** Limited coverage in remote or rural locations
- **International:** Reduced business information outside major markets

#### 5. **Business Information Accuracy**
- **Hours may be outdated:** Real-time hours not always accurate
- **Seasonal closures:** May not reflect temporary or seasonal closures
- **COVID-19 impacts:** Hours and availability may not reflect pandemic changes

### Best Practices

#### 1. **Cost Optimization**
```typescript
// Only request essential fields to minimize costs
const minimalFields = [
  'place_id',
  'name', 
  'geometry',
  'business_status',
  'rating'
];

// Use place_id for detailed follow-up requests only when needed
const detailedFields = [
  'formatted_phone_number',
  'opening_hours',
  'website',
  'photos'
];
```

#### 2. **Caching Strategy**
```typescript
// Implement multi-tier caching
const cacheStrategy = {
  basicInfo: '24 hours',     // Name, location, rating
  businessHours: '4 hours',  // Hours, availability
  photos: '7 days',          // Photo URLs
  reviews: '1 hour'          // Recent reviews
};
```

#### 3. **Error Handling**
```typescript
const handleGooglePlacesError = (status) => {
  switch (status) {
    case 'ZERO_RESULTS':
      return { fallback: 'mapbox', retry: false };
    case 'OVER_QUERY_LIMIT':
      return { fallback: 'foursquare', retry: true, delay: 60000 };
    case 'REQUEST_DENIED':
      return { fallback: 'foursquare', retry: false };
    case 'INVALID_REQUEST':
      return { fallback: null, retry: false, log: true };
    default:
      return { fallback: 'mapbox', retry: true, delay: 5000 };
  }
};
```

#### 4. **Request Optimization**
```typescript
// Batch nearby requests to reduce API calls
const optimizeRequests = (locations) => {
  return clusterLocations(locations, 1000) // 1km clusters
    .map(cluster => ({
      center: calculateCentroid(cluster),
      radius: calculateOptimalRadius(cluster)
    }));
};
```

## Mapbox Search Box API

### Limitations

#### 1. **Rate Limits**
- **No strict published limits:** Designed for high volume but undefined thresholds
- **Fair usage expected:** Aggressive usage may trigger throttling
- **Session-based billing:** Complex pricing model based on user sessions

#### 2. **Data Quality for Hardware Stores**
- **Limited business details:** Basic information compared to Google Places
- **Sparse POI metadata:** Less comprehensive business information
- **Category limitations:** Fewer hardware store specific categories

#### 3. **Search Functionality**
- **No reviews/ratings:** Limited user-generated content
- **Basic business hours:** Limited operating hours information
- **Limited phone/contact data:** Minimal contact information

#### 4. **Geographic Coverage**
- **Urban bias:** Better coverage in urban areas vs rural
- **International variation:** Quality varies by country and region
- **New business lag:** Slower to include newly opened businesses

### Best Practices

#### 1. **Optimal Use Cases**
```typescript
// Use Mapbox for route-based searches
const routeBasedSearch = async (route, category) => {
  return await mapboxClient.searchAlongRoute({
    route: route.geometry,
    category: 'hardware_store',
    maxDetour: 2000 // 2km detour limit
  });
};

// Use for geographical exploration
const exploreArea = async (bounds) => {
  return await mapboxClient.searchInBounds({
    bounds,
    category: 'retail',
    subcategory: 'building_supplies'
  });
};
```

#### 2. **Session Management**
```typescript
// Optimize session usage to control costs
class MapboxSessionManager {
  private currentSession = null;
  private sessionTimeout = 120000; // 2 minutes
  
  async search(query, location) {
    if (!this.currentSession || this.isSessionExpired()) {
      this.currentSession = this.createNewSession();
    }
    
    return this.currentSession.suggest(query, location);
  }
  
  private isSessionExpired() {
    return Date.now() - this.currentSession.startTime > this.sessionTimeout;
  }
}
```

#### 3. **Data Enhancement**
```typescript
// Enhance Mapbox results with additional data sources
const enhanceMapboxResults = async (results) => {
  return Promise.all(results.map(async (place) => {
    // Add business hours from local cache or other sources
    const enhancedData = await getBusinessDetails(place.fsq_id);
    return { ...place, ...enhancedData };
  }));
};
```

## Foursquare Places API

### Limitations

#### 1. **Rate Limits**
- **Standard accounts:** 50 queries per second
- **Enterprise accounts:** 100 queries per second
- **Monthly limits:** Based on subscription tier

#### 2. **Data Coverage**
- **Smaller POI database:** Fewer total places compared to Google
- **Chain focus:** Better for chain stores than independent businesses
- **Regional variations:** Coverage varies significantly by geography

#### 3. **Business Information**
- **User-generated content reliance:** Data quality depends on user contributions
- **Limited real-time updates:** Business information may be outdated
- **Verification issues:** Less rigorous business verification than Google

#### 4. **API Complexity**
- **Multiple endpoint types:** Pro vs Premium endpoint pricing
- **Field complexity:** Complex field selection for optimal pricing
- **Version management:** API versioning requirements

### Best Practices

#### 1. **Endpoint Optimization**
```typescript
// Use Pro endpoints for basic searches
const basicSearch = async (query, location) => {
  return await foursquareClient.search({
    query,
    ll: `${location.lat},${location.lng}`,
    fields: 'fsq_id,name,geocodes,location,categories' // Pro tier fields only
  });
};

// Use Premium endpoints selectively
const detailedPlace = async (fsqId) => {
  return await foursquareClient.details(fsqId, {
    fields: 'photos,tips,hours,rating,stats' // Premium tier fields
  });
};
```

#### 2. **Category Management**
```typescript
// Use specific hardware store categories
const hardwareStoreCategories = [
  '17069', // Hardware Store
  '17000', // Home & Garden
  '17001', // Building Supplies
  '17051', // Paint Store
];

const searchWithCategories = async (location) => {
  return await foursquareClient.search({
    ll: `${location.lat},${location.lng}`,
    categories: hardwareStoreCategories.join(','),
    radius: 5000
  });
};
```

#### 3. **Data Quality Validation**
```typescript
// Validate and filter Foursquare results
const validateFoursquareResults = (results) => {
  return results.filter(place => {
    // Filter out places without proper verification
    if (!place.verified) return false;
    
    // Filter out permanently closed businesses
    if (place.closed_bucket === 'VeryLikelyPermanentlyClosed') return false;
    
    // Ensure minimum data quality
    return place.name && place.geocodes && place.location;
  });
};
```

## Cross-API Best Practices

### 1. **Unified Data Model**
```typescript
interface HardwareStore {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  contact?: {
    phone?: string;
    website?: string;
  };
  hours?: BusinessHours;
  rating?: number;
  reviews?: number;
  categories: string[];
  verified: boolean;
  source: 'google' | 'mapbox' | 'foursquare';
  lastUpdated: Date;
}

// Normalize data from different APIs
const normalizeHardwareStore = (apiResponse, source): HardwareStore => {
  switch (source) {
    case 'google':
      return normalizeGooglePlace(apiResponse);
    case 'mapbox':
      return normalizeMapboxPlace(apiResponse);
    case 'foursquare':
      return normalizeFoursquarePlace(apiResponse);
  }
};
```

### 2. **Fallback Strategy**
```typescript
class LocationService {
  private providers = ['google', 'mapbox', 'foursquare'];
  
  async searchHardwareStores(location, query) {
    for (const provider of this.providers) {
      try {
        const results = await this.searchWithProvider(provider, location, query);
        if (results.length > 0) {
          return this.normalizeResults(results, provider);
        }
      } catch (error) {
        console.warn(`${provider} failed: ${error.message}`);
        // Continue to next provider
      }
    }
    
    throw new Error('All location providers failed');
  }
}
```

### 3. **Caching Strategy**
```typescript
class UnifiedLocationCache {
  private cache = new Map();
  
  // Multi-tier caching with different TTLs
  async getCachedResults(cacheKey, provider) {
    const cached = this.cache.get(cacheKey);
    
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    const ttl = this.getTTL(provider, cached.dataType);
    
    return age < ttl ? cached.data : null;
  }
  
  private getTTL(provider, dataType) {
    const ttls = {
      google: { basic: 24 * 60 * 60 * 1000, detailed: 4 * 60 * 60 * 1000 },
      mapbox: { basic: 12 * 60 * 60 * 1000, detailed: 2 * 60 * 60 * 1000 },
      foursquare: { basic: 8 * 60 * 60 * 1000, detailed: 1 * 60 * 60 * 1000 }
    };
    
    return ttls[provider][dataType];
  }
}
```

### 4. **Performance Monitoring**
```typescript
class APIPerformanceMonitor {
  private metrics = {
    responseTime: new Map(),
    errorRate: new Map(),
    costPerRequest: new Map()
  };
  
  trackRequest(provider, startTime, success, cost = 0) {
    const duration = Date.now() - startTime;
    
    // Track response time
    this.updateMetric('responseTime', provider, duration);
    
    // Track error rate
    this.updateMetric('errorRate', provider, success ? 0 : 1);
    
    // Track cost
    this.updateMetric('costPerRequest', provider, cost);
    
    // Alert on anomalies
    this.checkThresholds(provider);
  }
  
  private checkThresholds(provider) {
    const thresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.1,     // 10%
      dailyCost: 50       // $50
    };
    
    // Implementation for alerting logic
  }
}
```

## Compliance and Legal Considerations

### 1. **Terms of Service Compliance**

**Google Places API:**
- Display "Powered by Google" attribution
- Do not cache data longer than 30 days
- Do not use data for competitor analysis
- Follow Google's branding guidelines

**Mapbox:**
- Display Mapbox logo and attribution
- Respect rate limiting (no abuse)
- Cannot store search results permanently
- Follow usage guidelines

**Foursquare:**
- Include visual crediting
- Respect data retention policies
- Cannot redistribute data to third parties
- Follow business use guidelines

### 2. **Privacy Considerations**
```typescript
// Anonymize user data in API requests
const anonymizeLocation = (location) => {
  // Reduce precision to protect user privacy
  return {
    lat: Math.round(location.lat * 1000) / 1000,  // ~100m precision
    lng: Math.round(location.lng * 1000) / 1000
  };
};

// Log user consent for location tracking
const trackLocationUsage = async (userId, purpose) => {
  await auditLog.record({
    userId,
    action: 'location_api_request',
    purpose,
    timestamp: Date.now(),
    retention: '30 days'
  });
};
```

### 3. **Data Handling**
```typescript
// Implement secure data handling
class SecureLocationDataHandler {
  async processLocationData(data, source) {
    // Remove sensitive information
    const sanitizedData = this.sanitizeData(data);
    
    // Encrypt sensitive fields
    const encryptedData = await this.encryptSensitiveFields(sanitizedData);
    
    // Set TTL based on compliance requirements
    const ttl = this.getComplianceTTL(source);
    
    return { data: encryptedData, ttl };
  }
  
  private sanitizeData(data) {
    // Remove PII, IP addresses, etc.
    const { user_ip, ...sanitized } = data;
    return sanitized;
  }
}
```

## Cost Management Strategies

### 1. **Budget Controls**
```typescript
class APIBudgetManager {
  private budgets = {
    google: { daily: 50, monthly: 1500 },
    mapbox: { daily: 5, monthly: 150 },
    foursquare: { daily: 10, monthly: 300 }
  };
  
  async checkBudget(provider, requestCost) {
    const usage = await this.getCurrentUsage(provider);
    
    if (usage.daily + requestCost > this.budgets[provider].daily) {
      throw new Error(`Daily budget exceeded for ${provider}`);
    }
    
    if (usage.monthly + requestCost > this.budgets[provider].monthly) {
      throw new Error(`Monthly budget exceeded for ${provider}`);
    }
    
    return true;
  }
}
```

### 2. **Request Optimization**
```typescript
// Intelligent request routing based on use case
const routeRequest = (requestType, location, budget) => {
  if (requestType === 'route_search') {
    return 'mapbox'; // Best for route-based searches
  }
  
  if (requestType === 'detailed_business_info') {
    return budget > 0.03 ? 'google' : 'foursquare'; // Cost-based routing
  }
  
  if (requestType === 'basic_search') {
    return 'foursquare'; // Most cost-effective for basic searches
  }
  
  return 'google'; // Default to highest quality
};
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. **High API Costs**
**Symptoms:** Unexpected billing charges
**Solutions:**
- Implement request batching
- Optimize field selection
- Increase cache TTL
- Add budget alerts

#### 2. **Rate Limiting**
**Symptoms:** 429 HTTP errors, OVER_QUERY_LIMIT responses
**Solutions:**
- Implement exponential backoff
- Distribute requests across time
- Use fallback providers
- Cache aggressively

#### 3. **Poor Data Quality**
**Symptoms:** Incorrect business information, outdated hours
**Solutions:**
- Cross-validate with multiple sources
- Implement user feedback loops
- Use real-time validation where possible
- Prefer Google Places for critical business info

#### 4. **Geographic Coverage Gaps**
**Symptoms:** No results in certain areas
**Solutions:**
- Expand search radius progressively
- Use multiple providers for coverage
- Implement graceful degradation
- Provide manual entry options

## Performance Benchmarks

### Expected Performance Metrics

| Metric | Google Places | Mapbox Search | Foursquare |
|--------|---------------|---------------|------------|
| Response Time | 200-800ms | 100-400ms | 300-600ms |
| Success Rate | 95%+ | 85%+ | 90%+ |
| Data Completeness | 90%+ | 60%+ | 75%+ |
| Cost per 1K requests | $32+ | $11.50 | $15 |

### Monitoring Thresholds

```typescript
const performanceThresholds = {
  responseTime: {
    warning: 1000,   // 1 second
    critical: 3000   // 3 seconds
  },
  errorRate: {
    warning: 0.05,   // 5%
    critical: 0.15   // 15%
  },
  costPerDay: {
    warning: 40,     // $40
    critical: 60     // $60
  }
};
```

---

**Document Status:** ✅ **COMPLETE**
**Last Updated:** Current
**Next Review:** Monthly performance review
**Owner:** TradeFlow Development Team 