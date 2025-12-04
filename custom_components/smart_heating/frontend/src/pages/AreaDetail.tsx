import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Slider,
  Switch,
  Divider,
  Alert,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import SensorsIcon from '@mui/icons-material/Sensors'
import WaterIcon from '@mui/icons-material/Water'
import RouterIcon from '@mui/icons-material/Router'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { Zone, Device } from '../types'
import { getZones, getDevices, setZoneTemperature, enableZone, disableZone, removeDeviceFromZone } from '../api'
import ScheduleEditor from '../components/ScheduleEditor'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`zone-tabpanel-${index}`}
      aria-labelledby={`zone-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const ZoneDetail = () => {
  const { zoneId } = useParams<{ zoneId: string }>()
  const navigate = useNavigate()
  const [zone, setZone] = useState<Zone | null>(null)
  const [availableDevices, setAvailableDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [tabValue, setTabValue] = useState(0)
  const [temperature, setTemperature] = useState(21)

  useEffect(() => {
    loadData()
  }, [zoneId])

  const loadData = async () => {
    if (!zoneId) return
    
    try {
      setLoading(true)
      const [zonesData, devicesData] = await Promise.all([
        getZones(),
        getDevices()
      ])
      
      const currentZone = zonesData.find(z => z.id === zoneId)
      if (!currentZone) {
        navigate('/')
        return
      }
      
      setZone(currentZone)
      setTemperature(currentZone.target_temperature)
      
      // Filter available devices (not assigned to any zone)
      const assignedDeviceIds = new Set(
        zonesData.flatMap(z => z.devices.map(d => d.id))
      )
      setAvailableDevices(
        devicesData.filter(device => !assignedDeviceIds.has(device.id))
      )
    } catch (error) {
      console.error('Failed to load zone:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleToggle = async () => {
    if (!zone) return
    
    try {
      if (zone.enabled) {
        await disableZone(zone.id)
      } else {
        await enableZone(zone.id)
      }
      await loadData()
    } catch (error) {
      console.error('Failed to toggle zone:', error)
    }
  }

  const handleTemperatureChange = (_event: Event, value: number | number[]) => {
    setTemperature(value as number)
  }

  const handleTemperatureCommit = async (_event: Event | React.SyntheticEvent, value: number | number[]) => {
    if (!zone) return
    
    try {
      await setZoneTemperature(zone.id, value as number)
      await loadData()
    } catch (error) {
      console.error('Failed to set temperature:', error)
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!zone) return
    
    try {
      await removeDeviceFromZone(zone.id, deviceId)
      await loadData()
    } catch (error) {
      console.error('Failed to remove device:', error)
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'thermostat':
        return <ThermostatIcon />
      case 'temperature_sensor':
        return <SensorsIcon />
      case 'valve':
        return <WaterIcon />
      case 'opentherm_gateway':
        return <RouterIcon />
      default:
        return <SensorsIcon />
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!zone) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Zone not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Zones
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => navigate('/')} edge="start">
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" color="text.primary">
                {zone.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Chip
                  label={zone.state.toUpperCase()}
                  color={getStateColor(zone.state)}
                  size="small"
                />
                <Chip
                  label={zone.enabled ? 'ENABLED' : 'DISABLED'}
                  color={zone.enabled ? 'success' : 'default'}
                  size="small"
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Switch checked={zone.enabled} onChange={handleToggle} color="primary" />
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Devices" />
          <Tab label="Schedule" />
          <Tab label="History" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Temperature Control
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Target Temperature
                </Typography>
                <Typography variant="h4" color="primary">
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
                  { value: 15, label: '15°' },
                  { value: 20, label: '20°' },
                  { value: 25, label: '25°' },
                  { value: 30, label: '30°' }
                ]}
                valueLabelDisplay="auto"
                disabled={!zone.enabled}
              />

              {zone.current_temperature !== undefined && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1" color="text.secondary">
                      Current Temperature
                    </Typography>
                    <Typography variant="h5" color="text.primary">
                      {zone.current_temperature}°C
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Quick Stats
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Devices"
                    secondary={`${zone.devices.length} device(s) assigned`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={zone.state}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Zone ID"
                    secondary={zone.id}
                  />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </TabPanel>

        {/* Devices Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="text.primary">
                  Assigned Devices ({zone.devices.length})
                </Typography>
              </Box>

              {zone.devices.length === 0 ? (
                <Alert severity="info">
                  No devices assigned to this zone. Go back to the main view to drag and drop devices.
                </Alert>
              ) : (
                <List>
                  {zone.devices.map((device) => (
                    <ListItem
                      key={device.id}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveDevice(device.id)}
                          color="error"
                        >
                          <RemoveCircleOutlineIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon sx={{ color: 'text.secondary' }}>
                        {getDeviceIcon(device.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={device.name || device.id}
                        primaryTypographyProps={{ color: 'text.primary' }}
                        secondary={device.type.replace(/_/g, ' ')}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>

            {availableDevices.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  Available Devices ({availableDevices.length})
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  To add devices, use the drag and drop feature on the main zones page.
                </Alert>
                <List>
                  {availableDevices.slice(0, 5).map((device) => (
                    <ListItem key={device.id}>
                      <ListItemIcon sx={{ color: 'text.secondary' }}>
                        {getDeviceIcon(device.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={device.name || device.id}
                        primaryTypographyProps={{ color: 'text.primary' }}
                        secondary={device.type.replace(/_/g, ' ')}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  ))}
                  {availableDevices.length > 5 && (
                    <ListItem>
                      <ListItemText
                        secondary={`+ ${availableDevices.length - 5} more available`}
                        secondaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Box>
        </TabPanel>

        {/* Schedule Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <ScheduleEditor zone={zone} onUpdate={loadData} />
          </Box>
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Temperature History
              </Typography>
              <Alert severity="info">
                History charts coming soon! This will show temperature trends over time.
              </Alert>
            </Paper>
          </Box>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom color="text.primary">
                Advanced Settings
              </Typography>
              <Alert severity="info">
                Advanced settings coming soon! This will include hysteresis, min/max limits, and more.
              </Alert>
            </Paper>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  )
}

export default ZoneDetail
