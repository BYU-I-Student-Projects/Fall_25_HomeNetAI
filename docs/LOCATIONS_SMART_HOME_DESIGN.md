# Combined Locations & Smart Home Page Design

## Overview
This document outlines design concepts for combining the Locations and Smart Home pages into a unified, context-aware interface. 

**Key Assumption**: Most users will have **1 main location with smart home devices** (the demo location), and **other locations are primarily for weather tracking**. This design optimizes for this common use case.

---

## Design Concept 1: **Hybrid Split-View with Smart Home Focus (Recommended)**

### Core Idea
Combines the best of split-screen and dual-mode:
- **Left Panel**: All locations (weather tracking)
- **Right Panel**: Smart Home controls (always visible for the main location)
- The main smart home location is clearly distinguished
- Other locations are weather-only and don't have device controls

### Visual Layout

#### **Main View: Split Screen with Smart Home Always Visible**
```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Locations & Smart Home"                            │
├──────────────────────────┬──────────────────────────────────┤
│  WEATHER LOCATIONS        │  SMART HOME                     │
│  (Left - 40%)            │  (Right - 60%)                   │
├──────────────────────────┼──────────────────────────────────┤
│                          │  ┌──────────────────────────────┐│
│  ┌──────────────┐       │  │  Phoenix, AZ  🏠 MAIN HOME   ││
│  │ Phoenix      │ ◄──────┤  │  ☀️ 85°F  Clear Sky          ││
│  │  ☀️ 85°F     │ ACTIVE │  │  [3 devices active]          ││
│  │  🏠 Smart    │        │  └──────────────────────────────┘│
│  │  [Main Home] │        │                                  │
│  └──────────────┘       │  ┌──────────────────────────────┐│
│                          │  │  Living Room                 ││
│  ┌──────────────┐       │  │  🌡️ Thermostat: 72°F        ││
│  │  Seattle      │       │  │  [━━━━━━━━━━━━━━━━━━━━]      ││
│  │  ☁️ 62°F     │       │  │  💡 Light: On  [Toggle]      ││
│  │  Weather Only │       │  │  🔌 Smart Plug: Off [Toggle] ││
│  └──────────────┘       │  └──────────────────────────────┘│
│                          │                                  │
│  ┌──────────────┐       │  ┌──────────────────────────────┐│
│  │  Miami        │       │  │  Bedroom                     ││
│  │  🌤️ 78°F     │       │  │  🔒 Lock: Locked  [Toggle]   ││
│  │  Weather Only │       │  │  💡 Light: Off  [Toggle]    ││
│  └──────────────┘       │  └──────────────────────────────┘│
│                          │                                  │
│  ┌──────────────┐       │  ┌──────────────────────────────┐│
│  │  Denver       │       │  │  Kitchen                     ││
│  │  ❄️ 32°F     │       │  │  🔌 Smart Plug: On [Toggle] ││
│  │  Weather Only │       │  └──────────────────────────────┘│
│  └──────────────┘       │                                  │
│                          │  Quick Actions:                  │
│  ┌──────────────┐       │  [All On] [All Off] [Auto Mode]  │
│  │  + Add Location│      │                                  │
│  └──────────────┘       │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

**Key Features:**
- **Left Panel**: Scrollable list of all locations
  - Main smart home location is clearly marked with "🏠 Smart" and "[Main Home]" badge
  - Other locations show "Weather Only" indicator
  - Active location is highlighted
- **Right Panel**: Always shows smart home controls for the main location
  - Devices grouped by room
  - Real-time controls (toggles, sliders)
  - Quick action buttons
  - Weather context at top
- **No mode switching needed** - everything visible at once
- **Clear distinction** between smart home location and weather-only locations

---

## Design Concept 2: **Collapsible Smart Home Panel**

### Core Idea
Locations grid is primary, with a collapsible smart home panel that slides in from the right when the main location is selected.

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "Locations & Smart Home"                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Phoenix  │  │  Seattle │  │   Miami  │  │  Denver  │    │
│  │  ☀️ 85°F │  │  ☁️ 62°F  │  │  🌤️ 78°F │  │  ❄️ 32°F │    │
│  │  🏠 MAIN │  │  Weather │  │  Weather │  │  Weather │    │
│  │  [3 dev] │  │   Only   │  │   Only   │  │   Only   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│       │                                                        │
│       ▼ (Click to expand smart home panel)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Phoenix Smart Home  [Collapse ▲]                    │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│  │
│  │  │ Living Room  │  │  Bedroom     │  │  Kitchen   ││  │
│  │  │ 🌡️ 72°F     │  │  💡 On       │  │  🔌 Off    ││  │
│  │  └──────────────┘  └──────────────┘  └────────────┘│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Primary view: Locations grid (full width)
- Clicking main location expands smart home panel below
- Panel can be collapsed/expanded
- Other locations remain clickable for weather details
- Good for users who want to focus on locations first

---

## Design Concept 3: **Tab-Based with Contextual Expansion**

### Core Idea
Tabs at top, but clicking a location with devices expands a smart home panel below.

```
┌─────────────────────────────────────────────────────────┐
│  [Locations] [Smart Home] [All Devices]                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Phoenix  │  │  Seattle │  │   Miami  │              │
│  │  ☀️ 85°F │  │  ☁️ 62°F  │  │  🌤️ 78°F │              │
│  │ [3 devices]│ │ [0 devices]│ │ [5 devices]│              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       │                                                  │
│       ▼ (Click expands)                                  │
│  ┌────────────────────────────────────────────────────┐│
│  │  Phoenix Smart Home Controls                      ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       ││
│  │  │ Thermostat│  │  Light   │  │  Plug    │       ││
│  │  │  72°F    │  │   On     │  │   Off    │       ││
│  │  └──────────┘  └──────────┘  └──────────┘       ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**
- Tabs for navigation
- Expandable panels for device controls
- Can view all devices across locations
- Clean, organized structure

---

## Design Concept 4: **Modal Overlay Transition**

### Core Idea
Clicking a location with devices opens a full-screen modal that slides in from the side.

```
┌─────────────────────────────────────────────────────────┐
│  Locations Grid (Background - Dimmed)                    │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Phoenix  │  │  Seattle │  │   Miami  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐│
│  │  Phoenix Smart Home  [X]                           ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         ││
│  │  │ Thermostat│  │  Light   │  │  Plug    │         ││
│  │  │  72°F    │  │   On     │  │   Off    │         ││
│  │  └──────────┘  └──────────┘  └──────────┘         ││
│  │                                                     ││
│  │  [Close] [Save Changes]                             ││
│  └────────────────────────────────────────────────────┘│
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**
- Modal overlay preserves context
- Easy to close and return
- Focused device management
- Smooth animations

---

## Recommended Implementation: **Concept 1 (Hybrid Split-View)**

### Why This Approach?
1. **Always visible**: Smart home controls always accessible (no mode switching)
2. **Clear distinction**: Main smart home location vs weather-only locations
3. **Efficient**: No need to click to see devices - they're right there
4. **Contextual**: Weather locations on left, smart home on right
5. **Realistic**: Matches the use case (1 smart home, multiple weather locations)
6. **Mobile-friendly**: Can stack vertically on mobile

### Technical Implementation

#### State Management
```typescript
type ViewMode = 'locations' | 'smartHome';
type SelectedLocation = Location | null;

interface PageState {
  mode: ViewMode;
  selectedLocation: SelectedLocation;
  locations: Location[];
  devices: Map<number, Device[]>; // locationId -> devices
}
```

#### Transition Animation
- Use CSS transitions for smooth mode switching
- Fade out locations grid, fade in device controls
- Slide animation from right to left
- Duration: 300-400ms

#### Device-Location Association
**Recommended**: Devices belong to the user, and we identify the "main smart home location" via:
- **Option A**: Add `is_main_location` boolean to locations table (recommended)
- **Option B**: First location with devices becomes the main location
- **Option C**: User can set a location as "main" in settings

**Implementation**: 
- Query: `SELECT * FROM locations WHERE is_main_location = true LIMIT 1`
- If no main location set, use first location that has devices
- Show all user devices in the smart home panel (they're all for the main location)

---

## UI Components Needed

### 1. Location Card (Enhanced)
```tsx
<LocationCard>
  - Weather icon & temp
  - Location name
  - "🏠 MAIN HOME" badge (if is_main_location)
  - "Weather Only" badge (if no devices)
  - Device count badge (if has devices)
  - Click handler: 
    - Main location: Scroll to smart home panel / highlight
    - Weather-only: Navigate to location detail page
</LocationCard>
```

### 2. Device Grid
```tsx
<DeviceGrid>
  - Grouped by room
  - Device cards with controls
  - Quick actions bar
</DeviceGrid>
```

### 3. Device Card
```tsx
<DeviceCard>
  - Device icon (type-based)
  - Device name
  - Status indicator
  - Control (toggle/slider/etc.)
  - Room label
</DeviceCard>
```

### 4. Mode Transition Button
```tsx
<BackButton>
  - "← Back to Locations"
  - Smooth transition trigger
</BackButton>
```

---

## User Flow

1. **User lands on page** → See split view:
   - Left: All locations (main location highlighted)
   - Right: Smart home controls for main location
2. **User clicks main location** → Highlights it, smart home panel stays visible
3. **User clicks weather-only location** → Navigate to location detail page (weather focus)
4. **User interacts with devices** → Real-time updates, no page change
5. **User scrolls locations** → Smart home panel stays fixed on right
6. **User wants to add devices** → Click "Add Device" button in smart home panel

---

## Smart Features to Consider

### 1. **Weather-Aware Automation**
- Show suggestions: "It's hot outside, lower thermostat?"
- Auto-adjust based on weather conditions
- Energy savings tips

### 2. **Location-Based Device Presets**
- "Phoenix Summer" preset: AC on, blinds closed
- "Seattle Winter" preset: Heat on, lights bright
- Quick apply buttons

### 3. **Device Status Indicators**
- Show which devices are active
- Energy consumption (if available)
- Last activity timestamps

### 4. **Quick Actions**
- "All Off" when leaving location
- "Comfort Mode" for optimal settings
- "Energy Save" mode

---

## Mobile Responsiveness

### Desktop (>1024px)
- Split view: 40% locations (left), 60% smart home (right)
- Location cards: 2-3 per row in left panel
- Full device controls visible in right panel
- Side-by-side room grouping

### Tablet (768px - 1024px)
- Split view: 45% locations, 55% smart home
- Location cards: 1-2 per row
- Stacked device controls
- Collapsible room sections

### Mobile (<768px)
- **Stacked view**: Locations on top, smart home below
- Location cards: 1-2 per row
- Smart home panel: Collapsible, expands when main location clicked
- Full-width device cards
- Swipe to expand/collapse smart home panel

---

## Color Scheme & Styling

- **Location Cards**: White background, subtle shadow
- **Device Cards**: White background, colored accent based on type
  - Thermostat: Blue (#3b82f6)
  - Light: Yellow (#f59e0b)
  - Plug: Green (#10b981)
  - Lock: Red (#ef4444)
  - Blind: Purple (#8b5cf6)
  - Camera: Gray (#6b7280)
- **Active States**: Use brand color (#0F4C5C)
- **Transitions**: Smooth, 300ms ease-in-out

---

## Next Steps

1. **Database Schema Update** (if needed)
   - Add `location_id` to devices table (optional)
   - Or use room-based mapping

2. **API Updates**
   - `GET /devices?location_id={id}` - Get devices for location
   - Or filter client-side by room/location mapping

3. **Frontend Implementation**
   - Create combined page component
   - Implement mode switching logic
   - Build device control components
   - Add transition animations

4. **Testing**
   - Test with 0, 1, and many devices per location
   - Test mode transitions
   - Test mobile responsiveness
   - Test device control interactions

---

## Alternative: Keep Separate but Add Quick Access

If combining feels too complex, consider:
- Keep pages separate
- Add "Smart Home" button on location cards
- Navigate to `/smart-home?location=phoenix`
- Filter devices by location on smart home page

This is simpler but less integrated.

---

## Questions to Consider

1. **Device-Location Relationship**: Devices are global to user, but associated with one "main" location
2. **Multiple Properties**: For demo, assume one main location with smart home. Future: could support multiple smart home locations
3. **Room Mapping**: Rooms belong to the main smart home location. Weather-only locations don't have rooms
4. **Default Behavior**: If user has devices but no main location set, use first location or prompt to set one
5. **Adding Devices**: Devices can only be added to the main location (for now)

---

## Conclusion

**Recommended Approach**: Concept 1 (Hybrid Split-View)
- **Optimized for real use case**: 1 main smart home location + multiple weather locations
- **Always accessible**: Smart home controls always visible (no clicking needed)
- **Clear distinction**: Main location clearly marked vs weather-only locations
- **Efficient**: No mode switching, everything in one view
- **Mobile-friendly**: Stacks vertically on small screens

**Alternative**: Concept 2 (Collapsible Panel) if you prefer locations-first approach

---

## Implementation Priority

1. **Phase 1**: Basic split view
   - Left: Location list with main location highlighted
   - Right: Smart home device grid (all devices shown)
   - Mark main location with badge

2. **Phase 2**: Enhanced features
   - Device controls (toggles, sliders)
   - Room grouping
   - Quick actions

3. **Phase 3**: Polish
   - Animations
   - Weather-aware suggestions
   - Presets

Would you like me to start implementing Concept 1 (Hybrid Split-View)?

