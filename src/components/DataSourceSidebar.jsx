import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Add,
  Delete,
  Palette,
  Tune,
  DataUsage,
  TrendingUp,
  Circle,
  CheckCircle,
  Cancel,
  Settings
} from '@mui/icons-material'

const DataSourceSidebar = ({ 
  dataSources, 
  onDataSourcesChange, 
  selectedDataSource, 
  onSelectedDataSourceChange,
  polygons,
  loadingPolygons = new Set()
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

  // Responsive hooks
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      {/* Responsive Header Section */}
      <Paper elevation={3} sx={{ 
        p: { xs: 2, sm: 3 },
        borderRadius: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            <Tune />
          </Avatar>
          <Box>
            <Typography 
              variant="h6" 
              fontWeight="bold"
              sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
            >
              Data Filtering
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Configure visualization rules and thresholds
            </Typography>
          </Box>
        </Stack>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <CardContent sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                  }}
                >
                  {dataSources.length}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: { xs: '0.625rem', sm: '0.75rem' },
                  }}
                >
                  Active Filters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <CardContent sx={{ p: { xs: 1, sm: 2 }, textAlign: 'center' }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
                  }}
                >
                  {polygons.length}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: { xs: '0.625rem', sm: '0.75rem' },
                  }}
                >
                  Map Regions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Responsive Data Source Configuration */}
      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, sm: 2 } }}>
        <Stack spacing={{ xs: 1, sm: 2 }}>
          {dataSources.map((dataSource) => (
            <Card 
              key={dataSource.id}
              elevation={selectedDataSource === dataSource.id ? 8 : 2}
              sx={{
                border: selectedDataSource === dataSource.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': { elevation: 6 }
              }}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Responsive Data Source Header */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  alignItems="flex-start" 
                  justifyContent="space-between" 
                  sx={{ mb: { xs: 2, sm: 3 } }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 1, sm: 0 } }}>
                    <Box
                      sx={{
                        width: { xs: 12, sm: 16 },
                        height: { xs: 12, sm: 16 },
                        borderRadius: '50%',
                        bgcolor: dataSource.color,
                        border: '3px solid white',
                        boxShadow: 2
                      }}
                    />
                    <Box>
                      <Typography 
                        variant="h6" 
                        fontWeight="bold" 
                        color="text.primary"
                        sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}
                      >
                        {dataSource.name}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        {dataSource.field}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {selectedDataSource === dataSource.id && (
                      <Chip 
                        icon={<CheckCircle />}
                        label="Active" 
                        color="primary" 
                        size={isMobile ? "small" : "medium"} 
                        variant="filled"
                      />
                    )}
                    <Button
                      variant={selectedDataSource === dataSource.id ? "contained" : "outlined"}
                      size={isMobile ? "small" : "medium"}
                      onClick={() => onSelectedDataSourceChange(dataSource.id)}
                      sx={{ 
                        minWidth: { xs: 60, sm: 80 },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {selectedDataSource === dataSource.id ? 'Selected' : 'Select'}
                    </Button>
                    {dataSources.length > 1 && (
                      <Tooltip title="Delete data source">
                        <IconButton
                          size={isMobile ? "small" : "medium"}
                          color="error"
                          onClick={() => handleDataSourceDelete(dataSource.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
                
                {/* Responsive Field Selection */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                    <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Data Field
                    </InputLabel>
                    <Select
                      value={dataSource.field}
                      label="Data Field"
                      onChange={(e) => handleDataSourceUpdate(dataSource.id, 'field', e.target.value)}
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {availableFields.map(field => (
                        <MenuItem key={field.value} value={field.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <DataUsage sx={{ fontSize: { xs: 14, sm: 16 }, color: '#64748b' }} />
                            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                              {field.label}
                            </Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Responsive Color Selection */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom 
                    fontWeight="bold" 
                    color="text.primary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    <Palette sx={{ fontSize: { xs: 14, sm: 16 }, mr: 1 }} />
                    Color Selection
                  </Typography>
                  <Stack 
                    direction="row" 
                    spacing={{ xs: 0.5, sm: 1 }} 
                    flexWrap="wrap" 
                    useFlexGap
                    sx={{ gap: { xs: 0.5, sm: 1 } }}
                  >
                    {colorOptions.map(color => (
                      <Box
                        key={color}
                        onClick={() => handleDataSourceUpdate(dataSource.id, 'color', color)}
                        sx={{
                          width: { xs: 24, sm: 32 },
                          height: { xs: 24, sm: 32 },
                          borderRadius: 2,
                          bgcolor: color,
                          border: dataSource.color === color ? '3px solid #1f2937' : '2px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': { 
                            transform: 'scale(1.1)',
                            boxShadow: 4
                          }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
                
                {/* Range Filter */}
                <Paper variant="outlined" sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.primary">
                    <Settings sx={{ fontSize: 16, mr: 1 }} />
                    Value Range Filter
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={dataSource.operator}
                          label="Operator"
                          onChange={(e) => handleDataSourceUpdate(dataSource.id, 'operator', e.target.value)}
                        >
                          {operators.map(op => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Value"
                        value={dataSource.value}
                        onChange={(e) => handleDataSourceUpdate(dataSource.id, 'value', parseFloat(e.target.value))}
                        inputProps={{ step: 0.1 }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Visual Range Display */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Visual Range: -50 to 50
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, Math.max(0, ((dataSource.value + 50) / 100) * 100))}
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: dataSource.color,
                          borderRadius: 4
                        }
                      }}
                    />
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">-50</Typography>
                      <Chip 
                        label={`Current: ${dataSource.value}`} 
                        size="small" 
                        sx={{ bgcolor: dataSource.color, color: 'white' }}
                      />
                      <Typography variant="caption" color="text.secondary">50</Typography>
                    </Stack>
                  </Box>
                  
                  <Alert severity="info" sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                    <Typography variant="body2">
                      <strong>Rule:</strong> Show color when value {formatThreshold(dataSource.operator, dataSource.value)}
                    </Typography>
                  </Alert>
                </Paper>
              </CardContent>
            </Card>
          ))}
          
          {/* Add New Data Source */}
          {!showAddForm ? (
            <Card 
              sx={{ 
                border: '2px dashed #cbd5e1',
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': { 
                  border: '2px dashed #3b82f6',
                  bgcolor: '#eff6ff' 
                }
              }}
              onClick={() => setShowAddForm(true)}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar sx={{ bgcolor: '#3b82f6', mx: 'auto', mb: 2 }}>
                  <Add />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                  Add New Filter
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new data visualization rule
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={4} sx={{ border: '2px solid #3b82f6', borderRadius: 3 }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                p: 2,
                color: 'white'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                    <Add />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    New Data Filter
                  </Typography>
                </Stack>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Filter Name"
                    value={newDataSource.name}
                    onChange={(e) => setNewDataSource({...newDataSource, name: e.target.value})}
                    placeholder="e.g., Cold Regions"
                    variant="outlined"
                  />
                  
                  <FormControl fullWidth>
                    <InputLabel>Data Field</InputLabel>
                    <Select
                      value={newDataSource.field}
                      label="Data Field"
                      onChange={(e) => setNewDataSource({...newDataSource, field: e.target.value})}
                    >
                      {availableFields.map(field => (
                        <MenuItem key={field.value} value={field.value}>
                          {field.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                      Color Selection
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {colorOptions.map(color => (
                        <Box
                          key={color}
                          onClick={() => setNewDataSource({...newDataSource, color})}
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 2,
                            bgcolor: color,
                            border: newDataSource.color === color ? '3px solid #1f2937' : '2px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'scale(1.1)' }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <FormControl fullWidth>
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={newDataSource.operator}
                          label="Operator"
                          onChange={(e) => setNewDataSource({...newDataSource, operator: e.target.value})}
                        >
                          {operators.map(op => (
                            <MenuItem key={op.value} value={op.value}>
                              {op.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Value"
                        value={newDataSource.value}
                        onChange={(e) => setNewDataSource({...newDataSource, value: parseFloat(e.target.value)})}
                        inputProps={{ step: 0.1 }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
                
                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddDataSource}
                    startIcon={<CheckCircle />}
                    sx={{ py: 1.5 }}
                  >
                    Add Filter
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => setShowAddForm(false)}
                    startIcon={<Cancel />}
                    sx={{ py: 1.5 }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
      
      {/* Footer Statistics */}
      {polygons.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, borderRadius: 0 }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold" color="text.primary">
            <TrendingUp sx={{ fontSize: 16, mr: 1 }} />
            Live Data Status
          </Typography>
          <Stack spacing={1}>
            {polygons.slice(0, 3).map((polygon, index) => (
              <Stack key={polygon.id} direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Circle sx={{ fontSize: 8, color: polygon.color }} />
                  <Typography variant="body2" color="text.secondary">
                    Region {index + 1}
                  </Typography>
                </Stack>
                <Chip
                  label={
                    loadingPolygons.has(polygon.id) ? 'Loading...' :
                    polygon.data?.temperature_2m ? `${polygon.data.temperature_2m.toFixed(1)}°C` : 'No data'
                  }
                  size="small"
                  color={polygon.data?.temperature_2m ? "primary" : "default"}
                  variant="outlined"
                />
              </Stack>
            ))}
            {polygons.length > 3 && (
              <Typography variant="caption" color="text.secondary" textAlign="center">
                +{polygons.length - 3} more regions
              </Typography>
            )}
          </Stack>
        </Paper>
      )}
    </Box>
  )
}

export default DataSourceSidebar
