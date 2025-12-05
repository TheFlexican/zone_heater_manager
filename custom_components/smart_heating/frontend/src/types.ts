export interface Device {
  id: string
  type: 'thermostat' | 'temperature_sensor' | 'opentherm_gateway' | 'valve'
  mqtt_topic?: string
  name?: string
  state?: string
  // Thermostat specific
  hvac_action?: string
  current_temperature?: number
  target_temperature?: number
  // Temperature sensor specific
  temperature?: number | string
  // Valve specific
  position?: number
}

export interface ScheduleEntry {
  id: string
  day: string
  start_time: string
  end_time: string
  temperature: number
}

export interface Zone {
  id: string
  name: string
  enabled: boolean
  state: 'heating' | 'idle' | 'off'
  target_temperature: number
  current_temperature?: number
  devices: Device[]
  schedules?: ScheduleEntry[]
  
  // Night boost settings
  night_boost_enabled?: boolean
  night_boost_offset?: number
  night_boost_start_time?: string
  night_boost_end_time?: string
  
  // Smart night boost settings
  smart_night_boost_enabled?: boolean
  smart_night_boost_target_time?: string
  weather_entity_id?: string
  
  // Preset mode settings
  preset_mode?: string
  away_temp?: number
  eco_temp?: number
  comfort_temp?: number
  home_temp?: number
  sleep_temp?: number
  activity_temp?: number
  
  // Boost mode settings
  boost_mode_active?: boolean
  boost_duration?: number
  boost_temp?: number
  boost_end_time?: string
  
  // HVAC mode
  hvac_mode?: string
  
  // Window sensor settings
  window_sensors?: string[]
  window_open_action_enabled?: boolean
  window_open_temp_drop?: number
  window_is_open?: boolean
  
  // Presence sensor settings
  presence_sensors?: string[]
  presence_temp_boost?: number
  presence_detected?: boolean
}

// Alias Area to Zone for compatibility
export type Area = Zone

export interface LearningStats {
  total_events: number
  avg_heating_rate: number
  avg_outdoor_correlation: number
  prediction_accuracy: number
  last_updated?: string
}

export interface DeviceAdd {
  device_id: string
  device_type: string
  mqtt_topic?: string
}
