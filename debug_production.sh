#!/bin/bash

# Smart Heating Production Debug Script
# Quick access to production HA logs and debugging

PROD_HOST="root@192.168.2.2"
PROD_PORT="22222"

echo "==================================="
echo "Smart Heating Production Debug"
echo "==================================="
echo ""

# Function to show menu
show_menu() {
    echo "Select an option:"
    echo ""
    echo "=== General Logs ==="
    echo "1) View Smart Heating discovery logs"
    echo "2) Follow live logs (filtered)"
    echo "3) View all recent Smart Heating logs"
    echo ""
    echo "=== Common Issue Filters ==="
    echo "4) Temperature changes & presets (DEBUG TEMP ISSUES)"
    echo "5) Manual override mode activity"
    echo "6) Boost mode activity"
    echo "7) Switch/pump control activity"
    echo "8) Coordinator & WebSocket updates"
    echo "9) Climate controller heating decisions"
    echo ""
    echo "=== Entity Information ==="
    echo "10) View climate entities"
    echo "11) View temperature sensor entities"
    echo "12) View all area configurations"
    echo ""
    echo "=== System Status ==="
    echo "13) Check integration status"
    echo "14) View errors & warnings only"
    echo "15) SSH into production"
    echo ""
    echo "0) Exit"
    echo ""
    read -p "Choice: " choice
    echo ""
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1)
            echo "=== Device Discovery Logs ==="
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -i 'SMART HEATING.*discovery\|DISCOVERED:' | tail -50"
            echo ""
            ;;
        2)
            echo "=== Following Live Logs (Ctrl+C to stop) ==="
            ssh -p $PROD_PORT $PROD_HOST "ha core logs --follow" | grep --line-buffered -i "smart_heating\|DISCOVERED"
            ;;
        3)
            echo "=== Recent Smart Heating Logs ==="
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -i smart_heating | tail -100"
            echo ""
            ;;
        4)
            echo "=== Temperature Changes & Preset Activity ==="
            echo "Searching for: TARGET TEMP CHANGE, PRESET CHANGE, set_temperature, set_preset_mode"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -E 'TARGET TEMP CHANGE|PRESET CHANGE|Area.*Preset mode|set.*temperature.*area|Effective temp' | tail -50"
            echo ""
            echo "💡 This shows:"
            echo "  - All target temperature changes with context"
            echo "  - Preset mode changes (none → activity, etc.)"
            echo "  - Effective temperature calculations"
            echo ""
            ;;
        5)
            echo "=== Manual Override Mode Activity ==="
            echo "Searching for: manual override, MANUAL mode, thermostat changes"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -iE 'manual.?override|manual mode|Thermostat.*change.*detected|Disabling manual override' | tail -50"
            echo ""
            echo "💡 This shows:"
            echo "  - When areas enter/exit manual override mode"
            echo "  - External thermostat adjustments detected"
            echo "  - Manual override being cleared by app"
            echo ""
            ;;
        6)
            echo "=== Boost Mode Activity ==="
            echo "Searching for: boost mode, boost_temp, boost expir"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -iE 'boost.?mode|boost.*active|boost.*expir|boost.*cancel' | tail -50"
            echo ""
            echo "💡 This shows:"
            echo "  - Boost mode activation/cancellation"
            echo "  - Boost temperature settings"
            echo "  - Boost expiration checks"
            echo ""
            ;;
        7)
            echo "=== Switch/Pump Control Activity ==="
            echo "Searching for: switch shutdown, pump control, shutdown_switches"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -iE 'shutdown.*switch|switch.*shutdown|pump.*control|_async_control_switches|switch.*woonkamer.*vloerverwarming' | tail -50"
            echo ""
            echo "💡 This shows:"
            echo "  - Switch/pump on/off decisions"
            echo "  - Shutdown when idle feature activity"
            echo "  - Switch control in manual override mode"
            echo ""
            ;;
        8)
            echo "=== Coordinator & WebSocket Updates ==="
            echo "Searching for: coordinator refresh, WebSocket, state change"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -iE 'coordinator.*refresh|coordinator.*update|websocket|State change.*detected|async_request_refresh' | tail -50"
            echo ""
            echo "💡 This shows:"
            echo "  - When coordinator updates data"
            echo "  - WebSocket events and subscriptions"
            echo "  - Real-time state change detection"
            echo ""
            ;;
        9)
            echo "=== Climate Controller Heating Decisions ==="
            echo "Searching for: climate_controller, heating decisions, hysteresis"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -E 'climate_controller|Area.*heating|should.*heat|hysteresis|Triggered immediate climate control' | tail -50"
            echo ""
            echo "💡 This shows:"
            echo "  - When areas start/stop heating"
            echo "  - Temperature comparison logic"
            echo "  - Immediate heating triggers"
            echo ""
            ;;
        10)
            echo "=== Climate Entities ==="
            ssh -p $PROD_PORT $PROD_HOST "ha entity list | grep climate | head -30"
            echo ""
            echo "To see more, SSH in and run: ha entity list | grep climate"
            echo ""
            ;;
        11)
            echo "=== Temperature Sensor Entities ==="
            ssh -p $PROD_PORT $PROD_HOST "ha entity list | grep -i 'sensor.*temp'"
            echo ""
            ;;
        12)
            echo "=== Current Area Configurations ==="
            echo "Fetching from API..."
            ssh -p $PROD_PORT $PROD_HOST "curl -s http://localhost:8123/api/smart_heating/areas 2>/dev/null | python3 -m json.tool | grep -E 'id|name|enabled|target_temperature|effective_target|preset_mode|boost_mode|manual_override' | head -100"
            echo ""
            ;;
        13)
            echo "=== Integration Status ==="
            ssh -p $PROD_PORT $PROD_HOST "ha core info"
            echo ""
            ;;
        14)
            echo "=== Errors & Warnings Only ==="
            ssh -p $PROD_PORT $PROD_HOST "ha core logs | grep -E 'ERROR|WARNING' | grep -i smart_heating | tail -50"
            echo ""
            ;;
        15)
            echo "=== Opening SSH Session ==="
            echo ""
            echo "📋 Quick Reference Commands:"
            echo "  # View temperature changes:"
            echo "  ha core logs | grep 'TARGET TEMP CHANGE\\|PRESET CHANGE'"
            echo ""
            echo "  # View manual override:"
            echo "  ha core logs | grep -i 'manual override'"
            echo ""
            echo "  # View all recent logs:"
            echo "  ha core logs | grep smart_heating | tail -100"
            echo ""
            echo "  # Follow live logs:"
            echo "  ha core logs --follow | grep smart_heating"
            echo ""
            echo "  # Check area configs:"
            echo "  curl -s http://localhost:8123/api/smart_heating/areas | python3 -m json.tool"
            echo ""
            ssh -p $PROD_PORT $PROD_HOST
            ;;
        0)
            echo "Goodbye!"
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            echo ""
            ;;
    esac
    
    read -p "Press Enter to continue..."
    echo ""
done
