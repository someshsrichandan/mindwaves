import { useState, useEffect, useCallback } from 'react'
import TimelineSlider from './TimelineSlider'
import MapComponent from './MapComponent'
import DataSourceSidebar from './DataSourceSidebar'
import { format, addDays, subDays } from 'date-fns'

const Dashboard = () => {
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
  
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-2xl font-bold text-gray-900">Weather Data Dashboard</h1>
        <p className="text-gray-600">Interactive map with timeline-based weather data visualization</p>
      </div>
      
      {/* Timeline Slider */}
      <div className="bg-white border-b border-gray-200 p-6">
        <TimelineSlider 
          timelineRange={timelineRange}
          onChange={handleTimelineChange}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Map Area */}
        <div className="flex-1 relative">
          <MapComponent
            polygons={polygons}
            isDrawing={isDrawing}
            onPolygonCreated={handlePolygonCreated}
            onPolygonDelete={handlePolygonDelete}
          />
          
          {/* Drawing Controls */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
            <button
              onClick={() => setIsDrawing(!isDrawing)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isDrawing 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isDrawing ? 'Stop Drawing' : 'Draw Polygon'}
            </button>
            
            {polygons.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                Polygons: {polygons.length}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-gray-50">
          <DataSourceSidebar
            dataSources={dataSources}
            onDataSourcesChange={setDataSources}
            selectedDataSource={selectedDataSource}
            onSelectedDataSourceChange={setSelectedDataSource}
            polygons={polygons}
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
