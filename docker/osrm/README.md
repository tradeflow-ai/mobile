# OSRM Data Setup

This directory contains the setup and data files for the OSRM (Open Source Routing Machine) backend used by TradeFlow's routing engine.

## 🚀 Quick Setup

Run the automated setup script to download and preprocess North America OSM data:

```bash
./docker/osrm/setup-osrm-data.sh
```

This script will:
1. Download North America OSM data (~8GB)
2. Preprocess it for OSRM routing
3. Generate optimized routing files

**Time Requirements:**
- Download: 10-30 minutes (depending on internet speed)
- Preprocessing: 15-45 minutes (depending on system performance)

## 📁 Directory Structure

```
docker/osrm/
├── README.md                    # This file
├── setup-osrm-data.sh         # Automated setup script
└── data/                       # OSRM data directory (created by setup)
    ├── north-america-latest.osm.pbf    # Raw OSM data (~8GB)
    ├── north-america-latest.osrm       # Main routing graph
    ├── north-america-latest.osrm.cnbg  # Contraction hierarchies
    ├── north-america-latest.osrm.edges # Graph edges
    ├── north-america-latest.osrm.geometry # Route geometry
    ├── north-america-latest.osrm.nodes # Graph nodes
    └── ... (other OSRM files)
```

## 🔧 Manual Setup (Advanced)

If you prefer manual setup or need custom regions:

### 1. Download OSM Data

```bash
cd docker/osrm/data
curl -L -o north-america-latest.osm.pbf https://download.geofabrik.de/north-america-latest.osm.pbf
```

### 2. Preprocess with OSRM

```bash
# Extract
docker run --rm -v "$(pwd):/data" osrm/osrm-backend:latest \
    osrm-extract -p /opt/car.lua /data/north-america-latest.osm.pbf

# Partition  
docker run --rm -v "$(pwd):/data" osrm/osrm-backend:latest \
    osrm-partition /data/north-america-latest.osrm

# Customize
docker run --rm -v "$(pwd):/data" osrm/osrm-backend:latest \
    osrm-customize /data/north-america-latest.osrm
```

## 🌍 Alternative Regions

To use different geographic regions, replace the download URL:

- **US Only:** `https://download.geofabrik.de/north-america/us-latest.osm.pbf`
- **Europe:** `https://download.geofabrik.de/europe-latest.osm.pbf`
- **Specific States:** `https://download.geofabrik.de/north-america/us/texas-latest.osm.pbf`

Update the filenames in `docker-compose.yml` accordingly.

## 🚀 Testing OSRM

Once setup is complete, test the OSRM service:

```bash
# Start services
docker-compose up -d

# Test OSRM API (after ~60 seconds startup time)
curl "http://localhost:5001/route/v1/driving/-122.4194,37.7749;-122.4094,37.7849?overview=false"
```

## 📊 System Requirements

**Minimum:**
- 16GB RAM (for North America data)
- 50GB free disk space
- Docker and Docker Compose

**Recommended:**
- 32GB RAM for better performance
- SSD storage for faster preprocessing
- Multi-core CPU for parallel processing

## 🔧 Troubleshooting

**Issue: "No space left on device"**
- Solution: Ensure 50GB+ free space before starting

**Issue: "Cannot allocate memory"**
- Solution: Increase Docker memory limit to 8GB+

**Issue: OSRM container exits immediately**
- Check: Ensure all `.osrm*` files exist in data directory
- Check: Verify file permissions and Docker volume mounts

**Issue: Preprocessing takes too long**
- Normal: Can take up to 45 minutes on slower systems
- Tip: Use SSD storage and increase Docker CPU allocation

## 📝 Notes

- OSRM data should be updated periodically (monthly/quarterly) for accurate routing
- The preprocessing step only needs to be run once per data update
- Generated files are platform-independent and can be copied between systems
- For production deployment, consider hosting preprocessed data files externally 