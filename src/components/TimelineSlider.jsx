import { useCallback } from 'react'
import { Range } from 'react-range'
import { format, addHours, differenceInHours } from 'date-fns'

const TimelineSlider = ({ timelineRange, onChange }) => {
  const { start, end, current } = timelineRange
  
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
  
  // Generate tick marks for display
  const generateTicks = () => {
    const ticks = []
    const tickInterval = Math.max(1, Math.floor(totalHours / 10)) // Show ~10 ticks
    
    for (let i = 0; i <= totalHours; i += tickInterval) {
      const tickDate = addHours(start, i)
      ticks.push({
        value: i,
        label: format(tickDate, 'MMM dd HH:mm')
      })
    }
    
    return ticks
  }
  
  const ticks = generateTicks()
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Timeline Control</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuickNav('prev')}
            disabled={current <= start}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600"
          >
            ← Prev Hour
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {format(current, 'MMM dd, yyyy HH:mm')}
          </span>
          <button
            onClick={() => handleQuickNav('next')}
            disabled={current >= end}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded disabled:bg-gray-300 hover:bg-blue-600"
          >
            Next Hour →
          </button>
        </div>
      </div>
      
      <div className="relative">
        {/* Timeline Range Display */}
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>{format(start, 'MMM dd, yyyy')}</span>
          <span className="font-medium text-gray-700">
            30-day window ({Math.round(totalHours / 24)} days)
          </span>
          <span>{format(end, 'MMM dd, yyyy')}</span>
        </div>
        
        {/* Range Slider */}
        <div className="px-4 py-2">
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
                  height: '8px',
                  display: 'flex',
                  width: '100%'
                }}
              >
                <div
                  ref={props.ref}
                  style={{
                    height: '8px',
                    width: '100%',
                    borderRadius: '4px',
                    background: '#e5e7eb',
                    alignSelf: 'center'
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
                  height: '20px',
                  width: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#3b82f6',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  outline: 'none'
                }}
                className={isDragged ? 'scale-110' : ''}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            )}
          />
        </div>
        
        {/* Tick Marks */}
        <div className="relative mt-2">
          {ticks.map((tick, index) => (
            <div
              key={index}
              className="absolute text-xs text-gray-400 transform -translate-x-1/2"
              style={{ left: `${(tick.value / totalHours) * 100}%` }}
            >
              <div className="h-2 w-px bg-gray-300 mx-auto mb-1" />
              <span className="whitespace-nowrap">{tick.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Selection Info */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Selected Time:</strong> {format(current, 'EEEE, MMMM dd, yyyy \'at\' HH:mm')}
        </div>
        <div className="text-xs text-blue-600 mt-1">
          Use the slider or arrow buttons to navigate through the timeline
        </div>
      </div>
    </div>
  )
}

export default TimelineSlider
