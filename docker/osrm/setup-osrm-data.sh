#!/bin/bash

# TradeFlow OSRM Data Setup Script
# Downloads and preprocesses North America OSM data for OSRM routing

set -e

# Configuration
OSRM_DATA_DIR="./docker/osrm/data"
GEOFABRIK_URL="https://download.geofabrik.de/north-america-latest.osm.pbf"
OSM_FILE="north-america-latest.osm.pbf"
OSRM_FILE="north-america-latest.osrm"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗺️  TradeFlow OSRM Data Setup${NC}"
echo "=================================="

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Create data directory if it doesn't exist
mkdir -p "$OSRM_DATA_DIR"
cd "$OSRM_DATA_DIR"

echo -e "${YELLOW}📁 Data directory: $(pwd)${NC}"

# Check if processed data already exists
if [ -f "$OSRM_FILE" ]; then
    echo -e "${GREEN}✅ Processed OSRM data already exists: $OSRM_FILE${NC}"
    echo -e "${YELLOW}💡 To refresh data, delete this file and run setup again${NC}"
    exit 0
fi

# Download OSM data if not exists
if [ ! -f "$OSM_FILE" ]; then
    echo -e "${YELLOW}📥 Downloading North America OSM data (~8GB)...${NC}"
    echo "This may take 10-30 minutes depending on your internet connection"
    
    if command -v wget >/dev/null 2>&1; then
        wget -c "$GEOFABRIK_URL" -O "$OSM_FILE"
    elif command -v curl >/dev/null 2>&1; then
        curl -L -C - -o "$OSM_FILE" "$GEOFABRIK_URL"
    else
        echo -e "${RED}❌ Neither wget nor curl found. Please install one of them.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Download completed: $OSM_FILE${NC}"
else
    echo -e "${GREEN}✅ OSM data already exists: $OSM_FILE${NC}"
fi

# Preprocess data using OSRM
echo -e "${YELLOW}⚙️  Preprocessing OSM data for OSRM...${NC}"
echo "This will take 15-45 minutes depending on your system"

# Extract
echo "1️⃣ Extracting street network..."
docker run --rm -v "$(pwd):/data" osrm/osrm-backend:latest \
    osrm-extract -p /opt/car.lua /data/$OSM_FILE

# Partition
echo "2️⃣ Partitioning graph..."
docker run --rm -v "$(pwd):/data" osrm/osrm-backend:latest \
    osrm-partition /data/$OSRM_FILE

# Customize
echo "3️⃣ Customizing for routing..."
docker run --rm -v "$(pwd):/data" osrm/osrm-backend:latest \
    osrm-customize /data/$OSRM_FILE

echo -e "${GREEN}✅ OSRM data preprocessing completed!${NC}"

# List generated files
echo -e "${YELLOW}📋 Generated files:${NC}"
ls -lh *.osrm*

echo ""
echo -e "${GREEN}🚀 Setup complete! You can now start the routing services:${NC}"
echo "   docker-compose up -d"
echo ""
echo -e "${YELLOW}💡 OSRM will be available at: http://localhost:5001${NC}"
echo -e "${YELLOW}💡 VROOM will be available at: http://localhost:3000${NC}" 