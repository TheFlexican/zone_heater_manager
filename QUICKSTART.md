# Quick Start Guide

Get Smart Heating running in 5 minutes!

## Prerequisites

- Home Assistant OS/Supervised
- SSH access
- Node.js 18+ installed

## Installation (3 steps)

### 1. Install Integration

```bash
# SSH to Home Assistant
ssh -p 22222 root@homeassistant.local

# Clone repository
cd /config/custom_components
git clone https://github.com/TheFlexican/smart_heating.git temp
mv temp/custom_components/smart_heating .
rm -rf temp
```

### 2. Build Frontend

```bash
cd /config/custom_components/smart_heating
./build_frontend.sh
```

### 3. Restart & Add Integration

```bash
ha core restart
```

Then:
1. Go to **Settings** → **Devices & Services**
2. Click **+ ADD INTEGRATION**
3. Search for **Smart Heating**
4. Click to add

## Access the Interface

The **Smart Heating** panel appears automatically in your Home Assistant sidebar with a radiator icon 🔥

Or navigate to: `http://your-ha-instance:8123/smart_heating/`

## Create Your First Area

1. Click **+ Create Area** in the web interface
2. Enter area name (e.g., "Living Room")
3. Set initial temperature
4. Click **Create**

## Set Up Your First Schedule

1. Click on your area to open the detail page
2. Navigate to the **Schedule** tab
3. Click **+ Add Schedule**
4. Set time (e.g., "07:00"), temperature (e.g., 21°C)
5. Select days of week (optional)
6. Click **Add**

## Configure Night Boost (Optional)

1. In area detail, go to **Settings** tab
2. Toggle **Enable Night Boost**
3. Adjust temperature offset (default: +0.5°C)
4. Night boost activates 22:00-06:00 automatically

## Next Steps

- Configure MQTT/Zigbee2MQTT for device discovery
- Drag and drop devices to your areas
- View temperature history in the **History** tab
- Create automations using the climate entities and services
- Explore the REST API for advanced integrations

## Need Help?

- Read [INSTALL.md](INSTALL.md) for detailed installation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system
- See [DEVELOPER.md](DEVELOPER.md) for development info
- Visit [GitHub Issues](https://github.com/TheFlexican/smart_heating/issues)

## Key Features

✅ **Automatic Sidebar Panel** - No manual configuration needed
✅ **Modern Web UI** - React-based interface with Material Design
✅ **Real-time Updates** - WebSocket-powered instant feedback
✅ **Smart Scheduling** - Time-based temperature profiles
✅ **Night Boost** - Automatic temperature increase at night
✅ **Temperature History** - Interactive charts (7-day retention)
✅ **Drag & Drop** - Easy device assignment
✅ **Advanced Settings** - Hysteresis, limits, fine-tuning
✅ **Temperature Sliders** - Visual control (5-30°C)
✅ **Area Management** - Create, delete, enable/disable areas
✅ **Climate Entities** - Full Home Assistant integration
✅ **14 Service Calls** - Comprehensive automation API

Happy heating! 🔥
