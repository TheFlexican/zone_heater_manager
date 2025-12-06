"""Area-specific logging for Smart Heating development."""
import logging
from datetime import datetime
from typing import Any
from collections import deque
from pathlib import Path

_LOGGER = logging.getLogger(__name__)

# Maximum log entries per area (to prevent memory issues)
MAX_LOG_ENTRIES = 500


class AreaLogger:
    """Logger for tracking heating strategy decisions per area."""
    
    def __init__(self, storage_path: str | None = None) -> None:
        """Initialize the area logger.
        
        Args:
            storage_path: Optional path to store logs persistently
        """
        self._logs: dict[str, deque] = {}
        self._storage_path = storage_path
        _LOGGER.info("Area logger initialized")
    
    def log_event(
        self,
        area_id: str,
        event_type: str,
        message: str,
        details: dict[str, Any] | None = None
    ) -> None:
        """Log an event for a specific area.
        
        Args:
            area_id: Area identifier
            event_type: Type of event (temperature, schedule, preset, boost, etc.)
            message: Human-readable message
            details: Additional event details
        """
        if area_id not in self._logs:
            self._logs[area_id] = deque(maxlen=MAX_LOG_ENTRIES)
        
        entry = {
            "timestamp": datetime.now().isoformat(),
            "type": event_type,
            "message": message,
            "details": details or {}
        }
        
        self._logs[area_id].append(entry)
        
        # Also log to standard logger for debugging
        _LOGGER.info(
            "[%s] %s: %s %s",
            area_id,
            event_type.upper(),
            message,
            f"({details})" if details else ""
        )
    
    def get_logs(
        self,
        area_id: str,
        limit: int | None = None,
        event_type: str | None = None
    ) -> list[dict[str, Any]]:
        """Get logs for a specific area.
        
        Args:
            area_id: Area identifier
            limit: Maximum number of entries to return
            event_type: Filter by event type
            
        Returns:
            List of log entries (newest first)
        """
        if area_id not in self._logs:
            return []
        
        logs = list(self._logs[area_id])
        
        # Filter by event type if specified
        if event_type:
            logs = [log for log in logs if log["type"] == event_type]
        
        # Reverse to show newest first
        logs.reverse()
        
        # Apply limit
        if limit:
            logs = logs[:limit]
        
        return logs
    
    def clear_logs(self, area_id: str) -> None:
        """Clear all logs for an area.
        
        Args:
            area_id: Area identifier
        """
        if area_id in self._logs:
            self._logs[area_id].clear()
            _LOGGER.info("Cleared logs for area %s", area_id)
    
    def get_all_area_ids(self) -> list[str]:
        """Get all area IDs that have logs.
        
        Returns:
            List of area IDs
        """
        return list(self._logs.keys())
