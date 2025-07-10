# 🚀 TradeFlow Routing Engine Deployment Guide

This guide provides step-by-step instructions for deploying the TradeFlow routing engine with real VROOM/OSRM integration.

## 📋 Prerequisites

### System Requirements
- **RAM:** Minimum 16GB (32GB recommended for optimal performance)
- **Storage:** 50GB+ free space for OSRM data
- **CPU:** Multi-core processor recommended
- **Docker:** Version 20.10+ with Docker Compose

### Software Dependencies
- Docker and Docker Compose
- Node.js 18+ (for testing)
- curl or wget (for data download)

## 🔧 Phase 2 Implementation Steps

### Step 1: Clone and Setup Repository

```bash
# Clone the repository
git clone <repository-url>
cd tradeflow

# Install dependencies
npm install
```

### Step 2: Set Up OSRM Data

The OSRM backend requires preprocessed map data. Use the automated setup script:

```bash
# Make setup script executable
chmod +x docker/osrm/setup-osrm-data.sh

# Download and preprocess North America OSM data
# This will take 10-30 minutes for download + 15-45 minutes for preprocessing
./docker/osrm/setup-osrm-data.sh
```

**What this script does:**
1. Downloads North America OSM data (~8GB)
2. Preprocesses data using OSRM Docker containers
3. Generates optimized routing files

### Step 3: Build VROOM Container

Build the VROOM container with the compiled binary:

```bash
# Build the VROOM image with real binary
docker-compose build vroom

# This will:
# - Download VROOM source code
# - Compile the binary in a multi-stage build
# - Create production-ready container
```

### Step 4: Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### Step 5: Verify Deployment

Run the comprehensive test suite:

```bash
# Test VROOM integration
npm run test:vroom

# Or run the basic validation
node validation-test.js
```

## 🔍 Verification Checklist

### ✅ Service Health Checks

```bash
# Check VROOM service
curl http://localhost:3000/health

# Check OSRM service (may take 60+ seconds to start)
curl "http://localhost:5001/route/v1/driving/-97.7431,30.2672;-97.7431,30.3072"
```

### ✅ Expected Responses

**VROOM Health Check:**
```json
{
  "status": "healthy",
  "vroom_available": true,
  "osrm_url": "http://osrm:5000"
}
```

**VROOM Routing Response:**
```json
{
  "code": 0,
  "routes": [...],
  "metadata": {
    "vroom_binary_used": true,
    "execution_time_ms": 1500
  }
}
```

## 🧪 Testing Scenarios

### Basic Routing Test

```bash
# Test with realistic Austin plumbing job data
curl -X POST http://localhost:3000/vroom \
  -H "Content-Type: application/json" \
  -d '{
    "jobs": [
      {
        "id": 1,
        "location": [-97.7431, 30.2672],
        "service": 3600
      }
    ],
    "vehicles": [
      {
        "id": 1,
        "start": [-97.7431, 30.2672],
        "end": [-97.7431, 30.2672]
      }
    ]
  }'
```

### Performance Benchmarks

The system should meet these performance criteria:

- **VROOM Response Time:** < 2 seconds
- **OSRM Query Time:** < 500ms
- **Total Workflow Time:** < 5 seconds

## 🐛 Troubleshooting

### Common Issues

#### "VROOM binary not found"
**Symptoms:** `vroom_available: false` in health check
**Solution:**
```bash
# Rebuild VROOM container
docker-compose build --no-cache vroom
docker-compose up -d
```

#### "OSRM container exits immediately"
**Symptoms:** OSRM service not responding
**Solution:**
```bash
# Check if OSRM data exists
ls -la docker/osrm/data/

# If no .osrm files, run setup script
./docker/osrm/setup-osrm-data.sh

# Restart services
docker-compose restart osrm
```

#### "Out of memory" during preprocessing
**Symptoms:** OSRM preprocessing fails
**Solution:**
```bash
# Increase Docker memory limit to 8GB+
# Or use smaller geographic region:
# Edit docker/osrm/setup-osrm-data.sh
# Change to: texas-latest.osm.pbf (smaller file)
```

#### "Request timeout" on routing
**Symptoms:** VROOM requests time out
**Solution:**
```bash
# Check container logs
docker-compose logs vroom
docker-compose logs osrm

# Restart services
docker-compose restart
```

### Service Status Commands

```bash
# Check all container logs
docker-compose logs

# Check specific service
docker-compose logs vroom
docker-compose logs osrm

# Check container resource usage
docker stats

# Restart specific service
docker-compose restart vroom
```

## 📊 Performance Monitoring

### Resource Usage

Monitor system resources during operation:

```bash
# Monitor memory usage
docker stats --no-stream

# Monitor disk usage
df -h

# Monitor OSRM memory usage specifically
docker exec -it <osrm-container> ps aux
```

### Response Time Monitoring

```bash
# Automated performance test
npm run test:vroom

# Manual timing test
time curl -X POST http://localhost:3000/vroom -d @test-data.json
```

## 🔄 Maintenance

### Regular Updates

#### Update OSRM Data (Monthly/Quarterly)
```bash
# Remove old data
rm -rf docker/osrm/data/*

# Download fresh data
./docker/osrm/setup-osrm-data.sh

# Restart services
docker-compose restart osrm
```

#### Update VROOM Binary
```bash
# Pull latest VROOM version
docker-compose build --no-cache vroom

# Update services
docker-compose up -d
```

### Backup Strategy

```bash
# Backup preprocessed OSRM data
tar -czf osrm-data-backup.tar.gz docker/osrm/data/

# Backup configuration
cp docker-compose.yml docker-compose.yml.backup
```

## 🚀 Production Deployment

### Infrastructure Requirements

**Minimum Production Setup:**
- 16GB RAM
- 100GB SSD storage
- 2-4 CPU cores
- Reliable internet connection

**Recommended Production Setup:**
- 32GB RAM
- 200GB+ SSD storage
- 4-8 CPU cores
- Load balancer for high availability

### Environment Variables

```bash
# Production environment variables
export VROOM_API_URL=https://your-domain.com:3000
export OSRM_URL=http://osrm:5000
export NODE_ENV=production
```

### Security Considerations

1. **Firewall Rules:** Restrict access to VROOM/OSRM ports
2. **SSL/TLS:** Use HTTPS for production deployments
3. **Authentication:** Implement API authentication if needed
4. **Monitoring:** Set up logging and alerting

### Scalability Options

1. **Horizontal Scaling:** Deploy multiple VROOM instances
2. **Geographic Distribution:** Use regional OSRM data
3. **Container Orchestration:** Kubernetes deployment
4. **External Data:** Host OSRM data on CDN

## 📝 Success Criteria

Phase 2 is complete when:

- ✅ VROOM binary compiles and executes successfully
- ✅ OSRM backend responds with real routing data
- ✅ Response times meet <2 second requirement
- ✅ All constraint handling works (time windows, capacity, breaks)
- ✅ Agent integration works seamlessly
- ✅ Tests pass with `vroom_binary_used: true`

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Run the test suite: `npm run test:vroom`
4. Check system resources: `docker stats`

## 📚 Additional Resources

- [VROOM Documentation](https://github.com/VROOM-Project/vroom)
- [OSRM Documentation](https://project-osrm.org/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [TradeFlow Project Overview](_docs/project-overview.md) 