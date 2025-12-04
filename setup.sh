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
MQTT_CONTAINER="mosquitto-test"
NETWORK_NAME="ha-network"
HA_CONFIG_DIR="$(pwd)/ha-config"
FRONTEND_DIR="$(pwd)/custom_components/smart_heating/frontend"
INTEGRATION_DIR="$(pwd)/custom_components/smart_heating"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Smart Heating - Complete Setup Script                  ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Clean up everything
echo -e "${YELLOW}[1/9]${NC} Cleaning up existing setup..."
echo "  Stopping and removing containers..."
for container in "$HA_CONTAINER" "$MQTT_CONTAINER"; do
    if docker ps -a | grep -q "$container"; then
        docker rm -f "$container" > /dev/null 2>&1
        echo -e "  ${GREEN}✓${NC} Removed $container"
    fi
done

echo "  Removing Docker network..."
if docker network ls | grep -q "$NETWORK_NAME"; then
    docker network rm "$NETWORK_NAME" > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Removed network $NETWORK_NAME"
fi

echo "  Clearing Home Assistant data..."
if [ -d "$HA_CONFIG_DIR" ]; then
    rm -rf "$HA_CONFIG_DIR"
    echo -e "  ${GREEN}✓${NC} Removed $HA_CONFIG_DIR"
fi

echo "  Pulling latest Docker images..."
docker pull eclipse-mosquitto:latest > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Pulled mosquitto:latest"
docker pull ghcr.io/home-assistant/home-assistant:stable > /dev/null 2>&1
echo -e "  ${GREEN}✓${NC} Pulled home-assistant:stable"
echo ""

# Step 2: Create Docker network
echo -e "${YELLOW}[2/9]${NC} Creating Docker network..."
docker network create "$NETWORK_NAME" > /dev/null
echo -e "${GREEN}✓${NC} Network created: $NETWORK_NAME"
echo ""

# Step 3: Start Mosquitto MQTT broker
echo -e "${YELLOW}[3/9]${NC} Starting Mosquitto MQTT broker..."
docker run -d \
    --name "$MQTT_CONTAINER" \
    --network "$NETWORK_NAME" \
    eclipse-mosquitto:latest \
    mosquitto -c /mosquitto-no-auth.conf > /dev/null

if docker ps | grep -q "$MQTT_CONTAINER"; then
    echo -e "${GREEN}✓${NC} Mosquitto started successfully"
    sleep 2
else
    echo -e "${RED}✗${NC} Failed to start Mosquitto"
    exit 1
fi
echo ""

# Step 4: Prepare Home Assistant config directory
echo -e "${YELLOW}[4/9]${NC} Preparing Home Assistant configuration..."
mkdir -p "$HA_CONFIG_DIR"
cat > "$HA_CONFIG_DIR/configuration.yaml" << 'EOF'
# Loads default set of integrations. Do not remove.
default_config:

# Load frontend themes from the themes folder
frontend:
  themes: !include_dir_merge_named themes

automation: !include automations.yaml
script: !include scripts.yaml
scene: !include scenes.yaml
EOF

touch "$HA_CONFIG_DIR/automations.yaml"
touch "$HA_CONFIG_DIR/scripts.yaml"
touch "$HA_CONFIG_DIR/scenes.yaml"
echo -e "${GREEN}✓${NC} Configuration directory prepared"
echo ""

# Step 5: Build frontend
echo -e "${YELLOW}[5/9]${NC} Building frontend..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install > /dev/null 2>&1
    fi
    
    echo "  Building React app..."
    if npm run build > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend built successfully ($(du -sh dist | cut -f1))"
    else
        echo -e "${RED}✗${NC} Frontend build failed"
        exit 1
    fi
    
    cd - > /dev/null
else
    echo -e "${YELLOW}⚠${NC}  Frontend directory not found, skipping build"
fi
echo ""

# Step 6: Deploy integration to HA config
echo -e "${YELLOW}[6/9]${NC} Deploying integration to Home Assistant config..."
mkdir -p "$HA_CONFIG_DIR/custom_components/smart_heating"

# Copy Python files
rsync -a --exclude='frontend/node_modules' \
         --exclude='frontend/src' \
         --exclude='__pycache__' \
         "$INTEGRATION_DIR/" \
         "$HA_CONFIG_DIR/custom_components/smart_heating/" > /dev/null

echo -e "${GREEN}✓${NC} Integration deployed to $HA_CONFIG_DIR"
echo ""

# Step 7: Start Home Assistant
echo -e "${YELLOW}[7/9]${NC} Starting Home Assistant..."
docker run -d \
    --name "$HA_CONTAINER" \
    --network "$NETWORK_NAME" \
    -p 8123:8123 \
    -v "$HA_CONFIG_DIR:/config" \
    --privileged \
    ghcr.io/home-assistant/home-assistant:stable > /dev/null

if docker ps | grep -q "$HA_CONTAINER"; then
    echo -e "${GREEN}✓${NC} Home Assistant started successfully"
    echo "  Waiting for Home Assistant to initialize (30 seconds)..."
    sleep 30
else
    echo -e "${RED}✗${NC} Failed to start Home Assistant"
    exit 1
fi
echo ""

# Step 8: User action required
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    ACTION REQUIRED                             ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Please complete the following steps manually:                ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}                                                                ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} 1. Open http://localhost:8123 in your browser                 ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} 2. Complete Home Assistant onboarding:                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Create user account                                      ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Set location and timezone                                ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Create areas: Living Room, Kitchen, Bedroom              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} 3. Add MQTT integration:                                      ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Settings → Devices & Services → Add Integration          ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Search for 'MQTT'                                        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Broker: mosquitto-test                                   ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Port: 1883                                               ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Leave username/password empty                            ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} 4. Add Smart Heating integration:                             ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Settings → Devices & Services → Add Integration          ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Search for 'Smart Heating'                               ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}    - Complete setup                                           ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}                                                                ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
read -p "Press ENTER when you have completed the above steps..."
echo ""

# Step 9: Populate MQTT devices
echo -e "${YELLOW}[8/9]${NC} Creating MQTT test devices..."
echo "  Publishing device discovery messages..."

# Function to publish MQTT message
mqtt_pub() {
    local topic="$1"
    local payload="$2"
    docker exec "$MQTT_CONTAINER" mosquitto_pub \
        -h localhost \
        -t "$topic" \
        -m "$payload" \
        -r > /dev/null 2>&1
}

# Living Room devices
echo "  → Living Room devices..."
mqtt_pub "homeassistant/climate/living_room_thermostat/config" '{
  "name": "Living Room Thermostat",
  "unique_id": "living_room_thermostat",
  "temperature_command_topic": "living_room/thermostat/target_temp",
  "temperature_state_topic": "living_room/thermostat/target_temp",
  "current_temperature_topic": "living_room/temperature",
  "mode_command_topic": "living_room/thermostat/mode",
  "mode_state_topic": "living_room/thermostat/mode",
  "modes": ["off", "heat"],
  "temp_step": 0.5,
  "min_temp": 5,
  "max_temp": 30
}'
mqtt_pub "living_room/thermostat/target_temp" "20.0"
mqtt_pub "living_room/thermostat/mode" "heat"

mqtt_pub "homeassistant/sensor/living_room_temperature/config" '{
  "name": "Living Room Temperature",
  "unique_id": "living_room_temperature",
  "state_topic": "living_room/temperature",
  "unit_of_measurement": "°C",
  "device_class": "temperature"
}'
mqtt_pub "living_room/temperature" "19.5"

mqtt_pub "homeassistant/number/living_room_valve/config" '{
  "name": "Living Room Valve Position",
  "unique_id": "living_room_valve_position",
  "command_topic": "living_room/valve/set",
  "state_topic": "living_room/valve/position",
  "min": 0,
  "max": 100,
  "unit_of_measurement": "%"
}'
mqtt_pub "living_room/valve/position" "45"

# Kitchen devices
echo "  → Kitchen devices..."
mqtt_pub "homeassistant/climate/kitchen_thermostat/config" '{
  "name": "Kitchen Thermostat",
  "unique_id": "kitchen_thermostat",
  "temperature_command_topic": "kitchen/thermostat/target_temp",
  "temperature_state_topic": "kitchen/thermostat/target_temp",
  "current_temperature_topic": "kitchen/temperature",
  "mode_command_topic": "kitchen/thermostat/mode",
  "mode_state_topic": "kitchen/thermostat/mode",
  "modes": ["off", "heat"],
  "temp_step": 0.5,
  "min_temp": 5,
  "max_temp": 30
}'
mqtt_pub "kitchen/thermostat/target_temp" "21.0"
mqtt_pub "kitchen/thermostat/mode" "heat"

mqtt_pub "homeassistant/sensor/kitchen_temperature/config" '{
  "name": "Kitchen Temperature",
  "unique_id": "kitchen_temperature",
  "state_topic": "kitchen/temperature",
  "unit_of_measurement": "°C",
  "device_class": "temperature"
}'
mqtt_pub "kitchen/temperature" "20.5"

# Bedroom devices
echo "  → Bedroom devices..."
mqtt_pub "homeassistant/climate/bedroom_thermostat/config" '{
  "name": "Bedroom Thermostat",
  "unique_id": "bedroom_thermostat",
  "temperature_command_topic": "bedroom/thermostat/target_temp",
  "temperature_state_topic": "bedroom/thermostat/target_temp",
  "current_temperature_topic": "bedroom/temperature",
  "mode_command_topic": "bedroom/thermostat/mode",
  "mode_state_topic": "bedroom/thermostat/mode",
  "modes": ["off", "heat"],
  "temp_step": 0.5,
  "min_temp": 5,
  "max_temp": 30
}'
mqtt_pub "bedroom/thermostat/target_temp" "18.5"
mqtt_pub "bedroom/thermostat/mode" "heat"

mqtt_pub "homeassistant/sensor/bedroom_temperature/config" '{
  "name": "Bedroom Temperature",
  "unique_id": "bedroom_temperature",
  "state_topic": "bedroom/temperature",
  "unit_of_measurement": "°C",
  "device_class": "temperature"
}'
mqtt_pub "bedroom/temperature" "18.5"

mqtt_pub "homeassistant/number/bedroom_valve/config" '{
  "name": "Bedroom Valve Position",
  "unique_id": "bedroom_valve_position",
  "command_topic": "bedroom/valve/set",
  "state_topic": "bedroom/valve/position",
  "min": 0,
  "max": 100,
  "unit_of_measurement": "%"
}'
mqtt_pub "bedroom/valve/position" "30"

echo -e "${GREEN}✓${NC} Created 9 MQTT devices (3 per area)"
echo ""

# Step 10: Restart Home Assistant to discover devices
echo -e "${YELLOW}[9/9]${NC} Restarting Home Assistant to discover devices..."
docker restart "$HA_CONTAINER" > /dev/null
echo "  Waiting for restart (20 seconds)..."
sleep 20
echo -e "${GREEN}✓${NC} Home Assistant restarted"
echo ""

# Final summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    SETUP COMPLETE!                             ║${NC}"
echo -e "${GREEN}╠════════════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║${NC} Home Assistant: http://localhost:8123                         ${GREEN}║${NC}"
echo -e "${GREEN}║${NC} Mosquitto MQTT: mosquitto-test:1883                           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC} Created devices:                                               ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   Living Room: Thermostat, Temp Sensor, Valve                 ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   Kitchen: Thermostat, Temp Sensor                             ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   Bedroom: Thermostat, Temp Sensor, Valve                     ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC} Next Steps:                                                    ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   1. Open Smart Heating panel in sidebar                      ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   2. Click on an area (Living Room/Kitchen/Bedroom)           ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   3. Drag devices from right panel to assign them             ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   4. Add schedules in the Schedule tab                        ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}   5. Watch automatic heating control (30s intervals)          ${GREEN}║${NC}"
echo -e "${GREEN}║${NC}                                                                ${GREEN}║${NC}"
echo -e "${GREEN}║${NC} Night boost: Adds 0.5°C between 22:00-06:00                   ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}View logs:${NC} docker logs -f $HA_CONTAINER"
echo -e "${BLUE}Stop:${NC} docker stop $HA_CONTAINER $MQTT_CONTAINER"
echo ""
