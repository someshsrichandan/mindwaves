import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Drawing component for polygon creation
const DrawingControl = ({ isDrawing, onPolygonCreated }) => {
  const [currentPolygon, setCurrentPolygon] = useState([])
  const [isDrawingActive, setIsDrawingActive] = useState(false)
  
  useMapEvents({
    click: (e) => {
      if (!isDrawing) return
      
      const { lat, lng } = e.latlng
      const newPoint = [lng, lat] // GeoJSON format: [longitude, latitude]
      
      if (!isDrawingActive) {
        // Start new polygon
        setCurrentPolygon([newPoint])
        setIsDrawingActive(true)
      } else {
        // Add point to current polygon
        const updatedPolygon = [...currentPolygon, newPoint]
        setCurrentPolygon(updatedPolygon)
        
        // Complete polygon if we have at least 3 points and user clicks near start
        if (updatedPolygon.length >= 3) {
          const firstPoint = updatedPolygon[0]
          const distance = Math.sqrt(
            Math.pow(newPoint[0] - firstPoint[0], 2) + 
            Math.pow(newPoint[1] - firstPoint[1], 2)
          )
          
          // If close to start point (within ~100m in degrees), complete polygon
          if (distance < 0.001) {
            const completedPolygon = {
              coordinates: [updatedPolygon] // GeoJSON Polygon format
            }
            onPolygonCreated(completedPolygon)
            setCurrentPolygon([])
            setIsDrawingActive(false)
          }
        }
      }
    },
    
    keydown: (e) => {
      // Press Escape to cancel current drawing
      if (e.originalEvent.key === 'Escape' && isDrawingActive) {
        setCurrentPolygon([])
        setIsDrawingActive(false)
      }
      
      // Press Enter to complete polygon (minimum 3 points)
      if (e.originalEvent.key === 'Enter' && isDrawingActive && currentPolygon.length >= 3) {
        const completedPolygon = {
          coordinates: [[...currentPolygon, currentPolygon[0]]] // Close the polygon
        }
        onPolygonCreated(completedPolygon)
        setCurrentPolygon([])
        setIsDrawingActive(false)
      }
    }
  })
  
  // Reset drawing when isDrawing changes
  useEffect(() => {
    if (!isDrawing) {
      setCurrentPolygon([])
      setIsDrawingActive(false)
    }
  }, [isDrawing])
  
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
          fillOpacity: 0.2,
          weight: 2,
          dashArray: '5, 5'
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

const MapComponent = ({ polygons, isDrawing, onPolygonCreated, onPolygonDelete }) => {
  const mapRef = useRef()
  
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
    <div className="w-full h-full relative">
      <MapContainer
        ref={mapRef}
        center={[50.0, 10.0]}
        zoom={6}
        className="w-full h-full"
        style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <MapController />
        
        {/* Drawing Control */}
        <DrawingControl 
          isDrawing={isDrawing} 
          onPolygonCreated={onPolygonCreated} 
        />
        
        {/* Render existing polygons */}
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
                fillOpacity: 0.6,
                weight: 2,
                opacity: 0.8
              }}
              eventHandlers={{
                click: () => handlePolygonClick(polygon)
              }}
            >
              {/* You could add a popup here showing polygon data */}
            </Polygon>
          )
        })}
      </MapContainer>
      
      {/* Drawing Instructions */}
      {isDrawing && (
        <div className="absolute top-16 left-4 bg-yellow-100 border border-yellow-300 rounded-lg p-3 z-[1000] max-w-xs">
          <h4 className="font-medium text-yellow-800 mb-2">Drawing Mode Active</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Click on map to add points</li>
            <li>• Minimum 3 points required</li>
            <li>• Press Enter to complete polygon</li>
            <li>• Click near start point to auto-complete</li>
            <li>• Press Escape to cancel</li>
          </ul>
        </div>
      )}
      
      {/* Map Info */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-2 text-xs text-gray-600 z-[1000]">
        <div>Zoom: Use mouse wheel</div>
        <div>Pan: Click and drag</div>
        {polygons.length > 0 && <div>Click polygons to delete</div>}
      </div>
    </div>
  )
}

export default MapComponent
