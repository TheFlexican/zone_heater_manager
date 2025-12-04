import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material'
import ZoneCard from './ZoneCard'
import { Zone } from '../types'

interface ZoneListProps {
  zones: Zone[]
  loading: boolean
  onUpdate: () => void
}

const ZoneList = ({ zones, loading, onUpdate }: ZoneListProps) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4">
          Zones
        </Typography>
      </Box>

      {zones.length === 0 ? (
        <Alert severity="info">
          No areas found. Please configure areas in Home Assistant first (Settings → Areas & Zones → Areas).
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {zones.map((zone) => (
            <Grid item xs={12} md={6} lg={4} key={zone.id}>
              <ZoneCard zone={zone} onUpdate={onUpdate} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default ZoneList
