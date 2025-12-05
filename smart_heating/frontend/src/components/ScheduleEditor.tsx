import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Zone, ScheduleEntry } from '../types'
import { addScheduleToZone, removeScheduleFromZone } from '../api'

interface ScheduleEditorProps {
  area: Zone
  onUpdate: () => void
}

const DAYS_OF_WEEK: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const ScheduleEditor = ({ area, onUpdate }: ScheduleEditorProps) => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(area.schedules || [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ScheduleEntry | null>(null)
  const [formData, setFormData] = useState({
    day: 'Monday',
    start_time: '06:00',
    end_time: '22:00',
    temperature: 20,
  })

  useEffect(() => {
    setSchedules(area.schedules || [])
  }, [area])

  const handleAddNew = () => {
    setEditingEntry(null)
    setFormData({
      day: 'Monday',
      start_time: '06:00',
      end_time: '22:00',
      temperature: 20,
    })
    setDialogOpen(true)
  }

  const handleEdit = (entry: ScheduleEntry) => {
    setEditingEntry(entry)
    setFormData({
      day: entry.day,
      start_time: entry.start_time,
      end_time: entry.end_time,
      temperature: entry.temperature,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await removeScheduleFromZone(area.id, id)
      onUpdate()
    } catch (error) {
      console.error('Failed to delete schedule:', error)
    }
  }

  const handleSave = async () => {
    try {
      if (editingEntry) {
        // For updates, we remove old and add new
        await removeScheduleFromZone(area.id, editingEntry.id)
      }
      
      const newEntry: ScheduleEntry = {
        id: editingEntry?.id || Date.now().toString(),
        ...formData,
      }
      
      await addScheduleToZone(area.id, newEntry)
      onUpdate()
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to save schedule:', error)
    }
  }

  const handleCopyToWeekdays = async () => {
    const mondaySchedules = schedules.filter(s => s.day === 'Monday')
    
    if (mondaySchedules.length === 0) {
      alert('No Monday schedules to copy')
      return
    }

    try {
      const weekdays: string[] = ['Tuesday', 'Wednesday', 'Thursday', 'Friday']
      
      // Add new weekday schedules
      for (const day of weekdays) {
        for (const schedule of mondaySchedules) {
          const newEntry: ScheduleEntry = {
            ...schedule,
            id: `${day}_${schedule.id}_${Date.now()}`,
            day,
          }
          await addScheduleToZone(area.id, newEntry)
        }
      }
      
      onUpdate()
    } catch (error) {
      console.error('Failed to copy schedules:', error)
    }
  }

  const getSchedulesForDay = (day: string) => {
    return schedules
      .filter(s => s.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" color="text.primary">
          Weekly Schedule for {area.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleCopyToWeekdays}
          >
            Copy Monday to Weekdays
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddNew}
          >
            Add Schedule
          </Button>
        </Box>
      </Box>

      {DAYS_OF_WEEK.map(day => {
        const daySchedules = getSchedulesForDay(day)
        
        return (
          <Paper key={day} sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: daySchedules.length > 0 ? 2 : 0 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                {day}
              </Typography>
              {daySchedules.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No schedules set
                </Typography>
              )}
            </Box>
            
            {daySchedules.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {daySchedules.map(schedule => (
                  <Chip
                    key={schedule.id}
                    label={`${schedule.start_time} - ${schedule.end_time}: ${schedule.temperature}°C`}
                    onDelete={() => handleDelete(schedule.id)}
                    onClick={() => handleEdit(schedule)}
                    color="primary"
                    variant="outlined"
                    deleteIcon={<DeleteIcon />}
                    icon={<EditIcon />}
                  />
                ))}
              </Box>
            )}
          </Paper>
        )
      })}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Edit Schedule Entry' : 'Add Schedule Entry'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Day of Week</InputLabel>
              <Select
                value={formData.day}
                label="Day of Week"
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              >
                {DAYS_OF_WEEK.map(day => (
                  <MenuItem key={day} value={day}>{day}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Start Time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="End Time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Temperature (°C)"
              type="number"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: 5, max: 30, step: 0.5 }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ScheduleEditor
