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
import { addDays, subDays, differenceInHours } from 'date-fns'

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
  
  // Data sources state - enhanced with multiple weather parameters
  const [dataSources, setDataSources] = useState([
    {
      id: 'temperature',
      name: 'Temperature',
      field: 'temperature_2m',
      color: '#ef4444',
      threshold: '< 10',
      operator: '<',
      value: 10,
      active: true,
      unit: '°C'
    },
    {
      id: 'humidity',
      name: 'Humidity',
      field: 'relative_humidity_2m',
      color: '#3b82f6',
      threshold: '> 80',
      operator: '>',
      value: 80,
      active: false,
      unit: '%'
    },
    {
      id: 'precipitation',
      name: 'Precipitation',
      field: 'precipitation',
      color: '#06b6d4',
      threshold: '> 0',
      operator: '>',
      value: 0,
      active: false,
      unit: 'mm'
    },
    {
      id: 'wind',
      name: 'Wind Speed',
      field: 'wind_speed_10m',
      color: '#10b981',
      threshold: '> 20',
      operator: '>',
      value: 20,
      active: false,
      unit: 'km/h'
    }
  ])
  
  // Polygons state
  const [polygons, setPolygons] = useState([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState('temperature')
  const [isLoading, setIsLoading] = useState(false)
  
  // Weather data cache
  const [weatherData, setWeatherData] = useState({})
  
  // Weather code decoder for Open-Meteo
  const getWeatherDescription = (code) => {
    const weatherCodes = {
      0: '☀️ Clear sky',
      1: '🌤️ Mainly clear',
      2: '⛅ Partly cloudy',
      3: '☁️ Overcast',
      45: '🌫️ Fog',
      48: '🌫️ Depositing rime fog',
      51: '🌦️ Light drizzle',
      53: '🌧️ Moderate drizzle',
      55: '🌧️ Dense drizzle',
      61: '🌧️ Slight rain',
      63: '🌧️ Moderate rain',
      65: '🌧️ Heavy rain',
      71: '🌨️ Slight snow',
      73: '🌨️ Moderate snow',
      75: '🌨️ Heavy snow',
      77: '❄️ Snow grains',
      80: '🌦️ Slight rain showers',
      81: '🌧️ Moderate rain showers',
      82: '⛈️ Violent rain showers',
      85: '🌨️ Slight snow showers',
      86: '🌨️ Heavy snow showers',
      95: '⛈️ Thunderstorm',
      96: '⛈️ Thunderstorm with hail',
      99: '⛈️ Thunderstorm with heavy hail'
    }
    return weatherCodes[code] || `🌤️ Weather code ${code}`
  }
  
  // Handle timeline change - dynamic updates
  const handleTimelineChange = (newRange) => {
    setTimelineRange(newRange)
    // Trigger immediate data refresh for all polygons
    setTimeout(() => {
      refreshPolygonData(newRange)
    }, 100)
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

  // Create test polygon for testing weather data
  const createTestPolygon = () => {
    const testPolygon = {
      id: Date.now().toString(),
      coordinates: [[
        [-74.0, 40.7], // New York area (roughly)
        [-74.1, 40.7],
        [-74.1, 40.8],
        [-74.0, 40.8],
        [-74.0, 40.7]
      ]],
      dataSource: selectedDataSource,
      data: null,
      color: getPolygonColor(null, selectedDataSource)
    }
    
    setPolygons(prev => [...prev, testPolygon])
    fetchPolygonData(testPolygon)
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
  
  // Fetch weather data for a polygon with enhanced API integration
  const fetchPolygonData = async (polygon, timeRange = timelineRange) => {
    setIsLoading(true)
    try {
      // Calculate polygon centroid for API call
      const coords = polygon.coordinates[0]
      const lat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length
      const lng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length
      
      console.log(`Fetching weather data for coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      
      // Use Open-Meteo current weather API (free and reliable)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&timezone=auto&forecast_days=1`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Weather API response:', data)
      
      if (data.current) {
        let currentData
        
        if (timeRange.rangeStart && timeRange.rangeEnd) {
          // Range mode - for now, use current data (can be enhanced later)
          currentData = {
            temperature_2m: data.current.temperature_2m,
            relative_humidity_2m: data.current.relative_humidity_2m,
            precipitation: data.current.precipitation || 0,
            wind_speed_10m: data.current.wind_speed_10m,
            wind_direction_10m: data.current.wind_direction_10m,
            weather_code: data.current.weather_code,
            isRangeData: true,
            rangeLength: Math.abs(differenceInHours(timeRange.rangeEnd, timeRange.rangeStart))
          }
        } else {
          // Single point mode - use current weather
          currentData = {
            temperature_2m: data.current.temperature_2m,
            relative_humidity_2m: data.current.relative_humidity_2m,
            precipitation: data.current.precipitation || 0,
            wind_speed_10m: data.current.wind_speed_10m,
            wind_direction_10m: data.current.wind_direction_10m,
            weather_code: data.current.weather_code,
            isRangeData: false
          }
        }
        
        console.log('Processed weather data:', currentData)
        
        // Update polygon with current data
        setPolygons(prev => prev.map(p => 
          p.id === polygon.id 
            ? { 
                ...p, 
                data: currentData,
                color: getPolygonColor(currentData, p.dataSource),
                lastUpdated: new Date().toISOString()
              }
            : p
        ))
        
        // Cache the hourly data if available
        if (data.hourly) {
          setWeatherData(prev => ({
            ...prev,
            [polygon.id]: data.hourly
          }))
        }
      } else {
        throw new Error('No weather data received from API')
      }
    } catch (error) {
      console.error('Error fetching weather data:', error)
      // Show error state on polygon
      setPolygons(prev => prev.map(p => 
        p.id === polygon.id 
          ? { 
              ...p, 
              data: { error: `Failed to fetch data: ${error.message}` },
              color: '#ef4444'
            }
          : p
      ))
    } finally {
      setIsLoading(false)
    }
  }
  
  // Refresh data for all polygons when timeline changes - enhanced with range support
  const refreshPolygonData = (timeRange = timelineRange) => {
    console.log('Refreshing polygon data for timeline change')
    polygons.forEach(polygon => {
      // For current weather API, we always fetch fresh data since it's current conditions
      // This ensures we get the most up-to-date weather information
      fetchPolygonData(polygon, timeRange)
    })
  }
  
  // Update polygon colors when data sources change
  useEffect(() => {
    setPolygons(prev => prev.map(polygon => ({
      ...polygon,
      color: getPolygonColor(polygon.data, polygon.dataSource)
    })))
  }, [dataSources, getPolygonColor])

  // Auto-refresh polygon data when timeline changes - Step 7 implementation
  useEffect(() => {
    if (polygons.length > 0) {
      const timeoutId = setTimeout(() => {
        refreshPolygonData(timelineRange)
      }, 200) // Small delay to avoid excessive API calls
      
      return () => clearTimeout(timeoutId)
    }
    // Only depend on timeline changes, not the function itself to avoid infinite loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRange.current, timelineRange.rangeStart, timelineRange.rangeEnd, polygons.length])

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
            isLoading={isLoading}
            onPolygonCreated={handlePolygonCreated}
            onPolygonDelete={handlePolygonDelete}
            getWeatherDescription={getWeatherDescription}
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

            {/* Test polygon button */}
            <Box
              component="button"
              onClick={createTestPolygon}
              sx={{
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                borderRadius: 2,
                border: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.7rem', sm: '0.8rem' },
                cursor: 'pointer',
                boxShadow: 3,
                transition: 'all 0.3s ease',
                backgroundColor: '#10b981',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#059669',
                  transform: 'translateY(-2px)',
                  boxShadow: 4
                }
              }}
            >
              🧪 Test NYC Weather
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
