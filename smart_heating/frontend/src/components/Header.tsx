import { AppBar, Toolbar, Typography, Chip, Box, Tooltip } from '@mui/material'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'

interface HeaderProps {
  wsConnected?: boolean
}

const Header = ({ wsConnected = false }: HeaderProps) => {
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar>
        <ThermostatIcon sx={{ mr: 2, color: 'text.secondary' }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, color: 'text.primary' }}
        >
          Smart Heating
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title={wsConnected ? 'Real-time updates active' : 'Real-time updates inactive'}>
            <Chip
              icon={wsConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={wsConnected ? 'Connected' : 'Disconnected'}
              size="small"
              color={wsConnected ? 'success' : 'default'}
              variant="outlined"
              sx={{
                borderColor: wsConnected ? 'success.main' : 'divider',
                color: wsConnected ? 'success.main' : 'text.secondary'
              }}
            />
          </Tooltip>
          <Chip 
            label="v0.1.0" 
            size="small" 
            variant="outlined"
            sx={{ 
              borderColor: 'divider',
              color: 'text.secondary'
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
