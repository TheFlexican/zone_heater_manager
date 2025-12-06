"""DataUpdateCoordinator for the Smart Heating integration."""
import asyncio
import logging
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant, Event, callback
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.const import ATTR_ENTITY_ID

from .const import DOMAIN, STATE_INITIALIZED, UPDATE_INTERVAL
from .area_manager import AreaManager

_LOGGER = logging.getLogger(__name__)

# Debounce delay for manual temperature changes (in seconds)
MANUAL_TEMP_CHANGE_DEBOUNCE = 2.0


class SmartHeatingCoordinator(DataUpdateCoordinator):
    """Class to manage fetching Smart Heating data."""

    def __init__(self, hass: HomeAssistant, area_manager: AreaManager) -> None:
        """Initialize the coordinator.
        
        Args:
            hass: Home Assistant instance
            area_manager: Zone manager instance
        """
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=UPDATE_INTERVAL,
        )
        self.area_manager = area_manager
        self._unsub_state_listener = None
        self._debounce_tasks = {}  # Track debounce tasks per entity
        _LOGGER.debug("Smart Heating coordinator initialized")

    async def async_setup(self) -> None:
        """Set up the coordinator with state change listeners."""
        _LOGGER.debug("Coordinator async_setup called")
        # Get all device entity IDs that we need to track
        tracked_entities = []
        areas = self.area_manager.get_all_areas()
        _LOGGER.warning("Found %d areas to process", len(areas))
        for area in areas.values():
            for device_id in area.devices.keys():
                tracked_entities.append(device_id)
        
        if tracked_entities:
            _LOGGER.warning("Setting up state change listeners for %d devices: %s", len(tracked_entities), tracked_entities[:5])
            self._unsub_state_listener = async_track_state_change_event(
                self.hass,
                tracked_entities,
                self._handle_state_change
            )
            _LOGGER.warning("State change listeners successfully registered")
        else:
            _LOGGER.warning("No devices found to track for state changes")
        
        # Do initial update
        await self.async_refresh()
        _LOGGER.debug("Coordinator async_setup completed")

    @callback
    def _handle_state_change(self, event: Event) -> None:
        """Handle state changes of tracked entities.
        
        Args:
            event: State change event
        """
        entity_id = event.data.get("entity_id")
        old_state = event.data.get("old_state")
        new_state = event.data.get("new_state")
        
        if not new_state:
            return
        
        # Only trigger update for relevant changes
        should_update = False
        
        if old_state is None:
            # Initial state, trigger update
            should_update = True
        elif old_state.state != new_state.state:
            # State changed
            should_update = True
            _LOGGER.debug("State changed for %s: %s -> %s", entity_id, old_state.state, new_state.state)
        elif old_state.attributes.get('temperature') != new_state.attributes.get('temperature'):
            # Target temperature changed (for thermostats)
            # Debounce this to handle rapid changes (e.g., Google Nest dial turning)
            new_temp = new_state.attributes.get('temperature')
            old_temp = old_state.attributes.get('temperature')
            
            _LOGGER.warning(
                "Thermostat temperature change detected for %s: %s -> %s (debouncing)",
                entity_id,
                old_temp,
                new_temp
            )
            
            # Cancel any existing debounce task for this entity
            if entity_id in self._debounce_tasks:
                self._debounce_tasks[entity_id].cancel()
            
            # Create new debounced task
            async def debounced_temp_update():
                """Update area after debounce delay."""
                try:
                    await asyncio.sleep(MANUAL_TEMP_CHANGE_DEBOUNCE)
                    
                    _LOGGER.warning(
                        "Applying debounced temperature change for %s: %s",
                        entity_id,
                        new_temp
                    )
                    
                    # Update area target temperature AND set manual override flag
                    for area in self.area_manager.get_all_areas().values():
                        if entity_id in area.devices:
                            _LOGGER.warning(
                                "Area %s entering MANUAL OVERRIDE mode - app will not control temperature until re-enabled",
                                area.name
                            )
                            area.target_temperature = new_temp
                            area.manual_override = True  # Enter manual override mode
                            # Save to storage so it persists across restarts
                            await self.area_manager.async_save()
                            break
                    
                    # Force immediate coordinator refresh after debounce (not rate-limited)
                    _LOGGER.debug("Forcing coordinator refresh after debounce")
                    await self.async_refresh()
                    _LOGGER.debug("Coordinator refresh completed")
                    
                except asyncio.CancelledError:
                    _LOGGER.warning("Debounce task cancelled for %s", entity_id)
                    raise
                except Exception as err:
                    _LOGGER.error("Error in debounced temperature update: %s", err, exc_info=True)
                finally:
                    # Clean up task reference
                    if entity_id in self._debounce_tasks:
                        del self._debounce_tasks[entity_id]
            
            # Store and start the debounce task
            self._debounce_tasks[entity_id] = self.hass.async_create_task(debounced_temp_update())
            
            # Don't trigger immediate update - wait for debounce
            should_update = False
        elif old_state.attributes.get('current_temperature') != new_state.attributes.get('current_temperature'):
            # Current temperature changed
            should_update = True
            _LOGGER.debug(
                "Current temperature changed for %s: %s -> %s",
                entity_id,
                old_state.attributes.get('current_temperature'),
                new_state.attributes.get('current_temperature')
            )
        elif old_state.attributes.get('hvac_action') != new_state.attributes.get('hvac_action'):
            # HVAC action changed (heating/idle/off)
            should_update = True
            _LOGGER.info(
                "HVAC action changed for %s: %s -> %s",
                entity_id,
                old_state.attributes.get('hvac_action'),
                new_state.attributes.get('hvac_action')
            )
        
        if should_update:
            # Trigger immediate coordinator update
            _LOGGER.debug("Triggering coordinator refresh for %s", entity_id)
            self.hass.async_create_task(self.async_request_refresh())

    async def async_shutdown(self) -> None:
        """Shutdown coordinator and clean up listeners."""
        if self._unsub_state_listener:
            self._unsub_state_listener()
            self._unsub_state_listener = None
        _LOGGER.debug("Smart Heating coordinator shutdown")

    async def _async_update_data(self) -> dict:
        """Fetch data from the integration.
        
        This is the place to fetch and process the data from your source.
        Updates area temperatures from MQTT devices.
        
        Returns:
            dict: Dictionary containing the current state
            
        Raises:
            UpdateFailed: If update fails
        """
        try:
            _LOGGER.debug("Coordinator update data called")
            
            # Get all areas
            areas = self.area_manager.get_all_areas()
            _LOGGER.debug("Processing %d areas for coordinator update", len(areas))
            
            # Build data structure
            data = {
                "status": STATE_INITIALIZED,
                "area_count": len(areas),
                "areas": {},
            }
            
            # Add area information with device states
            for area_id, area in areas.items():
                # Get device states
                devices_data = []
                for device_id, device_info in area.devices.items():
                    state = self.hass.states.get(device_id)
                    device_data = {
                        "id": device_id,
                        "type": device_info["type"],
                        "state": state.state if state else "unavailable",
                        "name": state.attributes.get("friendly_name", device_id) if state else device_id,
                    }
                    
                    # Add device-specific attributes
                    if state:
                        if device_info["type"] == "thermostat":
                            device_data["current_temperature"] = state.attributes.get("current_temperature")
                            device_data["target_temperature"] = state.attributes.get("temperature")
                            device_data["hvac_action"] = state.attributes.get("hvac_action")
                        elif device_info["type"] == "temperature_sensor":
                            # For temperature sensors, the state IS the temperature
                            try:
                                temp_value = float(state.state) if state.state not in ("unknown", "unavailable") else None
                                if temp_value is not None:
                                    # Check if temperature is in Fahrenheit and convert to Celsius
                                    unit = state.attributes.get("unit_of_measurement", "°C")
                                    if unit in ("°F", "F"):
                                        temp_value = (temp_value - 32) * 5/9
                                        _LOGGER.debug(
                                            "Converted temperature sensor %s: %s°F -> %.1f°C",
                                            device_id, state.state, temp_value
                                        )
                                    device_data["temperature"] = temp_value
                                else:
                                    device_data["temperature"] = None
                            except (ValueError, TypeError):
                                device_data["temperature"] = None
                        elif device_info["type"] == "valve":
                            # For valves (number entities), the position is in the state
                            try:
                                device_data["position"] = float(state.state) if state.state not in ("unknown", "unavailable") else None
                            except (ValueError, TypeError):
                                device_data["position"] = None
                    
                    devices_data.append(device_data)
                
                _LOGGER.debug(
                    "Building data for area %s: manual_override=%s, target_temp=%s",
                    area_id, getattr(area, 'manual_override', False), area.target_temperature
                )
                
                data["areas"][area_id] = {
                    "id": area_id,  # Include area ID so frontend can identify and navigate
                    "name": area.name,
                    "enabled": area.enabled,
                    "state": area.state,
                    "target_temperature": area.target_temperature,
                    "current_temperature": area.current_temperature,
                    "device_count": len(area.devices),
                    "devices": devices_data,
                    # Preset mode settings
                    "preset_mode": area.preset_mode,
                    "away_temp": area.away_temp,
                    "eco_temp": area.eco_temp,
                    "comfort_temp": area.comfort_temp,
                    "home_temp": area.home_temp,
                    "sleep_temp": area.sleep_temp,
                    "activity_temp": area.activity_temp,
                    # Boost mode
                    "boost_mode_active": area.boost_mode_active,
                    "boost_temp": area.boost_temp,
                    "boost_duration": area.boost_duration,
                    # HVAC mode
                    "hvac_mode": area.hvac_mode,
                    # Manual override
                    "manual_override": getattr(area, 'manual_override', False),
                    # Hidden state (frontend-only, but persisted in backend)
                    "hidden": getattr(area, 'hidden', False),
                    # Switch/pump control
                    "shutdown_switches_when_idle": getattr(area, 'shutdown_switches_when_idle', True),
                    # Sensors
                    "window_sensors": area.window_sensors,
                    "presence_sensors": area.presence_sensors,
                    # Night boost
                    "night_boost_enabled": area.night_boost_enabled,
                    "night_boost_offset": area.night_boost_offset,
                    "night_boost_start_time": area.night_boost_start_time,
                    "night_boost_end_time": area.night_boost_end_time,
                    # Smart night boost
                    "smart_night_boost_enabled": area.smart_night_boost_enabled,
                    "smart_night_boost_target_time": area.smart_night_boost_target_time,
                    "weather_entity_id": area.weather_entity_id,
                }
            
            _LOGGER.debug("Smart Heating data updated successfully: %d areas", len(areas))
            return data
            
        except Exception as err:
            _LOGGER.error("Error updating Smart Heating data: %s", err)
            raise UpdateFailed(f"Error communicating with API: {err}") from err
