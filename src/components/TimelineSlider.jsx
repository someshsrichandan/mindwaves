import { useCallback, useState, useEffect } from 'react'
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
  useTheme
} from '@mui/material'
import {
  Schedule,
  NavigateBefore,
  NavigateNext,
  AccessTime
} from '@mui/icons-material'

const TimelineSlider = ({ timelineRange, onChange }) => {
  const { start, end, current } = timelineRange
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  
  // Convert dates to hours for the slider
  const totalHours = differenceInHours(end, start)
  const currentHour = differenceInHours(current, start)
  
  // Handle slider change
  const handleSliderChange = useCallback((values) => {
    const newCurrentDate = addHours(start, values[0])
    onChange({
      ...timelineRange,
      current: newCurrentDate
    })
  }, [start, timelineRange, onChange])
  
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
      {/* Responsive Header Section */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        spacing={{ xs: 1, sm: 2 }}
        sx={{ mb: { xs: 1, sm: 2 } }}
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
        
        {/* Current Time Display */}
        <Tooltip title="Current selected time">
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
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              color: '#1565c0',
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              whiteSpace: 'nowrap'
            }}>
              {format(current, isMobile ? 'MM/dd HH:mm' : 'MMM dd, HH:mm')}
            </Typography>
          </Paper>
        </Tooltip>
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
          values={[currentHour]}
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
                  background: 'linear-gradient(90deg, #bbdefb 0%, #64b5f6 50%, #1976d2 100%)',
                  alignSelf: 'center',
                  position: 'relative',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }}
              >
                {children}
              </div>
            </div>
          )}
          renderThumb={({ props, isDragged }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: isMobile ? '24px' : '28px',
                width: isMobile ? '24px' : '28px',
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                border: `${isMobile ? '2px' : '3px'} solid white`,
                boxShadow: isDragged ? 
                  '0 4px 12px rgba(25, 118, 210, 0.4)' : 
                  '0 2px 8px rgba(0,0,0,0.2)',
                outline: 'none',
                cursor: 'grab',
                transform: isDragged ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.2s ease'
              }}
            />
          )}
        />
        
        {/* Responsive tick marks */}
        <Box sx={{ 
          mt: { xs: 1, sm: 1.5 }, 
          display: 'flex', 
          justifyContent: 'space-between',
          px: { xs: 0.5, sm: 1 }
        }}>
          {ticks.map((tick, index) => (
            <Typography 
              key={index} 
              variant="caption" 
              sx={{ 
                color: Math.abs(tick.value - currentHour) <= 1 ? '#1565c0' : 'text.secondary',
                fontWeight: Math.abs(tick.value - currentHour) <= 1 ? 600 : 400,
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
          ))}
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
      </Box>
    </Box>
  )
}

export default TimelineSlider
