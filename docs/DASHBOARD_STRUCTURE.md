# Dashboard Structure & Content Plan

## Overview
This document outlines the content and organization for each section of HomeNetAI to ensure a clean, professional, and uncluttered interface.

---

## 1. DASHBOARD (`/`)
**Purpose:** High-level overview and quick access to key information

### Header Section
- **Search Bar** - "Search for any Weather info..." (global search)
- **Conversational AI Prompt** - "Hey, Need a Forecast? Ask me anything about the weather!"
- **Time Tabs** - "Today", "Tomorrow", "Next 7 days" (toggle between views)
- **Action Buttons** - "Forecast" (selected) and "Air quality" (future)

### Top Section - Summary Cards (4 cards in a row)
1. **Current Weather Card** (Large, prominent)
   - Large weather icon/emoji
   - Current temperature (large, prominent)
   - Weather condition text ("Rainy Weather Today", "Mostly Sunny", etc.)
   - Location name
   - Date and time
   - Real feel temperature
   - Wind speed & direction
   - Pressure
   - Humidity
   - Sunrise/sunset times

2. **Wind Status Card**
   - Title: "Wind Status"
   - Line graph showing wind patterns over time
   - Current wind speed (e.g., "6.50 km/h")
   - Time reference
   - Visual chart overlay

3. **Review Rating Card** (Interactive)
   - Title: "Review Rating: How is the weather treating you today?"
   - Weather emoji/icons for feedback (cloud, sun, snowflake, rainbow)
   - Interactive rating system
   - User engagement element

4. **Map/Visualization Card**
   - 3D isometric map or visualization
   - Key metrics displayed:
     - Precipitation percentage
     - Wind Speed
     - Temperature
   - Visual representation of weather data

### Middle Section - Charts & Forecasts

#### Left Side - 7 Days Forecast Card
- **Title:** "7 Days Forecast"
- **Layout:** 
  - List of upcoming days with:
    - Day name and date
    - Weather icon
    - High/low temperatures
  - **Tomorrow Section** (Highlighted, larger):
    - Tomorrow's date
    - Temperature
    - Weather icon
    - Small line graph
    - Detailed forecast info

#### Right Side - Weather Charts
- **Chance of Rain Graph**
  - Vertical bar chart
  - Y-axis: Time intervals (10AM, 11AM, 12PM, etc.)
  - X-axis: Chance percentage or intensity
  - Visual representation of precipitation probability

- **Device Activity Overview** (Alternative chart)
  - Line/bar chart showing active vs inactive devices over time
  - Legend: Active (blue), Inactive (gray)
  - Time range selector (Daily/Weekly/Monthly)
  - Download Data button

### Bottom Section - Detail Grids

#### Locations & Weather Grid
- Grid of location cards (2-3 columns)
- Each card shows:
  - Location name
  - Current temperature
  - Humidity
  - Weather condition/icon
  - Wind speed
  - Click to view details

#### Smart Home Devices Grid
- Grid of device cards (2-3 columns)
- Shows first 6-9 devices
- Each card shows:
  - Device name
  - Device type icon
  - Status (on/off)
  - Quick toggle
  - Click to view details

---

## 2. LOCATIONS (`/locations`)
**Purpose:** Manage and view all tracked locations

### Header
- Title: "My Locations"
- Subtitle: "Track weather across X locations"
- **Time Tabs:** "Today", "Tomorrow", "Next 7 days" (optional, for filtering)
- Action: "Add Location" button

### Main Content
- **Grid Layout** (2-3 columns responsive)
- Each location card shows:
  - Location name (prominent)
  - Country/region
  - **Large weather icon/emoji**
  - Current temperature (large, prominent)
  - Weather condition text
  - **Detailed metrics:**
    - Real feel temperature
    - Wind speed & direction
    - Humidity
    - Pressure
    - Precipitation chance
  - Date and time
  - Delete button (on hover, top right)
  - Click to view detail page

### Empty State
- Large icon
- Message: "No locations yet"
- Subtitle: "Add your first location to start tracking weather"
- Call-to-action: "Add Location" button

### Add Location Dialog
- Search input with search icon
- Search button
- Search results list (scrollable)
- Each result shows:
  - Location name
  - Display name (full address)
  - Coordinates
  - Add button

---

## 3. LOCATION DETAIL (`/locations/:id`)
**Purpose:** Detailed weather information for a specific location

### Header
- Back button
- Location name
- Coordinates
- **Time Tabs:** "Today", "Tomorrow", "Next 7 days"
- **Action Buttons:** "Forecast" (selected), "Air quality" (future)

### Top Section - Current Weather Card (Large, Prominent)
- Large weather icon/emoji
- Current temperature (very large, prominent)
- Weather condition text
- Date and time
- **Detailed Information Grid:**
  - Real Feel temperature
  - Wind: Direction and speed (e.g., "N-E, 5-8 km/h")
  - Pressure (e.g., "1000MB")
  - Humidity (e.g., "51%")
  - Sunrise time
  - Sunset time
  - Visibility
  - UV index

### Middle Section - Forecasts

#### Left Side - 7 Days Forecast
- **Current Day Card** (Larger, highlighted)
  - Day name and date
  - Time (e.g., "11:42 PM")
  - Temperature (large)
  - Weather icon (large, colorful)
  - All detailed information (Real Feel, Wind, Pressure, Humidity, Sunrise, Sunset)

- **Next 6 Days Cards** (Smaller, uniform)
  - Day name
  - Weather icon
  - Temperature (high/low)
  - Click to expand details

#### Right Side - Charts
- **Chance of Rain Graph**
  - Vertical bar chart
  - Y-axis: Time intervals (10AM, 11AM, 12PM, 1PM, 2PM, 3PM, etc.)
  - X-axis: Chance percentage or intensity
  - Bars showing precipitation probability for each hour

- **Wind Report Chart** (Alternative)
  - Bar chart with positive/negative values
  - Title: "Damaging Wind Report" or "Wind Analysis"
  - Percentage change indicator (e.g., "A -10.2%")
  - Download Data button
  - X-axis: Days or hours
  - Y-axis: Wind speed values

### Bottom Section - Additional Features

#### Global Map Section (Optional)
- **Title:** "Global map"
- Interactive world map
- Weather markers with icons for different regions
- Map controls:
  - Undo/reset button
  - Layer settings
  - Zoom controls (+/-)
  - Center on location button
- **Explore Card** (overlay on map):
  - Text: "Explore global map of wind, weather and oceans condition."
  - Image: Satellite view or weather visualization
  - "Get started" button

#### Other Large Cities Section
- **Title:** "Other large cities" with "Show All >" link
- Grid of city cards (3-4 columns)
- Each card shows:
  - City name and country
  - Weather description (e.g., "Mostly Sunny", "Cloudy")
  - Weather icon
  - Temperature
  - Click to view details

### Additional Information
- Timezone
- Last updated timestamp
- Download data functionality

---

## 4. SMART HOME (`/smart-home`)
**Purpose:** Manage and control all smart home devices

### Header
- Title: "Smart Home"
- Subtitle: "Control and monitor your devices"
- Actions: "Add Device" button

### Filter Tabs (Optional)
- All
- By Room (if rooms are used)
- By Type (Thermostat, Light, Lock, etc.)

### Device Type Summary Cards (Top)
- Quick stats for each device type:
  - Thermostats count
  - Lights count
  - Locks count
  - Cameras count
  - Blinds count
  - Plugs count

### Main Content - Device Grid
- **Grid Layout** (2-4 columns responsive)
- Each device card shows:
  - Device name
  - Device type icon
  - Room (if assigned)
  - Status indicator (on/off)
  - Current value (temperature, brightness, etc.)
  - Quick toggle switch
  - Edit button
  - Delete button

### Device Card Actions
- Toggle on/off
- Adjust value (slider for lights, thermostat, etc.)
- Edit device settings
- Delete device

### Add Device Dialog
- Device name input
- Device type selector
- Room selector (optional)
- Initial status
- Initial value (if applicable)
- Color picker (for lights)
- Create button

---

## 5. SETTINGS (`/settings`)
**Purpose:** User preferences and account management

### Header
- Title: "Settings"
- Subtitle: "Manage your preferences and account"

### Sections (Cards)

#### Account Settings
- Username display
- Email display
- Change password (button)
- Account information

#### Preferences
- Dark mode toggle
- Temperature unit (Fahrenheit/Celsius)
- Date/time format
- Language (if applicable)

#### Notifications
- Email notifications toggle
- Weather alerts toggle
- Device alerts toggle

#### Data Management
- Export data button
- Delete account button (with confirmation)

#### About
- App version
- Description
- Links to documentation

---

## 6. NAVIGATION STRUCTURE

### Sidebar Navigation
**HOME Section:**
- Dashboard
- Locations
- Smart Home

**ANALYTICS Section:**
- Analytics (to be implemented later)

**SYSTEM Section:**
- Settings

### Header
- Search bar (global search for locations/devices)
- Dark mode toggle
- User menu (logout)

---

## 7. DESIGN PRINCIPLES

### Layout
- Clean, minimal design with modern aesthetic
- Consistent spacing (6-unit grid)
- Card-based layout with subtle shadows
- Responsive grid system
- **Large, prominent weather icons/emojis**
- **Visual data representation** (charts, graphs, maps)

### Information Hierarchy
1. **Most Important:** Current weather (large, prominent card)
2. **Visual Data:** Charts/graphs in middle (wind, precipitation, etc.)
3. **Forecast Data:** 7-day forecast with tomorrow highlighted
4. **Detailed Info:** Grids and lists at bottom

### Content Density
- Avoid clutter
- Use progressive disclosure
- Group related information
- Clear visual separation between sections
- **Large, readable numbers and text**
- **Colorful weather icons for visual interest**

### Interactive Elements
- **Time-based tabs:** "Today", "Tomorrow", "Next 7 days"
- **Action buttons:** "Forecast", "Air quality" (toggle states)
- **Conversational AI prompt:** "Hey, Need a Forecast? Ask me anything about the weather!"
- **Review/Rating system:** Interactive feedback elements
- **Download data buttons:** For charts and reports
- **Interactive maps:** Global weather visualization

### Visual Design
- **Weather icons:** Large, colorful, emoji-style or illustrated
- **Charts:** Vertical bar charts for precipitation, line graphs for trends
- **Maps:** 3D isometric or interactive world maps
- **Cards:** Rounded corners, subtle shadows, hover effects
- **Color coding:** Use colors to represent weather conditions
- **Typography:** Large numbers for temperatures, clear hierarchy

### Actions
- Primary actions: Prominent buttons with icons
- Secondary actions: Outline buttons
- Destructive actions: Red/destructive variant
- Quick actions: Icons with tooltips
- **Download actions:** For data export

---

## 8. FUTURE CONSIDERATIONS

### Potential New Tabs (Not Now)
- **Automations** - Create rules and schedules
- **Energy** - Detailed energy consumption tracking
- **Notifications** - Notification center
- **Integrations** - Third-party service connections

### Analytics Tab (Future)
- Energy consumption charts
- Device usage statistics
- Weather trends
- Cost analysis
- Historical data

---

## 9. IMPLEMENTATION PRIORITY

### Phase 1 (Current)
1. ✅ Dashboard - Summary cards and basic layout
2. ✅ Locations - List and detail views
3. ✅ Smart Home - Device management
4. ✅ Settings - Basic settings page

### Phase 2 (Next)
1. Dashboard - Chart implementation (wind, precipitation)
2. Location Detail - Enhanced forecast views with charts
3. Dashboard - Conversational AI prompt integration
4. Location Detail - Global map integration
5. Location Detail - Other cities comparison section
6. Smart Home - Room organization
7. Settings - Enhanced preferences
8. Search functionality
9. Download data functionality

### Phase 3 (Future)
1. Analytics tab
2. Automations
3. Advanced features

---

## Notes
- Keep each page focused on its primary purpose
- Avoid duplicating functionality across pages
- Use consistent patterns (cards, grids, dialogs)
- Maintain professional, clean aesthetic
- Ensure responsive design for all screen sizes

