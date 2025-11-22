import { format } from "date-fns";
import { useState } from "react";
import { MapPin, ArrowRight, Mic, CloudRain, Search, Plus, Minus, Download, ChevronDown, Bell, Menu, Calendar, Cloud, ArrowUp, ArrowDown, Minus as MinusIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Wind Chart Component
const WindChart = () => {
  // Sample data for last 12 hours
  const windData = [
    { time: "00", speedKmh: 4.2 },
    { time: "01", speedKmh: 5.1 },
    { time: "02", speedKmh: 6.0 },
    { time: "03", speedKmh: 5.8 },
    { time: "04", speedKmh: 6.5 },
    { time: "05", speedKmh: 7.2 },
    { time: "06", speedKmh: 8.1 },
    { time: "07", speedKmh: 9.5 },
    { time: "08", speedKmh: 10.2 },
    { time: "09", speedKmh: 11.8 },
    { time: "10", speedKmh: 12.5 },
    { time: "11", speedKmh: 13.2 },
  ];

  const chartWidth = 320;
  const chartHeight = 120;
  const padding = { top: 10, right: 10, bottom: 25, left: 10 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const minSpeed = Math.min(...windData.map(d => d.speedKmh));
  const maxSpeed = Math.max(...windData.map(d => d.speedKmh));
  const speedRange = maxSpeed - minSpeed || 1;

  // Calculate points for the line
  const points = windData.map((point, index) => {
    const x = padding.left + (index / (windData.length - 1)) * graphWidth;
    const y = padding.top + graphHeight - ((point.speedKmh - minSpeed) / speedRange) * graphHeight;
    return { x, y, time: point.time, speed: point.speedKmh };
  });

  // Create path for the line
  const pathData = points.map((point, index) => {
    return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }).join(' ');

  // Create path for the fill area
  const fillPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

  return (
    <svg width={chartWidth} height={chartHeight} className="overflow-visible">
      {/* Fill area under the line */}
      <path
        d={fillPath}
        fill="url(#windGradient)"
        opacity={0.2}
      />
      <defs>
        <linearGradient id="windGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Main line */}
      <path
        d={pathData}
        fill="none"
        stroke="#14b8a6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Time labels on X axis - show 00, 04, 08, 12 */}
      {[0, 4, 8, 11].map((index) => {
        const point = points[index];
        if (!point) return null;
  return (
          <text
            key={point.time}
            x={point.x}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-[10px] fill-slate-400"
          >
            {point.time}
          </text>
        );
      })}
    </svg>
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

const TemperatureTrendChart = ({ data }: TemperatureTrendChartProps = {}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);

  // Use provided data or generate sample data for last 24 hours
  const tempData: TemperatureDataPoint[] = data || Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    // Simulate temperature variation throughout the day
    const baseTemp = 20;
    const variation = Math.sin((hour / 24) * Math.PI * 2) * 8;
    const random = (Math.random() - 0.5) * 2;
    return {
      hour: hour.toString().padStart(2, '0'),
      temperature: Math.round((baseTemp + variation + random) * 10) / 10,
    };
  });

  // Use responsive dimensions - will scale based on container
  const padding = { top: 40, right: 50, bottom: 50, left: 70 };
  // Base dimensions for viewBox, will scale responsively
  const baseWidth = 800;
  const baseHeight = 280;
  const graphWidth = baseWidth - padding.left - padding.right;
  const graphHeight = baseHeight - padding.top - padding.bottom;

  const minTemp = Math.min(...tempData.map(d => d.temperature));
  const maxTemp = Math.max(...tempData.map(d => d.temperature));
  const tempRange = maxTemp - minTemp || 1;
  const avgTemp = tempData.reduce((sum, d) => sum + d.temperature, 0) / tempData.length;
  
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

  // Create smooth curved path using quadratic bezier curves
  const createSmoothPath = (pointArray: Array<{ x: number; y: number; hour: string; temp: number }>) => {
    if (pointArray.length < 2) return '';
    
    let path = `M ${pointArray[0].x} ${pointArray[0].y}`;
    
    for (let i = 0; i < pointArray.length - 1; i++) {
      const current = pointArray[i];
      const next = pointArray[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;
      
      if (i === 0) {
        path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
      } else {
        const prev = pointArray[i - 1];
        const prevMidX = (prev.x + current.x) / 2;
        path += ` Q ${current.x} ${current.y} ${midX} ${midY}`;
      }
    }
    
    // Add final line to last point
    const last = pointArray[pointArray.length - 1];
    path += ` L ${last.x} ${last.y}`;
    
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

  // Determine line color based on temperature
  const lineColor = avgTemp > 25 ? '#f59e0b' : avgTemp > 15 ? '#14b8a6' : '#3b82f6';

  return (
    <div className="w-full flex flex-col">
      {/* Header Section - Even Layout */}
      <div className="mb-3">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Temperature Trend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Last 24 hours</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">High:</span>
              <span className="font-semibold text-slate-900">{maxTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Low:</span>
              <span className="font-semibold text-slate-900">{minTemp.toFixed(1)}°C</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Avg:</span>
              <span className="font-semibold text-slate-900">{avgTemp.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* Current Temperature and Trend Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">{currentTemp.toFixed(1)}°C</span>
            <div className="flex items-center gap-2">
              {trend === 'rising' && <ArrowUp className="h-5 w-5 text-green-600" />}
              {trend === 'falling' && <ArrowDown className="h-5 w-5 text-red-600" />}
              {trend === 'steady' && <MinusIcon className="h-5 w-5 text-slate-400" />}
              <div className="flex flex-col">
                <span className={`text-sm font-semibold leading-tight ${
                  trend === 'rising' ? 'text-green-600' : 
                  trend === 'falling' ? 'text-red-600' : 
                  'text-slate-400'
                }`}>
                  {trend === 'rising' ? 'Rising' : trend === 'falling' ? 'Falling' : 'Steady'}
                </span>
                <span className={`text-xs leading-tight ${
                  trend === 'rising' ? 'text-green-600' : 
                  trend === 'falling' ? 'text-red-600' : 
                  'text-slate-400'
                }`}>
                  {trendDiff}° ({changePercent}%)
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500">vs previous hour</span>
        </div>
      </div>

      {/* Chart - Responsive Container */}
      <div className="w-full flex-1 flex flex-col min-h-0" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
        <div className="w-full flex-1 relative" style={{ minHeight: '150px' }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${baseWidth} ${baseHeight}`} 
            className="overflow-visible" 
            preserveAspectRatio="xMidYMid meet"
            style={{ display: 'block' }}
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

        {/* Grid lines (horizontal) - cleaner */}
        {Array.from({ length: yAxisSteps + 1 }, (_, i) => {
          const tempValue = yAxisMin + (i * yAxisStep);
          const y = padding.top + graphHeight - ((tempValue - minTemp) / tempRange) * graphHeight;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + graphWidth}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                opacity={i === 0 || i === yAxisSteps ? "0.8" : "0.4"}
              />
            </g>
          );
        })}

        {/* Y-axis labels - improved */}
        {Array.from({ length: yAxisSteps + 1 }, (_, i) => {
          const tempValue = yAxisMin + (i * yAxisStep);
          const y = padding.top + graphHeight - ((tempValue - minTemp) / tempRange) * graphHeight;
          return (
            <text
              key={i}
              x={padding.left - 20}
              y={y + 4}
              textAnchor="end"
              className="text-xs fill-slate-600 font-medium"
              style={{ dominantBaseline: 'middle' }}
            >
              {tempValue.toFixed(0)}°
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

        {/* Hour labels on X axis - show every 4 hours for better readability */}
        {points.filter((_, i) => i % 4 === 0).map((point, idx) => (
          <g key={`${point.hour}-${idx}`}>
            <line
              x1={point.x}
              y1={padding.top + graphHeight}
              x2={point.x}
              y2={padding.top + graphHeight + 6}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <text
              x={point.x}
              y={baseHeight - 12}
              textAnchor="middle"
              className="text-xs fill-slate-600 font-medium"
              style={{ dominantBaseline: 'hanging' }}
            >
              {point.hour}:00
            </text>
          </g>
        ))}

        {/* Interactive hover areas for each point */}
        {points.map((point, index) => (
          <g key={index}>
            {/* Invisible larger hit area for easier hovering */}
            <circle
              cx={point.x}
              cy={point.y}
              r="8"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => {
                setHoveredIndex(index);
                const rect = e.currentTarget.getBoundingClientRect();
                const svg = e.currentTarget.ownerSVGElement;
                if (svg) {
                  const svgRect = svg.getBoundingClientRect();
                  setMousePosition({
                    x: point.x * (svgRect.width / baseWidth),
                    y: point.y * (svgRect.height / baseHeight)
                  });
                }
              }}
            />
            {/* Visible point circle - larger when hovered */}
            <circle
              cx={point.x}
              cy={point.y}
              r={hoveredIndex === index ? "6" : "3"}
              fill={hoveredIndex === index ? lineColor : lineColor}
              opacity={hoveredIndex === index ? "1" : "0.7"}
              stroke="white"
              strokeWidth={hoveredIndex === index ? "2.5" : "1.5"}
              className="transition-all duration-200"
            />
          </g>
        ))}

        {/* Hover tooltip */}
        {hoveredIndex !== null && mousePosition && (
          <g>
            {/* Vertical line at hovered point */}
            <line
              x1={points[hoveredIndex].x}
              y1={padding.top}
              x2={points[hoveredIndex].x}
              y2={padding.top + graphHeight}
              stroke={lineColor}
              strokeWidth="1.5"
              strokeDasharray="4,4"
              opacity="0.5"
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
              {points[hoveredIndex].temp.toFixed(1)}°C
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

const Dashboard = () => {
  const today = new Date();

  return (
    <div className="h-screen bg-gray-100 overflow-hidden flex flex-col relative" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-20 bg-gray-100 z-50 flex items-center" style={{ position: 'fixed', zIndex: 50 }}>
        {/* HomeNetAI - Top left */}
        <div className="absolute left-6">
          <h1 className="text-xl font-bold text-[#0F4C5C]">HomeNetAI</h1>
        </div>
        
        {/* Centered Page Title */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <h2 className="text-xl font-semibold text-[#0F4C5C]">Overview Dashboard</h2>
        </div>
        
        {/* Search and Icons - Top right */}
        <div className="absolute right-6 flex items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0F4C5C]" />
            <Input
              type="text"
              placeholder="Search for any Weather info....."
              className="pl-11 pr-4 h-12 w-72 rounded-full bg-white shadow-sm border-0 focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/20"
            />
          </div>
          
          {/* Notification Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white shadow-sm hover:bg-slate-50 border-0"
          >
            <Bell className="h-6 w-6 text-[#0F4C5C]" />
          </Button>
          
          {/* Menu Icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-white shadow-sm hover:bg-slate-50 border-0"
          >
            <Menu className="h-6 w-6 text-[#0F4C5C]" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col pt-20 px-6" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Top Weather Header Strip - Transparent */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex w-full h-[80px] items-center gap-6">
          {/* Left Group: Date, Button, Icon */}
          <div className="flex items-center gap-6">
            {/* Date Block - Matching Image Style */}
            <div className="flex items-center gap-3">
              {/* Date Card - Just the number */}
              <div className="flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-white">
                <span className="text-[36px] font-bold text-[#0F4C5C] leading-none">
                  {format(today, "dd")}
                </span>
              </div>
              {/* Day Name and Month - Text beside card */}
              <div className="flex flex-col">
                <p className="text-sm font-medium text-slate-700 leading-tight">{format(today, "EEEE")}.</p>
                <p className="text-lg font-bold text-slate-900 leading-tight">{format(today, "MMMM")}</p>
              </div>
            </div>

            {/* Show Today's Weather Button */}
            <Button className="h-[50px] w-[260px] rounded-[30px] bg-[#0F4C5C] px-5 text-base text-white hover:bg-[#0a3b4a] flex items-center justify-center gap-2">
              <CloudRain className="h-5 w-5" />
              Show Today&apos;s Weather
              <ArrowRight className="h-5 w-5" />
            </Button>

            {/* Small Weather Icon */}
            <div className="flex w-12 h-12 rounded-3xl bg-white items-center justify-center">
              <CloudRain className="h-[22px] w-[22px] text-[#0F4C5C]" />
            </div>
          </div>

          {/* Element 4: Title + Subtitle */}
          <div className="flex-1 flex flex-col items-start justify-center pl-8">
            <div className="flex items-center gap-2">
              <h2 className="text-[28px] font-bold text-black">Hey, Need a Forecast?</h2>
              <span className="text-xl">☁️</span>
            </div>
            <p className="text-[18px] text-slate-500 mt-1 font-normal">Ask me anything about the weather!</p>
          </div>

          {/* Element 5: Microphone Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-[50px] h-[50px] rounded-[25px] bg-white hover:bg-slate-50 border-0"
          >
            <Mic className="h-6 w-6 text-[#0F4C5C]" />
          </Button>
        </div>
      </div>

      {/* Middle Grid - 4 Cards */}
      <div className="mb-5 grid gap-4 lg:grid-cols-4 flex-shrink-0 relative z-10" style={{ height: '260px' }}>
        {/* Card 1: Current Weather */}
        <Card className="h-full rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10">
          <CardContent className="p-5 flex flex-col flex-1">
            {/* Top Row: Weather Icon and Search Button */}
            <div className="flex items-center justify-between h-[52px]">
              {/* Weather Icon */}
              <div className="text-[60px] leading-none">🌧️</div>
              
              {/* Search Button */}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 rounded-full bg-white border-slate-300 shadow-sm hover:bg-slate-50 flex-shrink-0"
              >
                <Search className="h-5 w-5 text-[#0F4C5C]" />
              </Button>
            </div>
            
            {/* Temperature Section */}
            <div className="mt-2">
              {/* Temperature Text */}
              <div className="text-[42px] font-bold text-black leading-none">
                26°C
              </div>
              
              {/* Condition Row */}
              <div className="flex items-center gap-1.5 mt-1">
                <Cloud className="h-5 w-5 text-slate-400" />
                <p className="text-base font-medium text-slate-500">Rainy Weather Today</p>
              </div>
            </div>
            
            {/* Bottom Info Section */}
            <div className="mt-[10px] flex flex-col gap-2">
              {/* Location Row */}
              <div className="flex items-center gap-1.5 h-6">
                <MapPin className="h-[18px] w-[18px] text-slate-500" />
                <span className="text-sm text-slate-600">California, US state</span>
              </div>
              
              {/* Date Row */}
              <div className="flex items-center gap-1.5 h-6">
                <Calendar className="h-[18px] w-[18px] text-slate-500" />
                <span className="text-sm text-slate-600">
                  20 January, 2025 <span className="font-bold">4:00 AM</span>
                </span>
              </div>
            </div>
        </CardContent>
        </Card>

        {/* Card 2: Wind Status */}
        <Card className="h-full rounded-[20px] border-none bg-white shadow-sm flex flex-col relative z-10">
          <CardContent className="p-5 flex flex-col flex-1 gap-3">
            {/* Section 1: Title Row */}
            <div className="flex items-center justify-between h-[30px]">
              <h3 className="text-base font-semibold text-slate-900">Wind Status</h3>
              <span className="text-xs text-slate-500">Last 12 hours</span>
            </div>
            
            {/* Section 2: Main Chart */}
            <div className="w-[320px] h-[120px] mt-2">
              <WindChart />
            </div>

            {/* Section 3: Summary Row */}
            <div className="flex items-baseline justify-between h-10 mt-2">
              <div className="flex items-baseline gap-1">
                <span className="text-[28px] font-bold text-slate-900">6.50</span>
                <span className="text-xs text-slate-400">km/h</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[13px] text-slate-600">4:00 AM</span>
                <span className="text-[11px] text-slate-400">local time</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Review Rating */}
        <Card className="h-full rounded-[20px] border-none bg-[#0F4C5C] text-white shadow-sm flex flex-col relative z-10">
          <CardContent className="flex h-full flex-col justify-between p-5">
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-white opacity-100" />
              <div className="h-1.5 w-1.5 rounded-full bg-white opacity-50" />
              <div className="h-1.5 w-1.5 rounded-full bg-white opacity-30" />
              <div className="h-1.5 w-1.5 rounded-full bg-white opacity-30" />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs opacity-70">Review Rating</p>
              <h3 className="text-lg font-bold leading-tight">How is the weather treating you today?</h3>
            </div>

            <div className="mt-3 flex justify-between gap-1.5">
              {['☁️', '🌧️', '🌤️', '☀️', '🌈'].map((icon, i) => (
                <button key={i} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base shadow-sm transition hover:scale-110">
                  {icon}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: 3D Map */}
        <Card className="h-full relative overflow-hidden rounded-[20px] border-none bg-slate-900 p-0 shadow-sm flex flex-col z-10">
          <img 
            src="/3d.jpg" 
            alt="3D Map" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          
          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex flex-col gap-1.5 self-end">
              <Button size="icon" className="h-7 w-7 rounded-full bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="icon" className="h-7 w-7 rounded-full bg-white text-slate-900 hover:bg-slate-100">
                <Minus className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <div className="rounded-lg bg-white p-1.5">
                <p className="flex items-center gap-1 text-[9px] text-slate-500">
                  <CloudRain className="h-2.5 w-2.5" /> Precipitation
                </p>
                <p className="text-sm font-bold text-slate-900">76%</p>
              </div>
              <div className="rounded-lg bg-white p-1.5">
                <p className="flex items-center gap-1 text-[9px] text-slate-500">
                  💨 Wind Speed
                </p>
                <p className="text-sm font-bold text-slate-900">12 km/h</p>
              </div>
              <div className="rounded-lg bg-white p-1.5">
                <p className="flex items-center gap-1 text-[9px] text-slate-500">
                  🌡️ Temperature
                </p>
                <p className="text-sm font-bold text-slate-900">38°</p>
              </div>
            </div>
          </div>
            </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-4 lg:grid-cols-[1fr,2fr] flex-shrink-0 relative z-10 mt-auto mb-20" style={{ height: '445px', minHeight: '445px', maxHeight: '445px' }}>
        {/* Left: 7 Days Forecast */}
        <Card className="rounded-[2rem] border-none bg-white p-5 shadow-sm relative z-10" style={{ height: '445px', width: '100%', minHeight: '445px', maxHeight: '445px' }}>
          <div className="flex items-center justify-between mb-3" style={{ height: '28px', minHeight: '28px' }}>
            <h3 className="text-sm font-medium text-slate-700">6 Days Forecast</h3>
          </div>

          <div className="space-y-2 overflow-hidden" style={{ height: 'calc(445px - 20px - 28px - 20px)', minHeight: 'calc(445px - 20px - 28px - 20px)', maxHeight: 'calc(445px - 20px - 28px - 20px)' }}>
            {/* Forecast Day Items - 7 Days */}
            {Array.from({ length: 6 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i + 1);
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dayName = dayNames[date.getDay()];
              const dayShort = dayName.substring(0, 3);
              const dateStr = format(date, 'd MMM');
              
              const weatherIcons = ['☀️', '⛅', '🌦️', '⛈️', '🌧️', '☁️', '🌤️'];
              const icon = weatherIcons[i % weatherIcons.length];
              const highTemp = Math.floor(Math.random() * 15) + 20;
              const lowTemp = Math.floor(Math.random() * 10) + 10;
              
              return { icon, high: `+${highTemp}°`, low: `${lowTemp}`, date: dateStr, day: dayShort };
            }).map((forecast, i) => (
              <div key={i} className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 shadow-sm" style={{ flexShrink: 0, minHeight: '48px' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{forecast.icon}</span>
                  <span className="text-lg font-bold text-[#0F4C5C]">{forecast.high}</span>
                  <span className="text-xs font-medium text-green-400">/ {forecast.low}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">{forecast.date}</div>
                  <div className="text-xs font-medium text-slate-600">{forecast.day}</div>
                </div>
              </div>
            ))}
          </div>
      </Card>

        {/* Right: Temperature Trend Visualization */}
        <Card className="rounded-[2rem] border-none bg-white p-5 shadow-sm relative z-10" style={{ height: '445px', width: '100%', minHeight: '445px', maxHeight: '445px' }}>
          {/* Temperature Trend Chart - Responsive Container */}
          <div className="w-full" style={{ height: 'calc(445px - 20px - 20px)' }}>
            <TemperatureTrendChart />
          </div>
      </Card>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
