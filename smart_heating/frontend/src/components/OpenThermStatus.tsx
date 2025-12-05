import { useState, useEffect } from 'react'
import { Card, CardContent, Typography, Box, Chip, Grid } from '@mui/material'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import PowerIcon from '@mui/icons-material/Power'
import { getEntityState } from '../api'

interface OpenThermStatusProps {
  openthermGatewayId?: string
  enabled?: boolean
}

interface OpenThermState {
  current_temperature?: number
  temperature?: number
  target_temp?: number
  hvac_action?: string
  hvac_mode?: string
  boiler_water_temp?: number
  ch_water_temp?: number
  control_setpoint?: number
  flame_on?: boolean
  heating_active?: boolean
  friendly_name?: string
}

export default function OpenThermStatus({ openthermGatewayId, enabled }: OpenThermStatusProps) {
  const [state, setState] = useState<OpenThermState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!openthermGatewayId || !enabled) {
      setLoading(false)
      return
    }

    const fetchState = async () => {
      try {
        const entityState = await getEntityState(openthermGatewayId)
        
        if (entityState) {
          setState({
            current_temperature: entityState.attributes.current_temperature,
            temperature: entityState.attributes.temperature,
            target_temp: entityState.attributes.target_temp,
            hvac_action: entityState.attributes.hvac_action,
            hvac_mode: entityState.state,
            boiler_water_temp: entityState.attributes.boiler_water_temp,
            ch_water_temp: entityState.attributes.ch_water_temp,
            control_setpoint: entityState.attributes.control_setpoint,
            flame_on: entityState.attributes.flame_on,
            heating_active: entityState.attributes.hvac_action === 'heating',
            friendly_name: entityState.attributes.friendly_name,
          })
        }
      } catch (error) {
        console.error('Failed to fetch OpenTherm state:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchState()
    const interval = setInterval(fetchState, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [openthermGatewayId, enabled])

  if (!enabled || !openthermGatewayId) {
    return null
  }

  if (loading) {
    return (
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            OpenTherm Gateway
          </Typography>
          <Typography color="text.secondary">Loading...</Typography>
        </CardContent>
      </Card>
    )
  }

  if (!state) {
    return (
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            OpenTherm Gateway
          </Typography>
          <Typography color="text.secondary">
            Not available - Please check your configuration
          </Typography>
        </CardContent>
      </Card>
    )
  }

  const isHeating = state.heating_active || state.flame_on
  const boilerTemp = state.ch_water_temp || state.boiler_water_temp
  const targetTemp = state.control_setpoint || state.target_temp || state.temperature

  return (
    <Card 
      sx={{ 
        mb: 3, 
        bgcolor: 'background.paper',
        border: isHeating ? '2px solid' : '1px solid',
        borderColor: isHeating ? 'error.main' : 'divider',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalFireDepartmentIcon 
              sx={{ 
                color: isHeating ? 'error.main' : 'text.secondary',
                fontSize: 28 
              }} 
            />
            <Typography variant="h6">
              {state.friendly_name || 'OpenTherm Gateway'}
            </Typography>
          </Box>
          <Chip
            icon={<PowerIcon />}
            label={isHeating ? 'Heating' : 'Idle'}
            color={isHeating ? 'error' : 'default'}
            size="small"
            sx={{ 
              fontWeight: 'bold',
              animation: isHeating ? 'pulse 2s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 },
              },
            }}
          />
        </Box>

        <Grid container spacing={2}>
          {boilerTemp !== undefined && (
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WaterDropIcon sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Boiler Water
                  </Typography>
                  <Typography variant="h6">
                    {boilerTemp.toFixed(1)}°C
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          {targetTemp !== undefined && (
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ThermostatIcon sx={{ color: 'secondary.main' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Target Setpoint
                  </Typography>
                  <Typography variant="h6">
                    {targetTemp.toFixed(1)}°C
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PowerIcon sx={{ color: isHeating ? 'error.main' : 'text.secondary' }} />
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                  {state.hvac_action || state.hvac_mode || 'Unknown'}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {state.flame_on !== undefined && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={state.flame_on ? '🔥 Flame Active' : '❄️ Flame Off'}
              size="small"
              color={state.flame_on ? 'error' : 'default'}
              variant="outlined"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
