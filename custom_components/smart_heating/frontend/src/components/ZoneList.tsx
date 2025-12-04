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
  areas: Zone[]
  loading: boolean
  onUpdate: () => void
}

const ZoneList = ({ areas, loading, onUpdate }: ZoneListProps) => {
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

      {areas.length === 0 ? (
        <Alert severity="info">
          No areas found. Please configure areas in Home Assistant first (Settings → Areas & Zones → Areas).
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {areas.map((area) => (
            <Grid item xs={12} md={6} lg={4} key={area.id}>
              <ZoneCard area={area} onUpdate={onUpdate} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default ZoneList
