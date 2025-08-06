import { useCallback, useState } from 'react'
import { Range } from 'react-range'
import { format, addHours, differenceInHours } from 'date-fns'
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Tooltip,
  useMediaQuery,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  Chip
} from '@mui/material'
import {
  Schedule,
  NavigateBefore,
  NavigateNext,
  AccessTime,
  Timeline,
  RadioButtonChecked
} from '@mui/icons-material'

const TimelineSlider = ({ timelineRange, onChange }) => {
  const { start, end, current } = timelineRange
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  // State for slider mode (single or range)
  const [sliderMode, setSliderMode] = useState('single') // 'single' or 'range'
  const [rangeValues, setRangeValues] = useState([0, Math.floor(differenceInHours(end, start) / 4)]) // Default range
  
  // Convert dates to hours for the slider
  const totalHours = differenceInHours(end, start)
  const currentHour = differenceInHours(current, start)
  
  // Handle slider change for single mode
  const handleSliderChange = useCallback((values) => {
    if (sliderMode === 'single') {
      const newCurrentDate = addHours(start, values[0])
      onChange({
        ...timelineRange,
        current: newCurrentDate
      })
    } else {
      // Range mode - update internal range state
      setRangeValues(values)
      // For now, set current to start of range
      const newCurrentDate = addHours(start, values[0])
      onChange({
        ...timelineRange,
        current: newCurrentDate,
        rangeStart: addHours(start, values[0]),
        rangeEnd: addHours(start, values[1])
      })
    }
  }, [start, timelineRange, onChange, sliderMode])
  
  // Handle mode change
  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setSliderMode(newMode)
      if (newMode === 'range') {
        // Initialize range around current time
        const currentHourVal = differenceInHours(current, start)
        const rangeStart = Math.max(0, currentHourVal - 12)
        const rangeEnd = Math.min(totalHours, currentHourVal + 12)
        setRangeValues([rangeStart, rangeEnd])
      }
    }
  }
  
  // Quick navigation buttons
  const handleQuickNav = (direction) => {
    let newCurrent
    if (direction === 'prev') {
      newCurrent = addHours(current, -1)
    } else {
      newCurrent = addHours(current, 1)
    }
    
    // Ensure we stay within bounds
    if (newCurrent >= start && newCurrent <= end) {
      onChange({
        ...timelineRange,
        current: newCurrent
      })
    }
  }
  
  // Generate tick marks for display - responsive
  const generateTicks = () => {
    const ticks = []
    let maxTicks
    
    // Adjust number of ticks based on screen size
    if (isMobile) {
      maxTicks = 3
    } else if (isTablet) {
      maxTicks = 5
    } else {
      maxTicks = 8
    }
    
    const tickInterval = Math.max(1, Math.floor(totalHours / (maxTicks - 1)))
    
    for (let i = 0; i <= totalHours; i += tickInterval) {
      if (ticks.length >= maxTicks) break
      
      const tickDate = addHours(start, i)
      ticks.push({
        value: i,
        label: isMobile ? 
          format(tickDate, 'MM/dd HH:mm') : 
          format(tickDate, 'MMM dd HH:mm')
      })
    }
    
    // Always include the last tick if not already there
    if (ticks.length > 0 && ticks[ticks.length - 1].value !== totalHours) {
      const lastTickDate = addHours(start, totalHours)
      ticks[ticks.length - 1] = {
        value: totalHours,
        label: isMobile ? 
          format(lastTickDate, 'MM/dd HH:mm') : 
          format(lastTickDate, 'MMM dd HH:mm')
      }
    }
    
    return ticks
  }
  
  const ticks = generateTicks()
  
  return (
    <Box sx={{ width: '100%', p: { xs: 1, sm: 1.5, md: 2 } }}>
      {/* Mode Toggle and Header Section */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        spacing={{ xs: 2, sm: 2 }}
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        {/* Time Range Info */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Schedule sx={{ 
            color: '#1976d2', 
            fontSize: { xs: 16, sm: 18, md: 20 } 
          }} />
          <Box>
            <Typography 
              variant="body1" 
              sx={{ 
                fontWeight: 600, 
                color: '#1976d2',
                fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' }
              }}
            >
              Time Range
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
            >
              {format(start, isMobile ? 'MM/dd' : 'MMM dd')} - {format(end, isMobile ? 'MM/dd' : 'MMM dd')}
            </Typography>
          </Box>
        </Stack>

        {/* Slider Mode Toggle */}
        <Stack direction={{ xs: 'row', sm: 'row' }} spacing={2} alignItems="center">
          <ToggleButtonGroup
            value={sliderMode}
            exclusive
            onChange={handleModeChange}
            size={isMobile ? "small" : "medium"}
            sx={{
              '& .MuiToggleButton-root': {
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                px: { xs: 1, sm: 1.5 },
                py: { xs: 0.5, sm: 0.75 }
              }
            }}
          >
            <ToggleButton value="single" aria-label="single point">
              <RadioButtonChecked sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5 }} />
              {!isMobile && 'Single'}
            </ToggleButton>
            <ToggleButton value="range" aria-label="time range">
              <Timeline sx={{ fontSize: { xs: 14, sm: 16 }, mr: 0.5 }} />
              {!isMobile && 'Range'}
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Current Time Display */}
          <Tooltip title={sliderMode === 'single' ? "Current selected time" : "Selected time range"}>
            <Paper sx={{ 
              py: { xs: 0.5, sm: 0.7 }, 
              px: { xs: 1, sm: 1.5, md: 2 }, 
              bgcolor: '#e3f2fd',
              border: '1px solid #bbdefb',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 },
              justifyContent: 'center',
              minWidth: { xs: 'auto', sm: '140px' }
            }}>
              <AccessTime sx={{ 
                color: '#1976d2', 
                fontSize: { xs: 14, sm: 16 } 
              }} />
              {sliderMode === 'single' ? (
                <Typography variant="body2" sx={{ 
                  fontWeight: 600, 
                  color: '#1565c0',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  whiteSpace: 'nowrap'
                }}>
                  {format(current, isMobile ? 'MM/dd HH:mm' : 'MMM dd, HH:mm')}
                </Typography>
              ) : (
                <Stack direction="column" alignItems="center" spacing={0.2}>
                  <Typography variant="caption" sx={{ 
                    color: '#1565c0',
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    fontWeight: 600
                  }}>
                    {format(addHours(start, rangeValues[0]), 'HH:mm')} - {format(addHours(start, rangeValues[1]), 'HH:mm')}
                  </Typography>
                  <Chip 
                    label={`${rangeValues[1] - rangeValues[0]}h range`}
                    size="small"
                    sx={{ 
                      height: 16, 
                      fontSize: '0.6rem',
                      bgcolor: '#bbdefb',
                      color: '#1565c0'
                    }}
                  />
                </Stack>
              )}
            </Paper>
          </Tooltip>
        </Stack>
      </Stack>
      
      {/* Navigation Controls */}
      <Stack 
        direction="row" 
        spacing={{ xs: 1, sm: 2 }}
        sx={{ mb: { xs: 1.5, sm: 2 } }}
      >
        <Button
          variant="outlined"
          startIcon={!isMobile && <NavigateBefore />}
          onClick={() => handleQuickNav('prev')}
          disabled={current <= start}
          size={isMobile ? "small" : "medium"}
          fullWidth
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 1 }
          }}
        >
          {isMobile ? '← Prev' : 'Previous Hour'}
        </Button>
        
        <Button
          variant="outlined"
          endIcon={!isMobile && <NavigateNext />}
          onClick={() => handleQuickNav('next')}
          disabled={current >= end}
          size={isMobile ? "small" : "medium"}
          fullWidth
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.5, sm: 1 }
          }}
        >
          {isMobile ? 'Next →' : 'Next Hour'}
        </Button>
      </Stack>
      
      {/* Responsive Timeline Slider */}
      <Box sx={{ 
        px: { xs: 1, sm: 2, md: 3 }, 
        py: { xs: 2, sm: 3 },
        border: '1px solid #e0e0e0',
        borderRadius: { xs: 1, sm: 2 },
        bgcolor: '#fafafa',
        mb: { xs: 1, sm: 2 }
      }}>
        <Range
          step={1}
          min={0}
          max={totalHours}
          values={sliderMode === 'single' ? [currentHour] : rangeValues}
          onChange={handleSliderChange}
          renderTrack={({ props, children }) => (
            <div
              onMouseDown={props.onMouseDown}
              onTouchStart={props.onTouchStart}
              style={{
                ...props.style,
                height: isMobile ? '32px' : '40px',
                display: 'flex',
                width: '100%'
              }}
            >
              <div
                ref={props.ref}
                style={{
                  height: isMobile ? '6px' : '8px',
                  width: '100%',
                  borderRadius: isMobile ? '3px' : '4px',
                  background: sliderMode === 'single' 
                    ? 'linear-gradient(90deg, #bbdefb 0%, #64b5f6 50%, #1976d2 100%)'
                    : '#e0e0e0',
                  alignSelf: 'center',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                {/* Range selection highlight for dual-ended mode */}
                {sliderMode === 'range' && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(rangeValues[0] / totalHours) * 100}%`,
                      width: `${((rangeValues[1] - rangeValues[0]) / totalHours) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #64b5f6 0%, #1976d2 50%, #0d47a1 100%)',
                      borderRadius: 'inherit',
                      boxShadow: '0 2px 6px rgba(25, 118, 210, 0.3)'
                    }}
                  />
                )}
                {children}
              </div>
            </div>
          )}
          renderThumb={({ props, isDragged, index }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: isMobile ? '24px' : '28px',
                width: isMobile ? '24px' : '28px',
                borderRadius: '50%',
                backgroundColor: sliderMode === 'range' 
                  ? (index === 0 ? '#4caf50' : '#f44336') 
                  : '#1976d2',
                border: `${isMobile ? '2px' : '3px'} solid white`,
                boxShadow: isDragged ? 
                  '0 4px 12px rgba(25, 118, 210, 0.4)' : 
                  '0 2px 8px rgba(0,0,0,0.2)',
                outline: 'none',
                cursor: 'grab',
                transform: isDragged ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease',
                zIndex: isDragged ? 10 : 1
              }}
            >
              {/* Small indicator for range mode */}
              {sliderMode === 'range' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: index === 0 ? '#4caf50' : '#f44336'
                  }}
                />
              )}
            </div>
          )}
        />
        
        {/* Responsive tick marks */}
        <Box sx={{ 
          mt: { xs: 1, sm: 1.5 }, 
          display: 'flex', 
          justifyContent: 'space-between',
          px: { xs: 0.5, sm: 1 }
        }}>
          {ticks.map((tick, index) => {
            let isHighlighted = false
            if (sliderMode === 'single') {
              isHighlighted = Math.abs(tick.value - currentHour) <= 1
            } else {
              isHighlighted = tick.value >= rangeValues[0] && tick.value <= rangeValues[1]
            }
            
            return (
              <Typography 
                key={index} 
                variant="caption" 
                sx={{ 
                  color: isHighlighted ? '#1565c0' : 'text.secondary',
                  fontWeight: isHighlighted ? 600 : 400,
                  fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' },
                  textAlign: 'center',
                  maxWidth: { xs: '60px', sm: '80px', md: '100px' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  transform: { xs: 'rotate(-15deg)', sm: 'rotate(0deg)' },
                  transformOrigin: 'center'
                }}
              >
                {tick.label}
              </Typography>
            )
          })}
        </Box>
      </Box>
      
      {/* Responsive Time Information */}
      <Box sx={{ 
        bgcolor: '#e3f2fd', 
        p: { xs: 1, sm: 1.5 }, 
        borderRadius: { xs: 1, sm: 2 },
        border: '1px solid #bbdefb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 0.5, sm: 1 }
      }}>
        {sliderMode === 'single' ? (
          <Typography 
            variant="body2" 
            sx={{
              color: '#1565c0',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              textAlign: 'center'
            }}
          >
            <strong>{format(current, isMobile ? 'MM/dd/yyyy' : 'MMMM dd, yyyy')}</strong>
            {!isMobile && ' at '}
            {isMobile && <br />}
            <strong>{format(current, 'HH:mm')} UTC</strong>
          </Typography>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={1}>
            <Typography 
              variant="body2" 
              sx={{
                color: '#1565c0',
                fontWeight: 500,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                textAlign: 'center'
              }}
            >
              <strong>Range:</strong> {format(addHours(start, rangeValues[0]), 'MMM dd, HH:mm')} 
              {' → '} {format(addHours(start, rangeValues[1]), 'MMM dd, HH:mm')}
            </Typography>
            <Chip 
              label={`${rangeValues[1] - rangeValues[0]} hours`}
              size="small"
              sx={{ 
                bgcolor: '#bbdefb',
                color: '#1565c0',
                fontWeight: 600
              }}
            />
          </Stack>
        )}
      </Box>
    </Box>
  )
}

export default TimelineSlider
