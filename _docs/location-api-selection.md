# Location API Selection for TradeFlow Hardware Store Suggestions

## Executive Decision

Based on comprehensive research and analysis of Google Places API, Mapbox Search Box API, and Foursquare Places API, the following selection has been made for TradeFlow's Smart Location Suggestions Service.

## Selected APIs

### Primary API: Google Places API

**Selection Rationale:**
- **Superior data quality** for hardware stores with 9/10 rating
- **Comprehensive business information** including real-time hours, contact details, reviews
- **Extensive hardware store categorization** with 7 specific categories
- **Industry standard reliability** with proven track record
- **Essential for professional tradesman workflows** requiring accurate business data

**Implementation Details:**
- Use for detailed hardware store discovery
- Request minimal field sets to control costs
- Implement aggressive caching strategies
- Primary focus on nearby search with category filtering

### Secondary API: Mapbox Search Box API

**Selection Rationale:**
- **Cost-effective** at $11.50 per 1,000 sessions vs Google's $32+ per 1,000 requests
- **Excellent integration** with existing Mapbox mapping infrastructure
- **Search along route functionality** valuable for tradesman workflows
- **Modern API design** with straightforward implementation

**Implementation Details:**
- Use for route-based hardware store discovery
- Complement Google Places for mapping-focused searches
- Leverage existing Mapbox credentials and integration
- Focus on geographical search patterns

### Backup API: Foursquare Places API

**Selection Rationale:**
- **Redundancy and reliability** in case of primary API issues
- **Competitive pricing** at volume ($0-15 per 1,000 requests)
- **Good hardware store coverage** with reasonable data quality
- **Developer-friendly** with migration tools available

## Coordination Requirements

### 🚨 IMPORTANT: Jeremiah Coordination Required

Before final implementation, coordinate with Jeremiah on:

1. **Existing Google Places usage** in other TradeFlow components
2. **API key management** and billing consolidation
3. **Rate limiting coordination** to avoid conflicts
4. **Shared caching strategies** across services
5. **Mapbox integration points** to ensure compatibility

**Action Items:**
- [ ] Schedule coordination meeting with Jeremiah
- [ ] Review existing location service implementations
- [ ] Align on API key management strategy
- [ ] Confirm no conflicts with planned features

## Implementation Strategy

### Phase 1: Google Places API (Primary)

```typescript
// Core hardware store search service
export class HardwareStoreLocationService {
  private googlePlacesClient: GooglePlacesClient;
  private cache: LocationCache;

  async searchNearbyHardwareStores(
    location: { lat: number; lng: number },
    radius: number = 5000
  ): Promise<HardwareStore[]> {
    // Check cache first
    const cacheKey = `hardware_${location.lat}_${location.lng}_${radius}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    // Google Places API request
    const results = await this.googlePlacesClient.nearbySearch({
      location,
      radius,
      type: 'hardware_store',
      fields: ['place_id', 'name', 'geometry', 'business_status', 'rating', 'opening_hours']
    });

    // Cache for 4 hours
    await this.cache.set(cacheKey, results, 4 * 60 * 60);
    return results;
  }
}
```

### Phase 2: Mapbox Integration (Secondary)

```typescript
// Route-based hardware store discovery
export class RouteHardwareStoreService {
  private mapboxClient: MapboxSearchClient;

  async searchAlongRoute(
    route: RouteGeometry,
    maxDetour: number = 2000
  ): Promise<HardwareStore[]> {
    return await this.mapboxClient.searchAlongRoute({
      route: route.geometry,
      category: 'hardware_store',
      maxDetour
    });
  }
}
```

### Phase 3: Foursquare Backup (Fallback)

```typescript
// Backup service for redundancy
export class BackupLocationService {
  private foursquareClient: FoursquareClient;

  async searchHardwareStoresBackup(
    location: { lat: number; lng: number }
  ): Promise<HardwareStore[]> {
    return await this.foursquareClient.search({
      ll: `${location.lat},${location.lng}`,
      query: 'hardware store',
      categories: '17069' // Hardware store category
    });
  }
}
```

## Cost Management Strategy

### Expected Usage: 50,000 searches/month

**Primary (Google Places):**
- Monthly cost: ~$1,600 (using basic fields only)
- Free tier: $200 credit (6,250 requests)
- Net cost: ~$1,400/month

**Secondary (Mapbox):**
- Monthly cost: ~$85 (using request model for route searches)
- Free tier: 500 sessions
- Net cost: ~$75/month

**Total Estimated Cost: ~$1,475/month**

### Cost Optimization Techniques

1. **Smart Caching:**
   ```typescript
   // 4-hour cache for business details
   // 24-hour cache for basic location data
   // LRU cache with 10MB limit
   ```

2. **Request Batching:**
   ```typescript
   // Batch nearby requests within 1km radius
   // Debounce user searches by 500ms
   // Use clustering for dense areas
   ```

3. **Field Optimization:**
   ```typescript
   // Request only essential fields initially
   // Lazy load additional details on demand
   // Use place_id for detailed follow-up requests
   ```

## Technical Implementation Plan

### Environment Variables

```env
# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_key
GOOGLE_PLACES_REGION=US

# Mapbox (already configured)
MAPBOX_ACCESS_TOKEN=your_mapbox_token

# Foursquare (backup)
FOURSQUARE_API_KEY=your_foursquare_key
```

### Service Architecture

```
LocationSuggestionService
├── GooglePlacesService (Primary)
├── MapboxSearchService (Secondary)
├── FoursquareService (Backup)
├── LocationCache
└── RequestBatcher
```

### API Rate Limiting

```typescript
export class RateLimitedLocationService {
  private googleLimiter = new RateLimiter(30000, 60000); // 30k per minute
  private mapboxLimiter = new RateLimiter(1000, 1000);   // 1k per second
  private foursquareLimiter = new RateLimiter(50, 1000); // 50 per second
}
```

## Quality Assurance

### Data Quality Metrics

1. **Accuracy Score:** Target 95%+ correct hardware store identification
2. **Completeness:** Business hours available for 80%+ of results
3. **Freshness:** Data updated within 24 hours for 90%+ of results
4. **Coverage:** Find hardware stores within 10km for 95%+ of locations

### Testing Strategy

```typescript
// Unit tests for each API service
// Integration tests for fallback mechanisms
// Performance tests for caching efficiency
// User acceptance tests for hardware store discovery
```

## Monitoring and Analytics

### Key Metrics

1. **API Response Times:** Target <500ms for 95th percentile
2. **Cache Hit Rate:** Target 70%+ for repeated searches
3. **API Error Rate:** Target <1% for all services
4. **Cost per Search:** Target <$0.03 per successful search

### Alerting

```typescript
// Alert on API error rate >5%
// Alert on response time >1000ms
// Alert on daily cost >$75
// Alert on cache hit rate <50%
```

## Risk Mitigation

### High Cost Risk
- Implement daily spending limits
- Monitor usage patterns for anomalies
- Cache aggressively for repeated searches
- Use field filtering to minimize costs

### API Availability Risk
- Implement circuit breakers
- Use Foursquare as automatic fallback
- Cache last-known good results
- Graceful degradation for offline scenarios

### Data Quality Risk
- Validate business hours against multiple sources
- Cross-reference store locations
- User feedback integration for corrections
- Regular data quality audits

## Timeline

### Week 1: Setup and Configuration
- [ ] Coordinate with Jeremiah on API keys
- [ ] Set up Google Places API credentials
- [ ] Configure development environment
- [ ] Create basic service structure

### Week 2: Core Implementation
- [ ] Implement Google Places integration
- [ ] Create caching layer
- [ ] Add request batching
- [ ] Basic error handling

### Week 3: Secondary Services
- [ ] Integrate Mapbox Search Box
- [ ] Implement Foursquare backup
- [ ] Create service orchestration
- [ ] Add monitoring and metrics

### Week 4: Testing and Optimization
- [ ] Performance testing
- [ ] Cost optimization
- [ ] User acceptance testing
- [ ] Documentation and deployment

## Success Criteria

✅ **Hardware stores discoverable within 10km** for 95% of user locations
✅ **Real-time business hours** available for 80% of results
✅ **Search response time** under 500ms for 95th percentile
✅ **Monthly API costs** under $1,500
✅ **99.5% uptime** with fallback mechanisms
✅ **User satisfaction** >4.0/5.0 for location suggestions

---

**Selection Status:** ✅ **APPROVED**
**Next Steps:** Coordinate with Jeremiah and begin implementation
**Timeline:** 4 weeks to full deployment
**Budget:** ~$1,475/month operational cost 