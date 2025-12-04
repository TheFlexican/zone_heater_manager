#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HA_CONTAINER="homeassistant-test"
INTEGRATION_DIR="custom_components/smart_heating"
FRONTEND_DIR="$INTEGRATION_DIR/frontend"

echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Smart Heating - Sync Script${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
echo ""

# Check if container is running
if ! docker ps | grep -q "$HA_CONTAINER"; then
    echo -e "${RED}✗${NC} Container '$HA_CONTAINER' is not running"
    echo "  Run './setup.sh' first to start the container"
    exit 1
fi

echo -e "${YELLOW}[1/4]${NC} Building frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install --silent
    fi
    
    # Build frontend
    echo "  Building React app..."
    npm run build --silent
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}✗${NC} Frontend build failed - dist directory not found"
        exit 1
    fi
    
    cd - > /dev/null
    echo -e "${GREEN}✓${NC} Frontend built successfully"
else
    echo -e "${RED}✗${NC} Frontend directory not found: $FRONTEND_DIR"
    exit 1
fi
echo ""

echo -e "${YELLOW}[2/4]${NC} Syncing backend Python files..."
# Sync all Python files and YAML files
docker exec "$HA_CONTAINER" mkdir -p /config/custom_components/smart_heating

# Copy Python files
for file in "$INTEGRATION_DIR"/*.py; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        docker cp "$file" "$HA_CONTAINER:/config/custom_components/smart_heating/$filename"
        echo "  → $filename"
    fi
done

# Copy YAML and JSON files
for ext in yaml json; do
    for file in "$INTEGRATION_DIR"/*.$ext; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            docker cp "$file" "$HA_CONTAINER:/config/custom_components/smart_heating/$filename"
            echo "  → $filename"
        fi
    done
done

echo -e "${GREEN}✓${NC} Backend files synced"
echo ""

echo -e "${YELLOW}[3/4]${NC} Syncing frontend dist..."
# Remove old dist and copy new one
docker exec "$HA_CONTAINER" rm -rf /config/custom_components/smart_heating/frontend/dist
docker exec "$HA_CONTAINER" mkdir -p /config/custom_components/smart_heating/frontend
docker cp "$FRONTEND_DIR/dist" "$HA_CONTAINER:/config/custom_components/smart_heating/frontend/dist"

# Count files in dist
file_count=$(find "$FRONTEND_DIR/dist" -type f | wc -l | tr -d ' ')
echo "  → Synced $file_count frontend files"
echo -e "${GREEN}✓${NC} Frontend synced"
echo ""

echo -e "${YELLOW}[4/4]${NC} Restarting Home Assistant..."
docker restart "$HA_CONTAINER" > /dev/null

echo "  Waiting for restart (20 seconds)..."
sleep 20

# Check if container is running
if docker ps | grep -q "$HA_CONTAINER"; then
    echo -e "${GREEN}✓${NC} Home Assistant restarted successfully"
else
    echo -e "${RED}✗${NC} Home Assistant failed to restart"
    echo "  Check logs: docker logs -f $HA_CONTAINER"
    exit 1
fi
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Sync Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Changes synced:${NC}"
echo "  ✓ Backend Python files (.py)"
echo "  ✓ Configuration files (.yaml, .json)"
echo "  ✓ Frontend build (dist/)"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  • Open http://localhost:8123"
echo "  • Clear browser cache (Cmd+Shift+R / Ctrl+Shift+R)"
echo "  • Check logs: docker logs -f $HA_CONTAINER"
echo ""
