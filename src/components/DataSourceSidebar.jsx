import { useState } from 'react'

const DataSourceSidebar = ({ 
  dataSources, 
  onDataSourcesChange, 
  selectedDataSource, 
  onSelectedDataSourceChange,
  polygons 
}) => {
  const [newDataSource, setNewDataSource] = useState({
    name: '',
    field: 'temperature_2m',
    color: '#ef4444',
    operator: '<',
    value: 10
  })
  
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Available operators
  const operators = [
    { value: '<', label: '< (less than)' },
    { value: '>', label: '> (greater than)' },
    { value: '<=', label: '≤ (less or equal)' },
    { value: '>=', label: '≥ (greater or equal)' },
    { value: '=', label: '= (equal to)' }
  ]
  
  // Available fields from Open-Meteo API
  const availableFields = [
    { value: 'temperature_2m', label: 'Temperature (2m)' }
    // Can be extended with more fields like:
    // { value: 'relative_humidity_2m', label: 'Humidity (2m)' },
    // { value: 'precipitation', label: 'Precipitation' },
    // { value: 'wind_speed_10m', label: 'Wind Speed (10m)' }
  ]
  
  // Predefined colors
  const colorOptions = [
    '#ef4444', // Red
    '#f97316', // Orange  
    '#eab308', // Yellow
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#6b7280'  // Gray
  ]
  
  // Handle data source update
  const handleDataSourceUpdate = (id, field, value) => {
    const updatedSources = dataSources.map(ds => 
      ds.id === id ? { ...ds, [field]: value } : ds
    )
    onDataSourcesChange(updatedSources)
  }
  
  // Handle data source deletion
  const handleDataSourceDelete = (id) => {
    if (dataSources.length === 1) {
      alert('You must have at least one data source')
      return
    }
    
    const updatedSources = dataSources.filter(ds => ds.id !== id)
    onDataSourcesChange(updatedSources)
    
    // Update selected data source if deleted
    if (selectedDataSource === id && updatedSources.length > 0) {
      onSelectedDataSourceChange(updatedSources[0].id)
    }
  }
  
  // Handle adding new data source
  const handleAddDataSource = () => {
    if (!newDataSource.name.trim()) {
      alert('Please enter a name for the data source')
      return
    }
    
    const newSource = {
      ...newDataSource,
      id: Date.now().toString(),
      threshold: `${newDataSource.operator} ${newDataSource.value}`,
      active: true
    }
    
    onDataSourcesChange([...dataSources, newSource])
    setNewDataSource({
      name: '',
      field: 'temperature_2m',
      color: '#ef4444',
      operator: '<',
      value: 10
    })
    setShowAddForm(false)
  }
  
  // Format threshold display
  const formatThreshold = (operator, value) => {
    return `${operator} ${value}`
  }
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Data Sources</h2>
        <p className="text-sm text-gray-600 mt-1">
          Configure color rules for polygon visualization
        </p>
      </div>
      
      {/* Current Data Sources */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {dataSources.map((dataSource) => (
            <div 
              key={dataSource.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedDataSource === dataSource.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Data Source Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: dataSource.color }}
                  />
                  <h3 className="font-medium text-gray-900">{dataSource.name}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSelectedDataSourceChange(dataSource.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedDataSource === dataSource.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {selectedDataSource === dataSource.id ? 'Selected' : 'Select'}
                  </button>
                  {dataSources.length > 1 && (
                    <button
                      onClick={() => handleDataSourceDelete(dataSource.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              
              {/* Field Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data Field
                </label>
                <select
                  value={dataSource.field}
                  onChange={(e) => handleDataSourceUpdate(dataSource.id, 'field', e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  {availableFields.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Color Selection */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex space-x-1">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      onClick={() => handleDataSourceUpdate(dataSource.id, 'color', color)}
                      className={`w-6 h-6 rounded border-2 ${
                        dataSource.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Threshold Rules */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Color Rule
                </label>
                <div className="flex space-x-2">
                  <select
                    value={dataSource.operator}
                    onChange={(e) => handleDataSourceUpdate(dataSource.id, 'operator', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {operators.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={dataSource.value}
                    onChange={(e) => handleDataSourceUpdate(dataSource.id, 'value', parseFloat(e.target.value))}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                    step="0.1"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Show in color when: value {formatThreshold(dataSource.operator, dataSource.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add New Data Source */}
        <div className="mt-6">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Data Source
            </button>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">New Data Source</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newDataSource.name}
                    onChange={(e) => setNewDataSource({...newDataSource, name: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    placeholder="e.g., Cold Regions"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Field
                  </label>
                  <select
                    value={newDataSource.field}
                    onChange={(e) => setNewDataSource({...newDataSource, field: e.target.value})}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {availableFields.map(field => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex space-x-1">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewDataSource({...newDataSource, color})}
                        className={`w-6 h-6 rounded border-2 ${
                          newDataSource.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Rule
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={newDataSource.operator}
                      onChange={(e) => setNewDataSource({...newDataSource, operator: e.target.value})}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={newDataSource.value}
                      onChange={(e) => setNewDataSource({...newDataSource, value: parseFloat(e.target.value)})}
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={handleAddDataSource}
                  className="flex-1 bg-blue-500 text-white py-2 rounded text-sm hover:bg-blue-600"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Statistics */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">Statistics</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div>Data Sources: {dataSources.length}</div>
          <div>Polygons: {polygons.length}</div>
          <div>Active Source: {dataSources.find(ds => ds.id === selectedDataSource)?.name || 'None'}</div>
        </div>
        
        {polygons.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-700 mb-1">Polygon Data</h4>
            <div className="space-y-1">
              {polygons.map((polygon, index) => (
                <div key={polygon.id} className="flex items-center justify-between text-xs">
                  <span>Polygon {index + 1}</span>
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: polygon.color }}
                    />
                    <span className="text-gray-500">
                      {polygon.data?.temperature_2m ? 
                        `${polygon.data.temperature_2m.toFixed(1)}°C` : 
                        'Loading...'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DataSourceSidebar
