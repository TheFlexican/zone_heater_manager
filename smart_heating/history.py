"""History tracking for Smart Heating."""
import logging
from datetime import datetime, timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

_LOGGER = logging.getLogger(__name__)

STORAGE_VERSION = 1
STORAGE_KEY = "smart_heating_history"
HISTORY_RETENTION_DAYS = 7  # Keep 7 days of history


class HistoryTracker:
    """Track temperature history for areas."""

    def __init__(self, hass: HomeAssistant) -> None:
        """Initialize the history tracker.
        
        Args:
            hass: Home Assistant instance
        """
        self.hass = hass
        self._store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self._history: dict[str, list[dict[str, Any]]] = {}

    async def async_load(self) -> None:
        """Load history from storage."""
        _LOGGER.debug("Loading history from storage")
        data = await self._store.async_load()
        
        if data is not None and "history" in data:
            self._history = data["history"]
            # Clean up old entries
            await self._async_cleanup_old_entries()
            _LOGGER.info("Loaded history for %d areas", len(self._history))
        else:
            _LOGGER.debug("No history found in storage")

    async def async_save(self) -> None:
        """Save history to storage."""
        _LOGGER.debug("Saving history to storage")
        data = {"history": self._history}
        await self._store.async_save(data)

    async def _async_cleanup_old_entries(self) -> None:
        """Remove entries older than retention period."""
        cutoff = datetime.now() - timedelta(days=HISTORY_RETENTION_DAYS)
        cutoff_iso = cutoff.isoformat()
        
        for area_id in list(self._history.keys()):
            original_count = len(self._history[area_id])
            self._history[area_id] = [
                entry for entry in self._history[area_id]
                if entry["timestamp"] > cutoff_iso
            ]
            removed = original_count - len(self._history[area_id])
            if removed > 0:
                _LOGGER.debug(
                    "Removed %d old entries for area %s", removed, area_id
                )

    async def async_record_temperature(
        self,
        area_id: str,
        current_temp: float,
        target_temp: float,
        state: str,
    ) -> None:
        """Record a temperature reading.
        
        Args:
            area_id: Area identifier
            current_temp: Current temperature
            target_temp: Target temperature
            state: Area state (heating/idle/off)
        """
        if area_id not in self._history:
            self._history[area_id] = []
        
        entry = {
            "timestamp": datetime.now().isoformat(),
            "current_temperature": current_temp,
            "target_temperature": target_temp,
            "state": state,
        }
        
        self._history[area_id].append(entry)
        
        # Limit to last 1000 entries per area
        if len(self._history[area_id]) > 1000:
            self._history[area_id] = self._history[area_id][-1000:]
        
        _LOGGER.debug(
            "Recorded temperature for %s: %.1f°C (target: %.1f°C, state: %s)",
            area_id, current_temp, target_temp, state
        )

    def get_history(
        self,
        area_id: str,
        hours: int = 24
    ) -> list[dict[str, Any]]:
        """Get temperature history for an area.
        
        Args:
            area_id: Area identifier
            hours: Number of hours to retrieve
            
        Returns:
            List of history entries
        """
        if area_id not in self._history:
            return []
        
        cutoff = datetime.now() - timedelta(hours=hours)
        cutoff_iso = cutoff.isoformat()
        
        return [
            entry for entry in self._history[area_id]
            if entry["timestamp"] > cutoff_iso
        ]

    def get_all_history(self) -> dict[str, list[dict[str, Any]]]:
        """Get all history.
        
        Returns:
            Dictionary of area_id -> history entries
        """
        return self._history
