# Weather Data Dashboard

A React application that visualizes dynamic weather data over a map with timeline-based interaction and polygon creation capabilities.

## Features

### 🗓️ Timeline Slider (STEP 1)
- Interactive horizontal timeline spanning 30 days (15 days before and after today)
- Hourly resolution with drag and drop functionality  
- Quick navigation buttons for hour-by-hour browsing
- Visual display of selected time period

### 🗺️ Interactive Map (STEP 2)
- OpenStreetMap integration using React-Leaflet
- Pan and zoom functionality (zoom locked at minimum 2 sq. km resolution)
- Click and drag navigation
- Polygon visibility maintained during map movement

### ✏️ Polygon Drawing Tools (STEP 3)
- Click-to-draw polygon creation (minimum 3 points, maximum 12 points)
- Multiple completion methods:
  - Click near starting point to auto-complete
  - Press Enter to finish polygon
  - Press Escape to cancel drawing
- Visual feedback during drawing with dashed lines
- Automatic data source assignment for new polygons

### 📊 Data Source Selection (STEP 4)
- Sidebar control panel for managing data sources
- Color-coded rules with customizable thresholds
- Support for multiple data sources per session
- Operator selection (>, <, >=, <=, =) with numerical values
- Real-time color updates based on rule changes

### 🎨 Color-Coded Polygons (STEP 5)
- Dynamic polygon coloring based on fetched weather data
- Automatic color application using configured rules
- Real-time updates when timeline position changes
- Visual representation of data values through color coding

### 🌤️ Open-Meteo API Integration (STEP 6)
- Historical weather data fetching from Open-Meteo Archive API
- Temperature data (2m above ground) retrieval
- Centroid-based API calls for polygon regions
- Data caching for performance optimization
- Support for hourly data resolution

### ⚡ Dynamic Updates (STEP 7)
- Real-time polygon color updates when timeline changes
- Automatic data refresh for time range modifications
- Persistent polygon state across timeline navigation
- Background data loading with loading indicators

## Tech Stack

- **Frontend**: React 19.1.0 + Vite
- **Styling**: Tailwind CSS
- **Mapping**: React-Leaflet + Leaflet
- **Timeline**: react-range component
- **API**: Open-Meteo Archive API
- **Date Handling**: date-fns
- **HTTP Client**: Axios

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Usage

### Drawing Polygons
1. Click the "Draw Polygon" button to enter drawing mode
2. Click on the map to add points (minimum 3 required)
3. Complete the polygon by:
   - Clicking near the starting point
   - Pressing Enter
   - Or pressing Escape to cancel

### Timeline Navigation
1. Use the horizontal slider to select different time periods
2. Use arrow buttons for precise hour-by-hour navigation
3. Watch polygon colors update automatically based on weather data

### Data Source Management
1. Configure color rules in the right sidebar
2. Add multiple data sources with different thresholds
3. Select which data source to use for new polygons
4. Customize colors and comparison operators

### Map Interaction
- **Pan**: Click and drag to move around the map
- **Zoom**: Use mouse wheel (minimum 2 sq. km resolution)
- **Delete Polygons**: Click on existing polygons (when not in drawing mode)

## API Integration

The application uses the Open-Meteo Archive API to fetch historical weather data:

```
https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lng}&start_date={start}&end_date={end}&hourly=temperature_2m&timezone=auto
```

Data is fetched for polygon centroids and cached for performance. The timeline slider allows navigation through the fetched time series data.

## Bonus Features Implemented

- ✅ Support for multiple data sources with custom rules
- ✅ Polygon editing capabilities (delete by clicking)
- ✅ Advanced timeline with hourly resolution
- ✅ Data caching for improved performance
- ✅ Responsive design for different screen sizes
- ✅ Visual feedback during polygon drawing
- ✅ Real-time data updates

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx          # Main dashboard component
│   ├── TimelineSlider.jsx     # Timeline control component
│   ├── MapComponent.jsx       # Leaflet map with drawing tools
│   └── DataSourceSidebar.jsx  # Data source management panel
├── App.jsx                    # Root application component
├── index.css                  # Global styles with Tailwind
└── main.jsx                   # Application entry point
```

## Development

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

## Browser Support

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers with touch support for map interaction

## License

This project is created as part of the Mind Webs Ventures S2025 hiring assignment.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
