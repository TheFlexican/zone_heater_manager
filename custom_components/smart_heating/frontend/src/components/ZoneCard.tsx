import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
  Slider,
  Switch,
  Menu,
  ListItemText,
  List,
  ListItem
} from '@mui/material'
import { Droppable } from 'react-beautiful-dnd'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import SensorsIcon from '@mui/icons-material/Sensors'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import AcUnitIcon from '@mui/icons-material/AcUnit'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { Zone } from '../types'
import { setZoneTemperature, enableZone, disableZone, removeDeviceFromZone } from '../api'

interface ZoneCardProps {
  zone: Zone
  onUpdate: () => void
}

const ZoneCard = ({ zone, onUpdate }: ZoneCardProps) => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [temperature, setTemperature] = useState(zone.target_temperature)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCardClick = () => {
    navigate(`/zone/${zone.id}`)
  }

  const handleToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation()
    try {
      if (zone.enabled) {
        await disableZone(zone.id)
      } else {
        await enableZone(zone.id)
      }
      onUpdate()
    } catch (error) {
      console.error('Failed to toggle zone:', error)
    }
  }

  const handleTemperatureChange = async (event: Event, value: number | number[]) => {
    event.stopPropagation()
    const newTemp = value as number
    setTemperature(newTemp)
  }

  const handleTemperatureCommit = async (event: Event | React.SyntheticEvent, value: number | number[]) => {
    event.stopPropagation()
    try {
      await setZoneTemperature(zone.id, value as number)
      onUpdate()
    } catch (error) {
      console.error('Failed to set temperature:', error)
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeDeviceFromZone(zone.id, deviceId)
      onUpdate()
    } catch (error) {
      console.error('Failed to remove device:', error)
    }
  }

  const handleSliderClick = (event: React.MouseEvent) => {
    event.stopPropagation()
  }

  const getStateColor = () => {
    switch (zone.state) {
      case 'heating':
        return 'error'
      case 'idle':
        return 'info'
      case 'off':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStateIcon = () => {
    switch (zone.state) {
      case 'heating':
        return <LocalFireDepartmentIcon />
      case 'idle':
        return <ThermostatIcon />
      case 'off':
        return <AcUnitIcon />
      default:
        return <ThermostatIcon />
    }
  }

  return (
    <Droppable droppableId={`zone-${zone.id}`}>
      {(provided, snapshot) => (
        <Card 
          ref={provided.innerRef}
          {...provided.droppableProps}
          elevation={2}
          onClick={handleCardClick}
          sx={{
            bgcolor: snapshot.isDraggingOver ? 'rgba(3, 169, 244, 0.05)' : 'background.paper',
            border: snapshot.isDraggingOver ? '2px dashed #03a9f4' : 'none',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: snapshot.isDraggingOver ? 'rgba(3, 169, 244, 0.05)' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {zone.name}
            </Typography>
            <Chip
              icon={getStateIcon()}
              label={zone.state.toUpperCase()}
              color={getStateColor()}
              size="small"
            />
          </Box>
          <Box>
            <Switch
              checked={zone.enabled}
              onChange={handleToggle}
              color="primary"
            />
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Box my={3} onClick={handleSliderClick}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Target Temperature
            </Typography>
            <Typography variant="h5" color="primary">
              {temperature}°C
            </Typography>
          </Box>
          <Slider
            value={temperature}
            onChange={handleTemperatureChange}
            onChangeCommitted={handleTemperatureCommit}
            min={5}
            max={30}
            step={0.5}
            marks={[
              { value: 5, label: '5°' },
              { value: 30, label: '30°' }
            ]}
            valueLabelDisplay="auto"
            disabled={!zone.enabled}
          />
        </Box>

        {zone.current_temperature !== undefined && (
          <Box display="flex" justifyContent="space-between" mb={2}>
            <Typography variant="body2" color="text.secondary">
              Current Temperature
            </Typography>
            <Typography variant="body1">
              {zone.current_temperature}°C
            </Typography>
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={1} mb={zone.devices.length > 0 ? 2 : 0}>
          <SensorsIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {zone.devices.length} device(s)
            {snapshot.isDraggingOver && ' - Drop here to add'}
          </Typography>
        </Box>

        {zone.devices.length > 0 && (
          <List dense sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
            {zone.devices.map((device) => (
              <ListItem
                key={device.id}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveDevice(device.id)
                    }}
                    sx={{ color: 'text.secondary' }}
                  >
                    <RemoveCircleOutlineIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={device.name || device.id}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    color: 'text.primary'
                  }}
                  secondary={device.type.replace(/_/g, ' ')}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    color: 'text.secondary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
        {provided.placeholder}
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
      </Menu>
    </Card>
      )}
    </Droppable>
  )
}

export default ZoneCard
