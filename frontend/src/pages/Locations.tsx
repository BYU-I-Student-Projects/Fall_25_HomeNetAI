import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Bell,
  Menu,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  Droplet,
  Wind,
  Gauge,
} from "lucide-react";

type WeatherLocation = {
  id: number;
  city: string;
  condition: string;
  icon: "sun" | "cloud" | "partly" | "rain";
  temperature: number;
  sparkline: number[];
  high: number;
  low: number;
  trend: { hour: string; value: number }[];
};

const iconMap: Record<WeatherLocation["icon"], React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  cloud: Cloud,
  partly: CloudSun,
  rain: CloudRain,
};

const locationsData: WeatherLocation[] = [
  {
    id: 1,
    city: "Seattle, WA",
    condition: "Cloudy",
    icon: "cloud",
    temperature: 18,
    sparkline: [15, 16, 16.2, 17, 17.5, 18, 17.8, 17.3],
    high: 20,
    low: 12,
    trend: [
      { hour: "04", value: 14.2 },
      { hour: "08", value: 15.1 },
      { hour: "12", value: 17.8 },
      { hour: "16", value: 18.6 },
      { hour: "20", value: 17.3 },
      { hour: "00", value: 15.4 },
    ],
  },
  {
    id: 2,
    city: "Austin, TX",
    condition: "Sunny",
    icon: "sun",
    temperature: 30,
    sparkline: [26, 27, 28, 30, 31, 31.2, 30],
    high: 33,
    low: 24,
    trend: [
      { hour: "04", value: 23 },
      { hour: "08", value: 25 },
      { hour: "12", value: 30 },
      { hour: "16", value: 32 },
      { hour: "20", value: 29 },
      { hour: "00", value: 26 },
    ],
  },
  {
    id: 3,
    city: "Boston, MA",
    condition: "Light Rain",
    icon: "rain",
    temperature: 14,
    sparkline: [11, 11.5, 12, 13, 13.5, 13.8, 14],
    high: 16,
    low: 9,
    trend: [
      { hour: "04", value: 10 },
      { hour: "08", value: 11.4 },
      { hour: "12", value: 13 },
      { hour: "16", value: 14.1 },
      { hour: "20", value: 13.3 },
      { hour: "00", value: 11.2 },
    ],
  },
  {
    id: 4,
    city: "Denver, CO",
    condition: "Partly Sunny",
    icon: "partly",
    temperature: 22,
    sparkline: [16, 17.2, 18.1, 20.3, 23.5, 24, 22.6],
    high: 26,
    low: 13,
    trend: [
      { hour: "04", value: 15 },
      { hour: "08", value: 17 },
      { hour: "12", value: 21 },
      { hour: "16", value: 24 },
      { hour: "20", value: 22 },
      { hour: "00", value: 18 },
    ],
  },
];

const Sparkline = ({ data }: { data: number[] }) => {
  const width = 150;
  const height = 54;
  const padding = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((value - min) / span) * (height - padding * 2) - padding;
    return { x, y };
  });
  const path = points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke="#0F4C5C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, idx) => (
        <circle key={idx} cx={point.x} cy={point.y} r={1.5} fill="#0F4C5C" />
      ))}
    </svg>
  );
};

const TrendLineChart = ({ data }: { data: { hour: string; value: number }[] }) => {
  const width = 520;
  const height = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 30 };
  const min = Math.min(...data.map((d) => d.value)) - 1;
  const max = Math.max(...data.map((d) => d.value)) + 1;
  const span = max - min || 1;
  const points = data.map((point, idx) => {
    const x = padding.left + (idx / (data.length - 1)) * (width - padding.left - padding.right);
    const y = padding.top + (1 - (point.value - min) / span) * (height - padding.top - padding.bottom);
    return { x, y, ...point };
  });
  const path = points.map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0F4C5C" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0F4C5C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`}
        fill="url(#trendFill)"
        opacity={0.5}
      />
      <path d={path} fill="none" stroke="#0F4C5C" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={point.hour}>
          <circle cx={point.x} cy={point.y} r={4} fill="#fff" stroke="#0F4C5C" strokeWidth={2} />
          <text x={point.x} y={height - 8} textAnchor="middle" className="text-[11px] fill-slate-500">
            {point.hour}
          </text>
        </g>
      ))}
    </svg>
  );
};

const LocationCard = ({ location }: { location: WeatherLocation }) => {
  const Icon = iconMap[location.icon];
  return (
    <div className="flex h-full flex-col rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Location</p>
          <h3 className="text-lg font-semibold text-slate-900">{location.city}</h3>
          <p className="text-sm text-slate-500">{location.condition}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <Icon className="h-7 w-7 text-[#0F4C5C]" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-4xl font-semibold text-slate-900">{location.temperature}°</p>
          <div className="mt-2 flex gap-4 text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>H {location.high}°</span>
            <span>L {location.low}°</span>
          </div>
        </div>
        <Sparkline data={location.sparkline} />
      </div>
    </div>
  );
};

const PlaceholderCard = () => (
  <button className="flex h-full flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-4 text-slate-400 shadow-sm transition hover:border-[#0F4C5C] hover:text-[#0F4C5C] overflow-hidden">
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-current">
      <Plus className="h-5 w-5" />
    </div>
    <p className="mt-3 text-sm font-medium">Add location</p>
  </button>
);

const GaugeCard = () => (
  <div className="flex h-full flex-col rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm overflow-hidden">
    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Atmospheric balance</p>
    <div className="mt-2 flex flex-1 items-center justify-center min-h-0">
      <Gauge className="h-20 w-20 text-[#0F4C5C]" />
    </div>
    <div className="mt-2 text-center">
      <p className="text-sm text-slate-500">Comfort index</p>
      <p className="text-xl font-semibold text-slate-900">76%</p>
    </div>
  </div>
);

const WindVisualCard = () => (
  <div className="flex h-full flex-col rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wind & humidity</p>
    <div className="mt-6 flex flex-1 items-center justify-between gap-4">
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-4 py-6">
        <Wind className="h-7 w-7 text-[#0F4C5C]" />
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wind</p>
        <p className="text-2xl font-semibold text-slate-900">19 km/h</p>
      </div>
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-slate-50 px-4 py-6">
        <Droplet className="h-7 w-7 text-[#0F4C5C]" />
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Humidity</p>
        <p className="text-2xl font-semibold text-slate-900">63%</p>
      </div>
    </div>
  </div>
);

const Locations = () => {
  const locations = useMemo(() => locationsData, []);
  const padWithPlaceholders = (data: WeatherLocation[], count: number) => {
    const items: (WeatherLocation | "placeholder")[] = [...data];
    while (items.length < count) {
      items.push("placeholder");
    }
    return items.slice(0, count);
  };

  const row1 = padWithPlaceholders(locations.slice(0, 4), 4);
  const row2 = padWithPlaceholders(locations.slice(4, 7), 3);
  const trendSource = locations[0]?.trend ?? [];

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
          <h2 className="text-xl font-semibold text-[#0F4C5C]">Weather Locations</h2>
        </div>
        
        {/* Search and Icons - Top right */}
        <div className="absolute right-6 flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0F4C5C]" />
          <Input
            type="text"
            placeholder="Search locations, forecasts..."
            className="pl-11 pr-4 h-12 w-72 rounded-full bg-white shadow-sm border-0 focus-visible:ring-2 focus-visible:ring-[#0F4C5C]/20"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white shadow-sm hover:bg-slate-50 border-0">
          <Bell className="h-6 w-6 text-[#0F4C5C]" />
        </Button>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-white shadow-sm hover:bg-slate-50 border-0">
          <Menu className="h-6 w-6 text-[#0F4C5C]" />
        </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col gap-4 pt-20 px-6 pb-6" style={{ height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-4 flex-none h-[203px] min-h-0">
          {row1.map((item, idx) =>
            item === "placeholder" ? <PlaceholderCard key={`placeholder-${idx}`} /> : <LocationCard key={item.id} location={item} />
          )}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-4 gap-4 flex-none h-[203px] min-h-0">
          {row2.map((item, idx) =>
            item === "placeholder" ? <PlaceholderCard key={`placeholder-row2-${idx}`} /> : <LocationCard key={item.id} location={item} />
          )}
          <GaugeCard />
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-[2fr,1fr] gap-4 flex-none h-[240px] mt-4">
          <div className="flex flex-col rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Trend</p>
                <h3 className="text-lg font-semibold text-slate-900">Temperature</h3>
              </div>
              <p className="text-sm text-slate-500">Last 24 hours</p>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
              <span>Current: <strong className="text-slate-900">{locations[0]?.temperature ?? "--"}°C</strong></span>
              <span>Change: <strong className="text-[#0F4C5C]">+1.2°C</strong></span>
            </div>
            <div className="mt-4 flex-1">
              {trendSource.length ? <TrendLineChart data={trendSource} /> : <div className="h-full flex items-center justify-center text-slate-400 text-sm">No trend data</div>}
            </div>
          </div>
          <WindVisualCard />
        </div>
      </div>
    </div>
  );
};

export default Locations;
