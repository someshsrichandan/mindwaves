import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material'
import {
  Menu as MenuIcon
} from '@mui/icons-material'
import TimelineSlider from './TimelineSlider'
import MapComponent from './MapComponent'
import DataSourceSidebar from './DataSourceSidebar'
import { format, addDays, subDays } from 'date-fns'

const Dashboard = () => {
  // Responsive hooks
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  // Timeline state - 30 days window (15 days before and after today)
  const today = new Date()
  const startDate = subDays(today, 15)
  const endDate = addDays(today, 15)
  
  const [timelineRange, setTimelineRange] = useState({
    start: startDate,
    end: endDate,
    current: today
  })
  
  // Data sources state
  const [dataSources, setDataSources] = useState([
    {
      id: 'temperature',
      name: 'Temperature',
      field: 'temperature_2m',
      color: '#ef4444',
      threshold: '< 10',
      operator: '<',
      value: 10,
      active: true
    }
  ])
  
  // Polygons state
  const [polygons, setPolygons] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState('temperature')
  
  // Weather data cache
  const [weatherData, setWeatherData] = useState({})
  
  // Handle timeline change
  const handleTimelineChange = (newRange) => {
    setTimelineRange(newRange)
    // Trigger data refresh for all polygons
    refreshPolygonData()
  }
  
  // Handle polygon creation
  const handlePolygonCreated = (polygon) => {
    const newPolygon = {
      id: Date.now().toString(),
      coordinates: polygon.coordinates,
      dataSource: selectedDataSource,
      data: null,
      color: getPolygonColor(null, selectedDataSource)
    }
    
    setPolygons(prev => [...prev, newPolygon])
    fetchPolygonData(newPolygon)
  }
  
  // Handle polygon deletion
  const handlePolygonDelete = (polygonId) => {
    setPolygons(prev => prev.filter(p => p.id !== polygonId))
  }
  
  // Get polygon color based on data and rules
  const getPolygonColor = useCallback((data, dataSourceId) => {
    const dataSource = dataSources.find(ds => ds.id === dataSourceId)
    if (!dataSource || !data) return '#94a3b8' // Default gray
    
    const value = data[dataSource.field]
    if (value === undefined) return '#94a3b8'
    
    // Apply color rules
    const { operator, value: threshold } = dataSource
    let matches = false
    
    switch (operator) {
      case '<':
        matches = value < threshold
        break
      case '>':
        matches = value > threshold
        break
      case '<=':
        matches = value <= threshold
        break
      case '>=':
        matches = value >= threshold
        break
      case '=':
        matches = value === threshold
        break
      default:
        matches = false
    }
    
    return matches ? dataSource.color : '#94a3b8'
  }, [dataSources])
  
  // Fetch weather data for a polygon
  const fetchPolygonData = async (polygon) => {
    try {
      // Calculate polygon centroid for API call
      const coords = polygon.coordinates[0]
      const lat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length
      const lng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length
      
      const startDateStr = format(timelineRange.start, 'yyyy-MM-dd')
      const endDateStr = format(timelineRange.end, 'yyyy-MM-dd')
      const currentHour = format(timelineRange.current, 'yyyy-MM-dd\'T\'HH:00')
      
      // Open-Meteo API call
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDateStr}&end_date=${endDateStr}&hourly=temperature_2m&timezone=auto`
      )
      
      const data = await response.json()
      
      if (data.hourly) {
        // Find data for current timeline position
        const hourIndex = data.hourly.time.findIndex(time => time === currentHour)
        const currentData = {
          temperature_2m: hourIndex >= 0 ? data.hourly.temperature_2m[hourIndex] : null
        }
        
        // Update polygon with current data
        setPolygons(prev => prev.map(p => 
          p.id === polygon.id 
            ? { 
                ...p, 
                data: currentData,
                color: getPolygonColor(currentData, p.dataSource)
              }
            : p
        ))
        
        // Cache the full dataset
        setWeatherData(prev => ({
          ...prev,
          [polygon.id]: data.hourly
        }))
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
    }
  }
  
  // Refresh data for all polygons when timeline changes
  const refreshPolygonData = () => {
    polygons.forEach(polygon => {
      const cachedData = weatherData[polygon.id]
      if (cachedData) {
        const currentHour = format(timelineRange.current, 'yyyy-MM-dd\'T\'HH:00')
        const hourIndex = cachedData.time.findIndex(time => time === currentHour)
        const currentData = {
          temperature_2m: hourIndex >= 0 ? cachedData.temperature_2m[hourIndex] : null
        }
        
        setPolygons(prev => prev.map(p => 
          p.id === polygon.id 
            ? { 
                ...p, 
                data: currentData,
                color: getPolygonColor(currentData, p.dataSource)
              }
            : p
        ))
      } else {
        // Fetch fresh data if not cached
        fetchPolygonData(polygon)
      }
    })
  }
  
  // Update polygon colors when data sources change
  useEffect(() => {
    setPolygons(prev => prev.map(polygon => ({
      ...polygon,
      color: getPolygonColor(polygon.data, polygon.dataSource)
    })))
  }, [dataSources, getPolygonColor])
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawerWidth = 320

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar 
          position="fixed" 
          sx={{ 
            width: '100%',
            zIndex: theme.zIndex.drawer + 1,
            bgcolor: 'white',
            color: 'primary.main'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div"
              sx={{ 
                fontWeight: 600,
                fontSize: { xs: '1rem', sm: '1.25rem' }
              }}
            >
              🌍 Weather Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Responsive Sidebar */}
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* Mobile drawer */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
              },
            }}
          >
            <DataSourceSidebar
              dataSources={dataSources}
              onDataSourcesChange={setDataSources}
              selectedDataSource={selectedDataSource}
              onSelectedDataSourceChange={setSelectedDataSource}
              polygons={polygons}
            />
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                borderRight: 'none'
              },
            }}
            open
          >
            <DataSourceSidebar
              dataSources={dataSources}
              onDataSourcesChange={setDataSources}
              selectedDataSource={selectedDataSource}
              onSelectedDataSourceChange={setSelectedDataSource}
              polygons={polygons}
            />
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: { 
            xs: '100%', 
            md: `calc(100% - ${drawerWidth}px)` 
          },
          mt: { xs: 7, md: 0 }, // Account for mobile app bar
          overflow: 'hidden',
          backgroundColor: '#f5f7fa',
        }}
      >
        {/* Desktop Header */}
        {!isMobile && (
          <AppBar 
            position="static" 
            elevation={1}
            sx={{ 
              backgroundColor: 'white',
              color: '#1976d2',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <Toolbar sx={{ py: 1 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography 
                  variant="h5" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 600, 
                    color: '#1565c0',
                    fontSize: { md: '1.25rem', lg: '1.5rem' }
                  }}
                >
                  🌍 Weather Data Dashboard
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666', 
                    mt: 0.5,
                    fontSize: { md: '0.75rem', lg: '0.875rem' }
                  }}
                >
                  Interactive map with timeline-based weather data visualization
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        {/* Timeline Section */}
        <Box 
          sx={{ 
            backgroundColor: 'white',
            borderBottom: '1px solid #e0e0e0',
            zIndex: 2
          }}
        >
          <TimelineSlider 
            timelineRange={timelineRange}
            onChange={handleTimelineChange}
          />
        </Box>

        {/* Map Section */}
        <Box 
          sx={{ 
            flexGrow: 1,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 0
          }}
        >
          <MapComponent
            polygons={polygons}
            isDrawing={isDrawing}
            onPolygonCreated={handlePolygonCreated}
            onPolygonDelete={handlePolygonDelete}
          />
          
          {/* Responsive Drawing Controls */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 8, sm: 16 },
              left: { xs: 8, sm: 16 },
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}
          >
            <Box
              component="button"
              onClick={() => setIsDrawing(!isDrawing)}
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                border: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                cursor: 'pointer',
                boxShadow: 3,
                transition: 'all 0.3s ease',
                backgroundColor: isDrawing ? '#f44336' : '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: isDrawing ? '#d32f2f' : '#1565c0',
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}
            >
              {isDrawing ? 'Stop Drawing' : 'Draw Polygon'}
            </Box>
            
            {polygons.length > 0 && (
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 1,
                  px: { xs: 1.5, sm: 2 },
                  py: { xs: 0.5, sm: 1 },
                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                  color: '#666',
                  fontWeight: 500,
                  boxShadow: 2
                }}
              >
                Polygons: {polygons.length}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Dashboard
