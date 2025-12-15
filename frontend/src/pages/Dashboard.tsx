import { format } from "date-fns";
import { useState, useEffect } from "react";
import { MapPin, ArrowRight, CloudRain, Search, Plus, Minus, Download, ChevronDown, Bell, Menu, Calendar, Cloud, ArrowUp, ArrowDown, Minus as MinusIcon, Sun, CloudSun, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locationsAPI, weatherAPI } from "@/services/api";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/contexts/SettingsContext";

// Helper function to convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

// Helper function to convert km/h to mph
const kmhToMph = (kmh: number): number => {
  return kmh * 0.621371;
};

// Wind Chart Component - matches TemperatureTrendChart structure
const WindChart = ({ windData, currentTempF, currentWindSpeed, locationIndex }: { windData?: Array<{ time: string; speedKmh: number }>; currentTempF?: number; currentWindSpeed?: number; locationIndex?: number }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const { convertWindSpeed, windSpeedSymbol } = useSettings();

  if (!windData || windData.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-sm">No wind data</div>;
  }
  
  // Convert km/h to mph first, then to user's preferred unit
  const data = windData.map(d => ({ ...d, speed: convertWindSpeed(kmhToMph(d.speedKmh)) }));

  // Use responsive dimensions - even padding on all sides, adjusted to fit card
  const padding = { top: 15, right: 20, bottom: 15, left: 50 };
  const baseWidth = 640; // Wider for 2-column span
  const baseHeight = 140; // Reduced to fit in 260px card
  const graphWidth = baseWidth - padding.left - padding.right;
  const graphHeight = baseHeight - padding.top - padding.bottom;

  const minSpeed = Math.min(...data.map(d => d.speed));
  const maxSpeed = Math.max(...data.map(d => d.speed));
  const speedRange = maxSpeed - minSpeed || 1;
  const avgSpeed = data.reduce((sum, d) => sum + d.speed, 0) / data.length;
  const currentSpeed = currentWindSpeed !== undefined ? convertWindSpeed(kmhToMph(currentWindSpeed * 3.6)) : data[data.length - 1]?.speed || 0;
  const previousSpeed = data[data.length - 2]?.speed || currentSpeed;
  const trend = currentSpeed > previousSpeed ? 'rising' : currentSpeed < previousSpeed ? 'falling' : 'steady';
  const trendDiff = Math.abs(currentSpeed - previousSpeed).toFixed(1);
  const changePercent = previousSpeed !== 0 ? ((currentSpeed - previousSpeed) / previousSpeed * 100).toFixed(1) : '0.0';

  // Round min/max for Y-axis labels - match temperature chart
  const yAxisMin = Math.floor(minSpeed);
  const yAxisMax = Math.ceil(maxSpeed);
  const yAxisRange = yAxisMax - yAxisMin;
  const yAxisSteps = 5;
  const yAxisStep = yAxisRange / yAxisSteps;

  // Calculate points for the line
  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((point.speed - minSpeed) / speedRange) * graphHeight;
    return { x, y, time: point.time, speed: point.speed };
  });

  // Create smooth curved path using Catmull-Rom spline for smooth curves without sharp edges
  const createSmoothPath = (pointArray: Array<{ x: number; y: number; time: string; speed: number }>) => {
    if (pointArray.length < 2) return '';
    if (pointArray.length === 2) {
      return `M ${pointArray[0].x} ${pointArray[0].y} L ${pointArray[1].x} ${pointArray[1].y}`;
    }
    
    let path = `M ${pointArray[0].x} ${pointArray[0].y}`;
    
    // Use cubic bezier curves for smooth interpolation
    for (let i = 0; i < pointArray.length - 1; i++) {
      const p0 = i > 0 ? pointArray[i - 1] : pointArray[i];
      const p1 = pointArray[i];
      const p2 = pointArray[i + 1];
      const p3 = i < pointArray.length - 2 ? pointArray[i + 2] : pointArray[i + 1];
      
      // Calculate control points for smooth curve
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  };

  const pathData = createSmoothPath(points);

  // Create path for the fill area - use smooth curve
  const fillPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  // Vibrant colors that change per location - more vibrant palette
  const vibrantColors = [
    '#f59e0b', // Vibrant Orange
    '#14b8a6', // Vibrant Teal
    '#3b82f6', // Vibrant Blue
    '#ef4444', // Vibrant Red
    '#8b5cf6', // Vibrant Purple
    '#ec4899', // Vibrant Pink
    '#10b981', // Vibrant Green
    '#f97316', // Vibrant Orange-Red
  ];
  
  // Use location index to cycle through vibrant colors, or fallback to temperature-based
  const colorIndex = locationIndex !== undefined ? locationIndex % vibrantColors.length : 0;
  const lineColor = currentTempF !== undefined && locationIndex === undefined
    ? (currentTempF > 77 ? '#f59e0b' : currentTempF > 59 ? '#14b8a6' : '#3b82f6')
    : vibrantColors[colorIndex];

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header Section - minimal for 260px card */}
      <div className="mb-0" style={{ height: '50px', minHeight: '50px', maxHeight: '50px' }}>
        {/* Title Row - compact */}
        <div className="flex items-center justify-between mb-0.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Wind Status</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Last 24 hours</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">High:</span>
              <span className="font-semibold text-slate-900">{maxSpeed.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Low:</span>
              <span className="font-semibold text-slate-900">{minSpeed.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Avg:</span>
              <span className="font-semibold text-slate-900">{avgSpeed.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Current Wind Speed - compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{currentSpeed.toFixed(1)} {windSpeedSymbol}</span>
          </div>
        </div>
      </div>

      {/* Chart - Main Focus - fits in remaining space */}
      <div 
        className="w-full flex-1 flex flex-col min-h-0 overflow-hidden" 
        style={{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setMousePosition(null);
        }}
      >
        <div className="w-full relative" style={{ height: '200px', maxHeight: '200px' }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${baseWidth} ${baseHeight}`} 
        className="overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
        onMouseMove={(e) => {
          const svg = e.currentTarget;
          const rect = svg.getBoundingClientRect();
          const viewBox = svg.viewBox.baseVal;
          const scaleX = viewBox.width / rect.width;
          
          // Get mouse position relative to SVG viewBox
          const mouseX = (e.clientX - rect.left) * scaleX;
          
          // Find the closest point to the mouse x position
          let closestIndex = 0;
          let minDistance = Math.abs(points[0].x - mouseX);
          
          for (let i = 1; i < points.length; i++) {
            const distance = Math.abs(points[i].x - mouseX);
            if (distance < minDistance) {
              minDistance = distance;
              closestIndex = i;
            }
          }
          
          setHoveredIndex(closestIndex);
          const point = points[closestIndex];
          setMousePosition({
            x: point.x * (rect.width / viewBox.width),
            y: point.y * (rect.height / viewBox.height)
          });
        }}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setMousePosition(null);
        }}
      >
        <defs>
          <linearGradient id="windGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
          <filter id="windGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines removed - using hover dash line instead */}

        {/* Y-axis labels - with units, matching font size */}
        {Array.from({ length: yAxisSteps + 1 }, (_, i) => {
          const speedValue = yAxisMin + (i * yAxisStep);
          const y = padding.top + graphHeight - ((speedValue - minSpeed) / speedRange) * graphHeight;
          return (
            <text
              key={i}
              x={padding.left - 10}
              y={y + 2}
              textAnchor="end"
              className="text-[10px] fill-slate-600 font-medium"
              style={{ dominantBaseline: 'middle' }}
            >
              {speedValue.toFixed(0)} {windSpeedSymbol}
            </text>
          );
        })}

        {/* Fill area under the line */}
        <path
          d={fillPath}
          fill="url(#windGradient)"
        />

        {/* Main line with glow - match temperature chart exactly */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#windGlow)"
          className="transition-all duration-300"
        />

        {/* Highlight the newest point */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5"
          fill={lineColor}
          stroke="white"
          strokeWidth="2"
        />

        {/* Hour labels on X axis - show every 6 hours for 24hr view, tighter spacing */}
        {points.filter((_, i) => i % 6 === 0 || i === points.length - 1).map((point, idx) => {
          // Skip first label if it's 00:00 to avoid overlap
          const isFirst = idx === 0 && point.time === '00';
          return (
            <g key={`${point.time}-${idx}`}>
              <line
                x1={point.x}
                y1={padding.top + graphHeight}
                x2={point.x}
                y2={padding.top + graphHeight + 3}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {!isFirst && (
                <text
                  x={point.x}
                  y={baseHeight - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-600 font-medium"
                  style={{ dominantBaseline: 'hanging' }}
                >
                  {point.time}:00
                </text>
              )}
            </g>
          );
        })}

        {/* Point circles - aligned with trend line, vibrant colors */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === index ? "6" : "3"}
            fill={lineColor}
            opacity={hoveredIndex === index ? "1" : "0.8"}
            stroke="white"
            strokeWidth={hoveredIndex === index ? "2.5" : "1.5"}
            className="transition-all duration-200 pointer-events-none"
          />
        ))}

        {/* Tooltip on hover - full crosshair in all 4 directions */}
        {hoveredIndex !== null && mousePosition && (
          <g>
            {/* Vertical line - full height */}
            <line
              x1={points[hoveredIndex].x}
              y1={0}
              x2={points[hoveredIndex].x}
              y2={baseHeight}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Horizontal line - full width */}
            <line
              x1={0}
              y1={points[hoveredIndex].y}
              x2={baseWidth}
              y2={points[hoveredIndex].y}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Tooltip background */}
            <rect
              x={points[hoveredIndex].x - 45}
              y={points[hoveredIndex].y - 50}
              width="90"
              height="35"
              rx="6"
              fill="white"
              stroke={lineColor}
              strokeWidth="1.5"
              opacity="0.95"
              filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
            />
            {/* Tooltip text */}
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 35}
              textAnchor="middle"
              className="text-xs fill-slate-900 font-semibold"
            >
              {points[hoveredIndex].speed.toFixed(1)} {windSpeedSymbol}
            </text>
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 20}
              textAnchor="middle"
              className="text-[10px] fill-slate-500"
            >
              {points[hoveredIndex].time}:00
            </text>
          </g>
        )}
      </svg>
        </div>
      </div>
    </div>
  );
};

// Temperature Trend Chart Component
interface TemperatureDataPoint {
  hour: string;
  temperature: number;
  timestamp?: string;
}

interface TemperatureTrendChartProps {
  data?: TemperatureDataPoint[];
}

const TemperatureTrendChart = ({ data, locationIndex }: TemperatureTrendChartProps & { locationIndex?: number } = {}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const { formatTemperature, convertTemperature, temperatureUnit } = useSettings();

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        No temperature data available
      </div>
    );
  }
  
  // Data is already in Fahrenheit from API - convert for display
  const tempData: TemperatureDataPoint[] = data.map(d => ({
    ...d,
    temperature: convertTemperature(d.temperature)
  }));

  // Use responsive dimensions - even padding on all sides
  const padding = { top: 20, right: 20, bottom: 20, left: 35 };
  // Base dimensions for viewBox, will scale responsively
  const baseWidth = 800;
  const baseHeight = 280;
  const graphWidth = baseWidth - padding.left - padding.right;
  const graphHeight = baseHeight - padding.top - padding.bottom;

  const minTemp = Math.min(...tempData.map(d => d.temperature));
  const maxTemp = Math.max(...tempData.map(d => d.temperature));
  const tempRange = maxTemp - minTemp || 1;
  const avgTemp = tempData.reduce((sum, d) => sum + d.temperature, 0) / tempData.length;
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";
  
  // Round min/max for Y-axis labels
  const yAxisMin = Math.floor(minTemp);
  const yAxisMax = Math.ceil(maxTemp);
  const yAxisRange = yAxisMax - yAxisMin;
  const yAxisSteps = 5;
  const yAxisStep = yAxisRange / yAxisSteps;

  // Calculate points for the line with smooth curves
  const points = tempData.map((point, index) => {
    const x = padding.left + (index / (tempData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((point.temperature - minTemp) / tempRange) * graphHeight;
    return { x, y, hour: point.hour, temp: point.temperature };
  });

  // Create path that passes exactly through all points for accuracy
  const createSmoothPath = (pointArray: Array<{ x: number; y: number; hour: string; temp: number }>) => {
    if (pointArray.length < 2) return '';
    
    let path = `M ${pointArray[0].x} ${pointArray[0].y}`;
    
    // Use linear interpolation to ensure all points are exactly on the line
    for (let i = 1; i < pointArray.length; i++) {
      const point = pointArray[i];
      path += ` L ${point.x} ${point.y}`;
    }
    
    return path;
  };

  const pathData = createSmoothPath(points);

  // Create path for the fill area - use smooth curve
  const fillPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  // Determine trend (rising, falling, or steady)
  const currentTemp = tempData[tempData.length - 1].temperature;
  const previousTemp = tempData[tempData.length - 2]?.temperature || currentTemp;
  const trend = currentTemp > previousTemp ? 'rising' : currentTemp < previousTemp ? 'falling' : 'steady';
  const trendDiff = Math.abs(currentTemp - previousTemp).toFixed(1);
  const changePercent = previousTemp !== 0 ? ((currentTemp - previousTemp) / previousTemp * 100).toFixed(1) : '0.0';

  // Vibrant colors that change per location - more vibrant palette
  const vibrantColors = [
    '#f59e0b', // Vibrant Orange
    '#14b8a6', // Vibrant Teal
    '#3b82f6', // Vibrant Blue
    '#ef4444', // Vibrant Red
    '#8b5cf6', // Vibrant Purple
    '#ec4899', // Vibrant Pink
    '#10b981', // Vibrant Green
    '#f97316', // Vibrant Orange-Red
  ];
  
  // Use location index to cycle through vibrant colors, or fallback to temperature-based
  const colorIndex = locationIndex !== undefined ? locationIndex % vibrantColors.length : 0;
  const lineColor = locationIndex === undefined
    ? (currentTemp > 77 ? '#f59e0b' : currentTemp > 59 ? '#14b8a6' : '#3b82f6')
    : vibrantColors[colorIndex];

  return (
    <div className="w-full flex flex-col h-full">
      {/* Header Section - compact for 260px card */}
      <div className="mb-2">
        {/* Title Row - compact */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Temperature Trend</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Last 24 hours</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500">High:</span>
              <span className="font-semibold text-slate-900">{maxTemp.toFixed(1)}{unitSymbol}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Low:</span>
              <span className="font-semibold text-slate-900">{minTemp.toFixed(1)}{unitSymbol}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Avg:</span>
              <span className="font-semibold text-slate-900">{avgTemp.toFixed(1)}{unitSymbol}</span>
            </div>
          </div>
        </div>

        {/* Current Temperature - compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900">{currentTemp.toFixed(1)}{unitSymbol}</span>
          </div>
        </div>
      </div>

      {/* Chart - Main Focus - fits in 260px card */}
      <div 
        className="w-full flex-1 flex flex-col min-h-0" 
        style={{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px' }}
        onMouseLeave={() => {
          setHoveredIndex(null);
          setMousePosition(null);
        }}
      >
        <div className="w-full flex-1 relative" style={{ minHeight: '140px' }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${baseWidth} ${baseHeight}`} 
            className="overflow-visible" 
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}
            onMouseMove={(e) => {
              const svg = e.currentTarget;
              const rect = svg.getBoundingClientRect();
              const viewBox = svg.viewBox.baseVal;
              const scaleX = viewBox.width / rect.width;
              const scaleY = viewBox.height / rect.height;
              
              // Get mouse position relative to SVG viewBox
              const mouseX = (e.clientX - rect.left) * scaleX;
              
              // Find the closest point to the mouse x position
              let closestIndex = 0;
              let minDistance = Math.abs(points[0].x - mouseX);
              
              for (let i = 1; i < points.length; i++) {
                const distance = Math.abs(points[i].x - mouseX);
                if (distance < minDistance) {
                  minDistance = distance;
                  closestIndex = i;
                }
              }
              
              setHoveredIndex(closestIndex);
              const point = points[closestIndex];
              setMousePosition({
                x: point.x * (rect.width / viewBox.width),
                y: point.y * (rect.height / viewBox.height)
              });
            }}
            onMouseLeave={() => {
              setHoveredIndex(null);
              setMousePosition(null);
            }}
          >
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines removed - using hover dash line instead */}

        {/* Y-axis labels - matching font size with wind chart */}
        {Array.from({ length: yAxisSteps + 1 }, (_, i) => {
          const tempValue = yAxisMin + (i * yAxisStep);
          const y = padding.top + graphHeight - ((tempValue - minTemp) / tempRange) * graphHeight;
          return (
            <text
              key={i}
              x={padding.left - 10}
              y={y + 2}
              textAnchor="end"
              className="text-[10px] fill-slate-600 font-medium"
              style={{ dominantBaseline: 'middle' }}
            >
              {tempValue.toFixed(0)}{unitSymbol}
            </text>
          );
        })}

        {/* Fill area under the line */}
        <path
          d={fillPath}
          fill="url(#tempGradient)"
        />

        {/* Main line with glow - smoother */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          className="transition-all duration-300"
        />

        {/* Highlight the newest point */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="5"
          fill={lineColor}
          stroke="white"
          strokeWidth="2"
        />

        {/* Hour labels on X axis - show every 6 hours for 24hr view, tighter spacing */}
        {points.filter((_, i) => i % 6 === 0 || i === points.length - 1).map((point, idx) => {
          // Skip first label if it's 00:00 to avoid overlap
          const isFirst = idx === 0 && point.hour === '00';
          return (
            <g key={`${point.hour}-${idx}`}>
              <line
                x1={point.x}
                y1={padding.top + graphHeight}
                x2={point.x}
                y2={padding.top + graphHeight + 3}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              {!isFirst && (
                <text
                  x={point.x}
                  y={baseHeight - 8}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-600 font-medium"
                  style={{ dominantBaseline: 'hanging' }}
                >
                  {point.hour}:00
                </text>
              )}
            </g>
          );
        })}

        {/* Visible point circles - aligned with trend line, vibrant colors */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === index ? "6" : "3"}
            fill={lineColor}
            opacity={hoveredIndex === index ? "1" : "0.8"}
            stroke="white"
            strokeWidth={hoveredIndex === index ? "2.5" : "1.5"}
            className="transition-all duration-200 pointer-events-none"
          />
        ))}

        {/* Hover tooltip - full crosshair in all 4 directions */}
        {hoveredIndex !== null && mousePosition && (
          <g>
            {/* Vertical line - full height */}
            <line
              x1={points[hoveredIndex].x}
              y1={0}
              x2={points[hoveredIndex].x}
              y2={baseHeight}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Horizontal line - full width */}
            <line
              x1={0}
              y1={points[hoveredIndex].y}
              x2={baseWidth}
              y2={points[hoveredIndex].y}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Tooltip background */}
            <rect
              x={points[hoveredIndex].x - 45}
              y={points[hoveredIndex].y - 50}
              width="90"
              height="35"
              rx="6"
              fill="white"
              stroke={lineColor}
              strokeWidth="1.5"
              opacity="0.95"
              filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
            />
            {/* Tooltip text */}
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 35}
              textAnchor="middle"
              className="text-xs fill-slate-900 font-semibold"
            >
              {points[hoveredIndex].temp.toFixed(1)}{unitSymbol}
            </text>
            <text
              x={points[hoveredIndex].x}
              y={points[hoveredIndex].y - 20}
              textAnchor="middle"
              className="text-[10px] fill-slate-500"
            >
              {points[hoveredIndex].hour}:00
            </text>
          </g>
        )}
      </svg>
        </div>
      </div>
    </div>
  );
};

// Weather code to emoji/icon mapping - considers time of day
const getWeatherEmoji = (weatherCode: number, dateTime?: Date | string): string => {
  // Determine if it's night (6 PM to 6 AM)
  let hour: number;
  if (dateTime) {
    const dt = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    hour = dt.getHours();
  } else {
    hour = new Date().getHours();
  }
  const isNight = hour >= 18 || hour < 6;
  
  if (weatherCode === 0) return isNight ? "🌙" : "☀️"; // Clear sky - moon at night, sun during day
  if (weatherCode <= 3) return isNight ? "☁️" : "⛅"; // Mainly clear, partly cloudy - cloud at night, partly cloudy during day
  if (weatherCode <= 49) return "🌫️"; // Fog - same for day/night
  if (weatherCode <= 59) return "🌦️"; // Drizzle - same for day/night
  if (weatherCode <= 69) return "🌧️"; // Rain - same for day/night
  if (weatherCode <= 79) return "❄️"; // Snow - same for day/night (user loves this one)
  if (weatherCode <= 84) return "🌧️"; // Rain showers - same for day/night
  if (weatherCode <= 86) return "❄️"; // Snow showers - same for day/night
  if (weatherCode <= 99) return "⛈️"; // Thunderstorm - same for day/night
  return "☁️"; // Default cloudy
};

const getWeatherCondition = (weatherCode: number): string => {
  if (weatherCode === 0) return "Clear Sky";
  if (weatherCode <= 3) return "Partly Cloudy";
  if (weatherCode <= 49) return "Foggy";
  if (weatherCode <= 59) return "Drizzle";
  if (weatherCode <= 69) return "Rainy";
  if (weatherCode <= 79) return "Snowy";
  if (weatherCode <= 84) return "Rain Showers";
  if (weatherCode <= 86) return "Snow Showers";
  if (weatherCode <= 99) return "Thunderstorm";
  return "Cloudy";
};

// Weather Metrics Gauge Card Component - Shows key weather metrics in gauges
interface WeatherMetricsCardProps {
  weather?: {
    current_weather?: {
      temperature: number;
      windspeed: number;
      weathercode: number;
    };
    hourly_forecast?: {
      relative_humidity_2m?: number[];
      uv_index?: number[];
    };
  };
  locationName?: string;
}

const WeatherMetricsCard = ({ weather, locationName }: WeatherMetricsCardProps) => {
  const { convertTemperature, temperatureUnit, convertWindSpeed, windSpeedSymbol } = useSettings();
  
  // Get current values - convert temperature based on settings
  const tempF = weather?.current_weather?.temperature;
  const temp = tempF !== undefined ? convertTemperature(tempF) : undefined;
  const windSpeed = weather?.current_weather?.windspeed;
  const windSpeedConverted = windSpeed !== undefined ? convertWindSpeed(kmhToMph(windSpeed * 3.6)) : undefined;
  const humidity = weather?.hourly_forecast?.relative_humidity_2m?.[0];
  const uvIndex = weather?.hourly_forecast?.uv_index?.[0];
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";
  const tempMax = temperatureUnit === "celsius" ? 50 : 120;
  const windMax = windSpeedSymbol === "km/h" ? 80 : 50;
  
  // Get timestamp for "as of" display
  const weatherTime = weather?.current_weather?.time 
    ? new Date(weather.current_weather.time)
    : null;
  
  const formatTime = (date: Date) => {
    return format(date, "h:mm a");
  };

  // Gauge Component
  const Gauge = ({ 
    value, 
    max, 
    label, 
    unit, 
    color, 
    size = 80 
  }: { 
    value: number | undefined; 
    max: number; 
    label: string; 
    unit: string; 
    color: string;
    size?: number;
  }) => {
    if (value === undefined) {
      return (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="relative flex items-center justify-center mb-0.5" style={{ width: size, height: size }}>
            <div className="w-full h-full rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-base font-bold text-slate-300 leading-none">--</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">{unit}</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 font-medium text-center leading-tight">{label}</div>
        </div>
      );
    }

    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * (size / 2 - 6);
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative flex items-center justify-center mb-0.5" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90 absolute inset-0">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 6}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="5"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 6}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-base font-bold leading-none" style={{ color }}>
              {value.toFixed(value < 10 ? 1 : 0)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">{unit}</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-600 font-medium text-center leading-tight">{label}</div>
      </div>
    );
  };

  return (
    <Card className="h-full rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10 overflow-hidden" style={{ height: '260px' }}>
      <CardContent className="p-3 flex flex-col h-full">
        {/* Header - Centered */}
        <div className="mb-1.5 text-center flex-shrink-0">
          <h3 className="text-sm font-semibold text-slate-900">Weather Metrics</h3>
          {locationName && (
            <p className="text-[11px] text-slate-500 mt-0.5">{locationName}</p>
          )}
          {weatherTime && (
            <p className="text-[11px] text-slate-400 mt-0.5">As of {formatTime(weatherTime)}</p>
          )}
        </div>

        {/* Gauges Grid - 2x2, evenly spaced and centered */}
        <div className="grid grid-cols-2 gap-2.5 flex-1 items-center justify-items-center px-1 min-h-0">
          {/* Temperature Gauge */}
          <Gauge
            value={temp}
            max={tempMax}
            label="Temperature"
            unit={unitSymbol}
            color="#f97316"
            size={80}
          />

          {/* Humidity Gauge */}
          <Gauge
            value={humidity}
            max={100}
            label="Humidity"
            unit="%"
            color="#3b82f6"
            size={80}
          />

          {/* Wind Speed Gauge */}
          <Gauge
            value={windSpeedConverted}
            max={windMax}
            label="Wind Speed"
            unit={windSpeedSymbol}
            color="#14b8a6"
            size={80}
          />

          {/* UV Index Gauge */}
          <Gauge
            value={uvIndex}
            max={11}
            label="UV Index"
            unit=""
            color="#f59e0b"
            size={80}
          />
        </div>
      </CardContent>
    </Card>
  );
};

interface LocationWithWeather {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  weather?: {
    location: string;
    current_weather: {
      temperature: number;
      windspeed: number;
      winddirection: number;
      weathercode: number;
      time: string;
    };
    daily_forecast: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      precipitation_probability_max: number[];
      wind_speed_10m_max: number[];
      uv_index_max: number[];
    };
    hourly_forecast: {
      time: string[];
      temperature_2m: number[];
      relative_humidity_2m: number[];
      precipitation: number[];
      wind_speed_10m: number[];
      cloud_cover: number[];
      uv_index: number[];
      weathercode?: number[];
      snowfall?: number[];
    };
  };
}

// Loading Skeleton Components
const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
);

const WeatherCardSkeleton = () => (
  <Card className="h-full rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10" style={{ height: '260px' }}>
    <CardContent className="p-5 flex flex-col flex-1">
      <div className="flex items-center justify-between h-[52px]">
        <LoadingSkeleton className="w-[60px] h-[60px] rounded-full" />
        <LoadingSkeleton className="h-10 w-10 rounded-full" />
      </div>
      <div className="mt-2">
        <LoadingSkeleton className="h-[42px] w-32 mb-2" />
        <LoadingSkeleton className="h-5 w-24" />
      </div>
      <div className="mt-[10px] flex flex-col gap-2">
        <LoadingSkeleton className="h-6 w-40" />
        <LoadingSkeleton className="h-6 w-48" />
      </div>
    </CardContent>
  </Card>
);

const ChartCardSkeleton = () => (
  <Card className="h-full lg:col-span-2 rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10" style={{ height: '260px' }}>
    <CardContent className="p-5 flex flex-col flex-1">
      <div className="mb-2">
        <LoadingSkeleton className="h-5 w-32 mb-1" />
        <LoadingSkeleton className="h-4 w-24 mb-2" />
        <LoadingSkeleton className="h-7 w-24" />
      </div>
      <div className="flex-1">
        <LoadingSkeleton className="w-full h-full rounded" />
      </div>
    </CardContent>
  </Card>
);

const MetricsCardSkeleton = () => (
  <Card className="h-full rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10 overflow-hidden" style={{ height: '260px' }}>
    <CardContent className="p-3 flex flex-col h-full">
      <div className="mb-2 text-center flex-shrink-0">
        <LoadingSkeleton className="h-5 w-32 mb-1 mx-auto" />
        <LoadingSkeleton className="h-3 w-24 mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 flex-1 items-center justify-items-center px-1 min-h-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col items-center justify-center w-full">
            <LoadingSkeleton className="w-[80px] h-[80px] rounded-full mb-1" />
            <LoadingSkeleton className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ForecastSkeleton = () => (
  <Card className="rounded-[2rem] border-none bg-white p-5 shadow-sm relative z-10" style={{ height: '445px', width: '100%', minHeight: '445px', maxHeight: '445px' }}>
    <LoadingSkeleton className="h-7 w-32 mb-3" />
    <div className="space-y-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-2.5" style={{ minHeight: '48px' }}>
          <div className="flex items-center gap-3">
            <LoadingSkeleton className="h-6 w-6 rounded" />
            <LoadingSkeleton className="h-6 w-16" />
            <LoadingSkeleton className="h-4 w-12" />
          </div>
          <div className="text-right">
            <LoadingSkeleton className="h-3 w-16 mb-1" />
            <LoadingSkeleton className="h-4 w-12" />
          </div>
        </div>
      ))}
    </div>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { formatTemperature, convertTemperature, temperatureUnit } = useSettings();
  const today = new Date();
  const [locations, setLocations] = useState<LocationWithWeather[]>([]);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [locationImages, setLocationImages] = useState<Map<string, string>>(new Map());

  // Preload images for all locations
  const preloadLocationImages = async (locationNames: string[]) => {
    const imageMap = new Map<string, string>();
    const imagePromises = locationNames.map(async (name) => {
      try {
        const imgUrl = `http://localhost:8000/images/location/${encodeURIComponent(name)}`;
        return new Promise<{ name: string; url: string }>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ name, url: imgUrl });
          img.onerror = () => {
            // Try fallback with just city name
            const fallbackName = name.split(',')[0].trim();
            if (fallbackName !== name) {
              const fallbackUrl = `http://localhost:8000/images/location/${encodeURIComponent(fallbackName)}`;
              const fallbackImg = new Image();
              fallbackImg.crossOrigin = "anonymous";
              fallbackImg.onload = () => resolve({ name, url: fallbackUrl });
              fallbackImg.onerror = () => reject(new Error(`Failed to load image for ${name}`));
              fallbackImg.src = fallbackUrl;
            } else {
              reject(new Error(`Failed to load image for ${name}`));
            }
          };
          img.src = imgUrl;
        });
      } catch (error) {
        console.error(`Error preloading image for ${name}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(imagePromises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        imageMap.set(locationNames[index], result.value.url);
      }
    });

    setLocationImages(imageMap);
  };

  // Fetch locations and weather data - optimized for faster loading
  const fetchLocations = async () => {
    try {
      setLoading(true);
      setWeatherLoading(true);
      
      // Fetch locations first (fast)
      const response = await locationsAPI.getAll();
      const locs = response.locations;

      if (locs.length === 0) {
        setLoading(false);
        setWeatherLoading(false);
        return;
      }

      // Set locations immediately (without weather) for instant display
      setLocations(locs.map(loc => ({ ...loc })));
      if (currentLocationIndex >= locs.length) {
        setCurrentLocationIndex(0);
      }
      setLoading(false); // Show cards immediately

      // Preload images in background (non-blocking)
      preloadLocationImages(locs.map(loc => loc.name));

      // Fetch weather for current location first (priority)
      const currentLoc = locs[currentLocationIndex] || locs[0];
      try {
        const currentWeather = await weatherAPI.getForLocation(currentLoc.id);
        setLocations(prev => prev.map((loc, idx) => 
          idx === currentLocationIndex ? { ...loc, weather: currentWeather } : loc
        ));
        setWeatherLoading(false); // Weather loaded for current location
      } catch (error) {
        console.error(`Failed to fetch weather for ${currentLoc.name}:`, error);
        setWeatherLoading(false);
      }

      // Pre-fetch weather for other locations in parallel (background)
      const otherLocs = locs.filter((_, idx) => idx !== currentLocationIndex);
      const weatherPromises = otherLocs.map(async (loc) => {
        try {
          const weather = await weatherAPI.getForLocation(loc.id);
          return { locIndex: locs.indexOf(loc), weather };
        } catch (error) {
          console.error(`Failed to fetch weather for ${loc.name}:`, error);
          return null;
        }
      });

      // Update locations incrementally as weather arrives
      const results = await Promise.allSettled(weatherPromises);
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled' && result.value) {
          const { locIndex, weather } = result.value;
          setLocations(prev => prev.map((loc, i) => 
            i === locIndex ? { ...loc, weather } : loc
          ));
        }
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load locations",
        variant: "destructive",
      });
      setLoading(false);
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Rotate through locations every 10 seconds
  useEffect(() => {
    if (locations.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentLocationIndex((prev) => {
        const nextIndex = (prev + 1) % locations.length;
        // If weather not loaded for next location, fetch it
        if (!locations[nextIndex]?.weather) {
          const nextLoc = locations[nextIndex];
          if (nextLoc) {
            weatherAPI.getForLocation(nextLoc.id)
              .then(weather => {
                setLocations(prevLocs => prevLocs.map((loc, idx) => 
                  idx === nextIndex ? { ...loc, weather } : loc
                ));
              })
              .catch(err => console.error(`Failed to fetch weather for ${nextLoc.name}:`, err));
          }
        }
        return nextIndex;
      });
    }, 10000); // Rotate every 10 seconds

    return () => clearInterval(interval);
  }, [locations.length, locations]);

  const currentLocation = locations[currentLocationIndex];
  const currentWeather = currentLocation?.weather;
  
  // Get the most recent hourly data for accurate current conditions
  const getCurrentWeatherFromHourly = () => {
    if (!currentWeather?.hourly_forecast?.time || !currentWeather?.hourly_forecast?.temperature_2m) {
      return null;
    }
    
    const now = new Date();
    const times = currentWeather.hourly_forecast.time.map(t => new Date(t));
    
    // Find the most recent data point (closest to or before current time)
    let closestIdx = 0;
    let minDiff = Infinity;
    
    for (let i = times.length - 1; i >= 0; i--) {
      const diff = now.getTime() - times[i].getTime();
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    
    // Use the most recent hourly data
    const hourlyTemp = currentWeather.hourly_forecast.temperature_2m[closestIdx];
    const hourlyWind = currentWeather.hourly_forecast.wind_speed_10m?.[closestIdx] || currentWeather.current_weather?.windspeed || 0;
    const snowfall = currentWeather.hourly_forecast.snowfall?.[closestIdx] || 0;
    const precipitation = currentWeather.hourly_forecast.precipitation?.[closestIdx] || 0;
    const cloudCover = currentWeather.hourly_forecast.cloud_cover?.[closestIdx] || 0;
    
    // Determine weathercode from hourly data or use current_weather as fallback
    let weathercode = currentWeather.hourly_forecast.weathercode?.[closestIdx];
    if (weathercode === undefined) {
      // Infer weathercode from precipitation/snowfall data
      if (snowfall > 0.1) {
        weathercode = 71; // Snow fall: Slight intensity
      } else if (precipitation > 0.1) {
        weathercode = 61; // Rain: Slight intensity
      } else if (cloudCover > 75) {
        weathercode = 3; // Overcast
      } else if (cloudCover > 50) {
        weathercode = 2; // Partly cloudy
      } else {
        weathercode = currentWeather.current_weather?.weathercode || 0;
      }
    }
    
    return {
      temperature: hourlyTemp,
      windspeed: hourlyWind,
      weathercode: weathercode,
      time: times[closestIdx].toISOString(),
    };
  };
  
  const currentHourlyWeather = getCurrentWeatherFromHourly();
  const displayWeather = currentHourlyWeather || currentWeather?.current_weather;
  
  // Prepare wind data for chart (last 24 hours from current time) - Open-Meteo provides hourly data
  const windData = currentWeather?.hourly_forecast?.wind_speed_10m && currentWeather?.hourly_forecast?.time
    ? (() => {
        const now = new Date();
        const currentHour = now.getHours();
        const times = currentWeather.hourly_forecast.time.map(t => new Date(t));
        
        // Find the index closest to current hour (or use first 24 if no match)
        let startIdx = 0;
        for (let i = 0; i < times.length; i++) {
          const hour = times[i].getHours();
          if (hour === currentHour || (i > 0 && times[i-1].getHours() < currentHour && hour > currentHour)) {
            startIdx = Math.max(0, i - 23); // Go back 23 hours to get 24 data points
            break;
          }
        }
        
        return currentWeather.hourly_forecast.wind_speed_10m.slice(startIdx, startIdx + 24).map((speed, idx) => {
          const date = times[startIdx + idx];
          return {
            time: date.getHours().toString().padStart(2, '0'),
            speedKmh: speed * 3.6, // Convert m/s to km/h (will convert to mph in chart component)
          };
        });
      })()
    : undefined;

  // Prepare temperature trend data (last 24 hours from current time) - Open-Meteo provides hourly data
  const temperatureData = currentWeather?.hourly_forecast?.temperature_2m && currentWeather?.hourly_forecast?.time
    ? (() => {
        const now = new Date();
        const currentHour = now.getHours();
        const times = currentWeather.hourly_forecast.time.map(t => new Date(t));
        
        // Find the index closest to current hour (or use first 24 if no match)
        let startIdx = 0;
        for (let i = 0; i < times.length; i++) {
          const hour = times[i].getHours();
          if (hour === currentHour || (i > 0 && times[i-1].getHours() < currentHour && hour > currentHour)) {
            startIdx = Math.max(0, i - 23); // Go back 23 hours to get 24 data points
            break;
          }
        }
        
        return currentWeather.hourly_forecast.temperature_2m.slice(startIdx, startIdx + 24).map((temp, idx) => {
          const date = times[startIdx + idx];
          return {
            hour: date.getHours().toString().padStart(2, '0'),
            temperature: temp, // Keep in Celsius, will convert to F in chart component
          };
        });
      })()
    : undefined;

  // Prepare 7-day forecast - convert based on settings
  const forecastData = currentWeather?.daily_forecast?.time && currentWeather?.daily_forecast?.temperature_2m_max && currentWeather?.daily_forecast?.temperature_2m_min
    ? currentWeather.daily_forecast.time.slice(0, 7).map((dateStr, idx) => {
        const date = new Date(dateStr);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[date.getDay()];
        const dayShort = dayName.substring(0, 3);
        const weatherCode = currentWeather.current_weather.weathercode; // Simplified - would need daily weather codes
        // For daily forecast, use noon time to determine day icon
        const noonDate = new Date(date);
        noonDate.setHours(12, 0, 0, 0);
        return {
          icon: getWeatherEmoji(weatherCode, noonDate),
          high: Math.round(convertTemperature(currentWeather.daily_forecast.temperature_2m_max[idx])),
          low: Math.round(convertTemperature(currentWeather.daily_forecast.temperature_2m_min[idx])),
          date: format(date, 'd MMM'),
          day: dayShort,
        };
      })
    : [];
  
  const unitSymbol = temperatureUnit === "celsius" ? "°C" : "°F";

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <PageHeader title="Overview Dashboard" />
      
      <div className="flex-1 overflow-auto flex flex-col pt-20 px-6 pb-6">
      {/* Top Header Row - Date/Time/Location | Chat */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex w-full h-[80px] items-center justify-between gap-6">
          {/* Left: Date, Time, and Location combined */}
          <div className="flex items-center gap-4">
            {/* Date Card */}
            <div className="flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-white shadow-sm flex-shrink-0">
              <span className="text-[36px] font-bold text-[#f97316] leading-none">
                {format(today, "dd")}
              </span>
            </div>
            
            {/* Date, Time, and Location Info */}
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {format(today, "EEEE")}, {format(today, "MMMM yyyy")}
                </p>
                <span className="text-slate-300 dark:text-slate-500">•</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {format(today, "h:mm a")} {Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g, ' ')}
                </p>
              </div>
              {currentLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#f97316] flex-shrink-0" />
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {currentLocation.name}
                    {locations.length > 1 && (
                      <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1.5">
                        ({currentLocationIndex + 1} of {locations.length})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Middle Grid - 4 Cards (Wind expanded to 2 columns) */}
      <div className="mb-5 grid gap-4 lg:grid-cols-4 flex-shrink-0 relative z-10" style={{ height: '260px' }}>
        {/* Card 1: Current Weather */}
        {loading || weatherLoading ? (
          <WeatherCardSkeleton />
        ) : (
          <Card className="h-full rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10" style={{ height: '260px' }}>
            <CardContent className="p-5 flex flex-col flex-1">
              {/* Top Row: Weather Icon and Search Button */}
              <div className="flex items-center justify-between h-[52px]">
                {/* Weather Icon */}
                <div className="text-[60px] leading-none">
                  {displayWeather ? getWeatherEmoji(displayWeather.weathercode, displayWeather.time) : "☁️"}
                </div>
                
                {/* Search Button */}
                <Button 
                  onClick={() => navigate('/locations')}
                  variant="outline" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-white border-slate-300 shadow-sm hover:bg-slate-50 flex-shrink-0"
                >
                  <Search className="h-5 w-5 text-[#f97316]" />
                </Button>
              </div>
              
              {/* Temperature Section */}
              <div className="mt-2">
                {/* Temperature Text */}
                <div className="text-[42px] font-bold text-black leading-none">
                  {displayWeather ? formatTemperature(displayWeather.temperature) : `--${temperatureUnit === "celsius" ? "°C" : "°F"}`}
                </div>
                
                {/* Condition Row */}
                <div className="flex items-center gap-1.5 mt-1">
                  <Cloud className="h-5 w-5 text-slate-400" />
                  <p className="text-base font-medium text-slate-500">
                    {displayWeather ? getWeatherCondition(displayWeather.weathercode) : "--"}
                  </p>
                </div>
              </div>
              
              {/* Bottom Info Section */}
              <div className="mt-[10px] flex flex-col gap-2">
                {/* Location Row */}
                <div className="flex items-center gap-1.5 h-6">
                  <MapPin className="h-[18px] w-[18px] text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {currentLocation ? currentLocation.name : "No locations"}
                    {locations.length > 1 && ` (${currentLocationIndex + 1}/${locations.length})`}
                  </span>
                </div>
                
                {/* Date Row */}
                <div className="flex items-center gap-1.5 h-6">
                  <Calendar className="h-[18px] w-[18px] text-slate-500" />
                  <span className="text-sm text-slate-600">
                    {format(today, "d MMMM, yyyy")} <span className="font-bold">{format(today, "h:mm a")}</span>
                  </span>
                </div>
              </div>
          </CardContent>
          </Card>
        )}

        {/* Card 2-3: Wind Status - Expanded to 2 columns */}
        {loading || weatherLoading ? (
          <ChartCardSkeleton />
        ) : (
          <Card className="h-full lg:col-span-2 rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10" style={{ height: '260px' }}>
            <CardContent className="p-5 flex flex-col flex-1">
                <WindChart 
                windData={windData} 
                currentTempF={displayWeather?.temperature}
                currentWindSpeed={displayWeather?.windspeed}
                locationIndex={currentLocationIndex}
              />
            </CardContent>
          </Card>
        )}

        {/* Card 4: Weather Metrics Gauges */}
        {loading || weatherLoading ? (
          <MetricsCardSkeleton />
        ) : (
          <WeatherMetricsCard 
            weather={currentWeather}
            locationName={currentLocation?.name}
          />
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-[1fr,2fr] flex-shrink-0 relative z-10 mt-auto mb-20" style={{ height: '445px', minHeight: '445px', maxHeight: '445px' }}>
        {/* Left: 7 Days Forecast */}
        {loading || weatherLoading ? (
          <ForecastSkeleton />
        ) : (
          <Card className="rounded-[2rem] border-none bg-white p-5 shadow-sm relative z-10" style={{ height: '445px', width: '100%', minHeight: '445px', maxHeight: '445px' }}>
            <div className="flex items-center justify-between mb-3" style={{ height: '28px', minHeight: '28px' }}>
              <h3 className="text-sm font-medium text-slate-700">6 Days Forecast</h3>
            </div>

            <div className="space-y-2 overflow-hidden" style={{ height: 'calc(445px - 20px - 28px - 20px)', minHeight: 'calc(445px - 20px - 28px - 20px)', maxHeight: 'calc(445px - 20px - 28px - 20px)' }}>
              {/* Forecast Day Items - 7 Days */}
              {forecastData.length > 0 ? (
                forecastData.slice(0, 6).map((forecast, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-sm" style={{ flexShrink: 0, minHeight: '48px' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{forecast.icon}</span>
                      <span className="text-lg font-bold text-[#f97316]">+{forecast.high}{unitSymbol}</span>
                      <span className="text-xs font-medium text-green-400">/ {forecast.low}{unitSymbol}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">{forecast.date}</div>
                      <div className="text-xs font-medium text-slate-600">{forecast.day}</div>
                    </div>
                  </div>
                ))
              ) : (
                Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 shadow-sm" style={{ flexShrink: 0, minHeight: '48px' }}>
                    <span className="text-sm text-slate-400">No forecast data</span>
                  </div>
                ))
              )}
            </div>
        </Card>
        )}

        {/* Right: Temperature Trend Visualization */}
        {loading || weatherLoading ? (
          <Card className="rounded-[2rem] border-none bg-white p-5 shadow-sm relative z-10" style={{ height: '445px', width: '100%', minHeight: '445px', maxHeight: '445px' }}>
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSkeleton className="w-full h-full rounded" />
            </div>
          </Card>
        ) : (
          <Card className="rounded-[2rem] border-none bg-white p-5 shadow-sm relative z-10" style={{ height: '445px', width: '100%', minHeight: '445px', maxHeight: '445px' }}>
            {/* Temperature Trend Chart - Responsive Container */}
            <div className="w-full" style={{ height: 'calc(445px - 20px - 20px)' }}>
              <TemperatureTrendChart data={temperatureData} locationIndex={currentLocationIndex} />
            </div>
        </Card>
        )}
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
