import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Chip,
  Badge,
  Stack,
  Alert
} from '@mui/material'
import {
  Mouse,
  Edit,
  KeyboardReturn,
  TouchApp,
  Cancel,
  Info,
  ZoomIn,
  PanTool,
  Delete,
  LocationOn
} from '@mui/icons-material'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Map resize handler component
const MapResizeHandler = () => {
  const map = useMap()
  
  useEffect(() => {
    const resizeMap = () => {
      setTimeout(() => {
        map.invalidateSize()
      }, 100)
    }
    
    // Initial resize
    resizeMap()
    
    // Listen for window resize
    window.addEventListener('resize', resizeMap)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeMap)
    }
  }, [map])
  
  return null
}

// Drawing component for polygon creation with enhanced feedback
const DrawingControl = ({ 
  isDrawing, 
  onPolygonCreated, 
  currentPolygon, 
  setCurrentPolygon,
  isDrawingActive,
  setIsDrawingActive
}) => {
  
  useMapEvents({
    click: (e) => {
      if (!isDrawing) return
      
      // Prevent map click events when drawing
      e.originalEvent.stopPropagation()
      
      const { lat, lng } = e.latlng
      const newPoint = [lng, lat] // GeoJSON format: [longitude, latitude]
      
      if (!isDrawingActive) {
        // Start new polygon
        setCurrentPolygon([newPoint])
        setIsDrawingActive(true)
        console.log('Started drawing polygon')
      } else {
        // Add point to current polygon
        const updatedPolygon = [...currentPolygon, newPoint]
        setCurrentPolygon(updatedPolygon)
        console.log(`Added point ${updatedPolygon.length} to polygon`)
        
        // Complete polygon if we have at least 3 points and user double-clicks
        if (updatedPolygon.length >= 3) {
          // Auto-complete on double-click or if close to start point
          const firstPoint = updatedPolygon[0]
          const distance = Math.sqrt(
            Math.pow(newPoint[0] - firstPoint[0], 2) + 
            Math.pow(newPoint[1] - firstPoint[1], 2)
          )
          
          // If close to start point (within ~500m in degrees), complete polygon
          if (distance < 0.005) {
            const completedPolygon = {
              coordinates: [[...updatedPolygon, updatedPolygon[0]]] // Close the polygon
            }
            onPolygonCreated(completedPolygon)
            setCurrentPolygon([])
            setIsDrawingActive(false)
            console.log('Completed polygon by proximity to start')
          }
        }
      }
    },
    
    dblclick: (e) => {
      if (isDrawing && isDrawingActive && currentPolygon.length >= 3) {
        e.originalEvent.stopPropagation()
        const completedPolygon = {
          coordinates: [[...currentPolygon, currentPolygon[0]]] // Close the polygon
        }
        onPolygonCreated(completedPolygon)
        setCurrentPolygon([])
        setIsDrawingActive(false)
        console.log('Completed polygon by double-click')
      }
    },
    
    keydown: (e) => {
      // Press Escape to cancel current drawing
      if (e.originalEvent.key === 'Escape' && isDrawingActive) {
        setCurrentPolygon([])
        setIsDrawingActive(false)
        console.log('Cancelled drawing')
      }
      
      // Press Enter to complete polygon (minimum 3 points)
      if (e.originalEvent.key === 'Enter' && isDrawingActive && currentPolygon.length >= 3) {
        const completedPolygon = {
          coordinates: [[...currentPolygon, currentPolygon[0]]] // Close the polygon
        }
        onPolygonCreated(completedPolygon)
        setCurrentPolygon([])
        setIsDrawingActive(false)
        console.log('Completed polygon by Enter key')
      }
    }
  })
  
  // Reset drawing when isDrawing changes
  useEffect(() => {
    if (!isDrawing) {
      setCurrentPolygon([])
      setIsDrawingActive(false)
    }
  }, [isDrawing, setCurrentPolygon, setIsDrawingActive])
  
  // Render current polygon being drawn
  if (isDrawingActive && currentPolygon.length >= 2) {
    // Convert to Leaflet format for display
    const leafletCoords = currentPolygon.map(coord => [coord[1], coord[0]])
    return (
      <Polygon
        positions={leafletCoords}
        pathOptions={{
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.3,
          weight: 3,
          dashArray: '10, 5',
          opacity: 0.8
        }}
      />
    )
  }
  
  return null
}

// Component to handle map centering
const MapController = () => {
  const map = useMap()
  
  useEffect(() => {
    // Center on a reasonable default location (e.g., central Europe)
    map.setView([50.0, 10.0], 6)
  }, [map])
  
  return null
}

const MapComponent = ({ polygons, isDrawing, isLoading, onPolygonCreated, onPolygonDelete, getWeatherDescription }) => {
  const mapRef = useRef()
  const [currentPolygon, setCurrentPolygon] = useState([])
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  
  // Handle polygon click for deletion (when not drawing)
  const handlePolygonClick = (polygon) => {
    if (!isDrawing) {
      const confirmDelete = window.confirm('Delete this polygon?')
      if (confirmDelete) {
        onPolygonDelete(polygon.id)
      }
    }
  }
  
  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      overflow: 'hidden',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <MapContainer
        ref={mapRef}
        center={[39.8283, -98.5795]} // Center of USA for better initial view
        zoom={4}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        touchZoom={true}
        dragging={true}
        style={{ 
          width: '100%', 
          height: '100%', 
          borderRadius: '8px',
          cursor: isDrawing ? 'crosshair' : 'grab'
        }}
        maxZoom={18}
        minZoom={2}
        zoomSnap={0.5}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={60}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          minZoom={1}
          keepBuffer={4}
          updateWhenZooming={true}
          updateWhenIdle={false}
        />
        
        <MapResizeHandler />
        <MapController />
        
        {/* Drawing Control */}
        <DrawingControl 
          isDrawing={isDrawing} 
          onPolygonCreated={onPolygonCreated}
          currentPolygon={currentPolygon}
          setCurrentPolygon={setCurrentPolygon}
          isDrawingActive={isDrawingActive}
          setIsDrawingActive={setIsDrawingActive}
        />
        
        {/* Render existing polygons with enhanced data popups */}
        {polygons.map((polygon) => {
          // Convert from GeoJSON to Leaflet format
          const leafletCoords = polygon.coordinates[0].map(coord => [coord[1], coord[0]])
          
          return (
            <Polygon
              key={polygon.id}
              positions={leafletCoords}
              pathOptions={{
                color: polygon.color,
                fillColor: polygon.color,
                fillOpacity: isLoading ? 0.4 : 0.7,
                weight: 3,
                opacity: isLoading ? 0.6 : 0.9,
                dashArray: isLoading ? '5, 5' : null
              }}
              eventHandlers={{
                click: () => handlePolygonClick(polygon),
                mouseover: (e) => {
                  e.target.setStyle({
                    weight: 4,
                    fillOpacity: isLoading ? 0.5 : 0.8
                  })
                },
                mouseout: (e) => {
                  e.target.setStyle({
                    weight: 3,
                    fillOpacity: isLoading ? 0.4 : 0.7
                  })
                }
              }}
            >
              <Popup maxWidth={350} minWidth={250}>
                <Box sx={{ p: 1, minWidth: 200 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <LocationOn sx={{ color: polygon.color, fontSize: 18 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#1565c0' }}>
                      Weather Data
                    </Typography>
                    <Chip 
                      label={`ID: ${polygon.id}`} 
                      size="small" 
                      sx={{ 
                        bgcolor: '#e3f2fd',
                        color: '#1565c0',
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Stack>

                  {polygon.data ? (
                    polygon.data.error ? (
                      <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                        {polygon.data.error}
                      </Alert>
                    ) : (
                      <Stack spacing={1.5}>
                        {/* Data Type Indicator */}
                        <Chip
                          label={polygon.data.isRangeData ? "Range Average Data" : "Point-in-Time Data"}
                          size="small"
                          sx={{
                            bgcolor: polygon.data.isRangeData ? '#fff3e0' : '#e8f5e8',
                            color: polygon.data.isRangeData ? '#e65100' : '#2e7d32',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />

                        {/* Weather condition */}
                        {polygon.data.weather_code !== null && polygon.data.weather_code !== undefined && getWeatherDescription && (
                          <Box sx={{ 
                            bgcolor: '#e3f2fd', 
                            p: 1, 
                            borderRadius: 1, 
                            border: '1px solid #bbdefb',
                            mb: 1
                          }}>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 600, 
                              color: '#1565c0',
                              textAlign: 'center',
                              fontSize: '0.9rem'
                            }}>
                              {getWeatherDescription(polygon.data.weather_code)}
                            </Typography>
                          </Box>
                        )}

                        {/* Weather Parameters */}
                        <Stack spacing={1}>
                          {polygon.data.temperature_2m !== null && polygon.data.temperature_2m !== undefined && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                🌡️ Temperature:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600, 
                                color: polygon.data.temperature_2m > 20 ? '#d32f2f' : polygon.data.temperature_2m > 10 ? '#ed6c02' : '#1976d2'
                              }}>
                                {polygon.data.temperature_2m.toFixed(1)}°C
                              </Typography>
                            </Stack>
                          )}

                          {polygon.data.relative_humidity_2m !== null && polygon.data.relative_humidity_2m !== undefined && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                💧 Humidity:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600, 
                                color: polygon.data.relative_humidity_2m > 80 ? '#1976d2' : '#666'
                              }}>
                                {polygon.data.relative_humidity_2m.toFixed(1)}%
                              </Typography>
                            </Stack>
                          )}

                          {polygon.data.precipitation !== null && polygon.data.precipitation !== undefined && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                🌧️ Precipitation:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600, 
                                color: polygon.data.precipitation > 0 ? '#1976d2' : '#666'
                              }}>
                                {polygon.data.precipitation.toFixed(1)} mm
                              </Typography>
                            </Stack>
                          )}

                          {polygon.data.wind_speed_10m !== null && polygon.data.wind_speed_10m !== undefined && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                💨 Wind Speed:
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                fontWeight: 600, 
                                color: polygon.data.wind_speed_10m > 20 ? '#d32f2f' : '#666'
                              }}>
                                {polygon.data.wind_speed_10m.toFixed(1)} km/h
                              </Typography>
                            </Stack>
                          )}

                          {polygon.data.wind_direction_10m !== null && polygon.data.wind_direction_10m !== undefined && (
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                🧭 Wind Direction:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666' }}>
                                {polygon.data.wind_direction_10m.toFixed(0)}°
                              </Typography>
                            </Stack>
                          )}
                        </Stack>

                        {/* Range-specific information */}
                        {polygon.data.isRangeData && polygon.data.rangeLength && (
                          <Box sx={{ 
                            bgcolor: '#f5f5f5', 
                            p: 1, 
                            borderRadius: 1, 
                            border: '1px solid #e0e0e0' 
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: '#666', 
                              fontWeight: 500,
                              display: 'block',
                              textAlign: 'center'
                            }}>
                              📊 Average over {polygon.data.rangeLength} hours
                            </Typography>
                          </Box>
                        )}

                        {/* Last updated */}
                        {polygon.lastUpdated && (
                          <Typography variant="caption" sx={{ 
                            color: '#999', 
                            textAlign: 'center',
                            display: 'block',
                            fontSize: '0.7rem'
                          }}>
                            Last updated: {new Date(polygon.lastUpdated).toLocaleTimeString()}
                          </Typography>
                        )}

                        {/* Delete button */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <Chip
                            label="Delete Polygon"
                            icon={<Delete />}
                            onClick={() => onPolygonDelete(polygon.id)}
                            size="small"
                            sx={{
                              bgcolor: '#ffebee',
                              color: '#d32f2f',
                              '&:hover': {
                                bgcolor: '#ffcdd2'
                              },
                              cursor: 'pointer'
                            }}
                          />
                        </Box>
                      </Stack>
                    )
                  ) : (
                    <Stack alignItems="center" spacing={1}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        p: 1,
                        bgcolor: '#f5f5f5',
                        borderRadius: 1
                      }}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            border: '2px solid #1976d2',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            '@keyframes spin': {
                              '0%': { transform: 'rotate(0deg)' },
                              '100%': { transform: 'rotate(360deg)' }
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Loading weather data...
                        </Typography>
                      </Box>
                      <Chip
                        label="Delete Polygon"
                        icon={<Delete />}
                        onClick={() => onPolygonDelete(polygon.id)}
                        size="small"
                        sx={{
                          bgcolor: '#ffebee',
                          color: '#d32f2f',
                          '&:hover': {
                            bgcolor: '#ffcdd2'
                          },
                          cursor: 'pointer'
                        }}
                      />
                    </Stack>
                  )}
                </Box>
              </Popup>
            </Polygon>
          )
        })}
      </MapContainer>
      
      {/* Enhanced Drawing Instructions */}
      {isDrawing && (
        <Card sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          maxWidth: 320,
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f8f9ff 100%)',
          border: '2px solid #2196f3',
          borderRadius: 3,
          boxShadow: '0 12px 40px rgba(33, 150, 243, 0.2)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Edit sx={{ color: '#1976d2', fontSize: 20 }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#1565c0' }}>
                🎯 Drawing Mode Active
              </Typography>
            </Stack>
            
            <Alert 
              severity="info" 
              sx={{ 
                mb: 2, 
                fontSize: '0.85rem',
                '& .MuiAlert-icon': { fontSize: '1.1rem' }
              }}
            >
              Create polygons to analyze weather data in specific regions
            </Alert>
            
            <List dense sx={{ p: 0 }}>
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Mouse sx={{ fontSize: 16, color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Click on map to add polygon points" 
                  primaryTypographyProps={{ 
                    variant: 'body2', 
                    color: '#1565c0',
                    fontWeight: 500
                  }} 
                />
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <TouchApp sx={{ fontSize: 16, color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="#1565c0" fontWeight={500}>
                      Double-click to complete polygon
                    </Typography>
                  </Stack>
                </ListItemText>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <KeyboardReturn sx={{ fontSize: 16, color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="#1565c0" fontWeight={500}>
                      Press
                    </Typography>
                    <Chip 
                      label="Enter" 
                      size="small" 
                      sx={{ 
                        bgcolor: '#2196f3', 
                        color: 'white',
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Typography variant="body2" color="#1565c0" fontWeight={500}>
                      to finish
                    </Typography>
                  </Stack>
                </ListItemText>
              </ListItem>
              
              <ListItem sx={{ px: 0, py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <Cancel sx={{ fontSize: 16, color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" color="#1565c0" fontWeight={500}>
                      Press
                    </Typography>
                    <Chip 
                      label="Escape" 
                      size="small" 
                      sx={{ 
                        bgcolor: '#f44336', 
                        color: 'white',
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Typography variant="body2" color="#1565c0" fontWeight={500}>
                      to cancel
                    </Typography>
                  </Stack>
                </ListItemText>
              </ListItem>
            </List>
            
            {currentPolygon.length > 0 && (
              <Box sx={{ 
                mt: 2, 
                p: 1.5, 
                bgcolor: 'rgba(33, 150, 243, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(33, 150, 243, 0.3)'
              }}>
                <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 600 }}>
                  📍 Points added: {currentPolygon.length}
                </Typography>
                {currentPolygon.length >= 3 && (
                  <Typography variant="caption" sx={{ color: '#1976d2' }}>
                    Ready to complete polygon!
                  </Typography>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Polygon Counter Badge */}
      {polygons.length > 0 && (
        <Paper sx={{
          position: 'absolute',
          top: 80,
          right: 20,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          px: 2,
          py: 1,
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
        }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOn sx={{ fontSize: 16 }} />
            <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.875rem' }}>
              {polygons.length} Region{polygons.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* Global Loading Overlay */}
      {isLoading && (
        <Box sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          px: 2,
          py: 1,
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Box
            sx={{
              width: 20,
              height: 20,
              border: '3px solid #e3f2fd',
              borderTop: '3px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
          <Typography variant="body2" sx={{ 
            color: '#1976d2', 
            fontWeight: 600,
            fontSize: '0.9rem'
          }}>
            Fetching weather data...
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default MapComponent
