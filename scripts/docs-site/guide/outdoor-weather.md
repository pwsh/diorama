# Outdoor, weather & geo

Diorama reaches past your walls: live weather with 3D effects, GPS pins that
show where people are relative to home, and outdoor features for the yard.

### Weather sources

Set up weather in the **Weather** settings. Pick one of three sources:

- **HA weather entity** — bind any `weather.` entity and Diorama reads its
  condition, temperature, wind, and forecast.
- **Local sensor station** — point Diorama at your own precipitation, wind,
  temperature, and lightning sensors, and it derives a condition from them.
- **Open-Meteo** — a free, keyless online forecast. Enter a ZIP code (or
  lat/lon) and Diorama geocodes it once and polls every 15 minutes.

The panel keeps working offline — the last reading holds and is marked stale
after a while.

### The weather chip

A small **weather chip** sits over both the 2D and 3D views, showing the current
glyph and temperature plus your place or entity name. It respects your
imperial/metric setting, dims when the reading is stale, and hides when no
source is set. In edit mode, clicking it jumps to the Weather settings.

In the Weather settings' **Chip appearance** block you can:

- **Reposition** it to any of six anchors (the corners plus top-and
  bottom-center), or nudge it with custom pixel offsets.
- **Add content rows** — feels-like temperature, humidity, and wind.
- **Show forecast strips** — a horizontal hourly strip and a vertical daily
  list (with a hi/lo per day), reading from your source's forecast. Set how many
  entries each shows.

With any of these on, the compact pill grows into a small panel.

### Weather alerts

Diorama can surface government/agency weather **warnings** (tornado warning,
flood watch, heat advisory, and the like) — distinct from the everyday
condition. In the Weather settings' **Alerts** block, pick a Home Assistant
alert entity (Diorama understands the common NWS, Environment Canada, DWD, and
MeteoAlarm shapes and sorts them into advisory / watch / warning).

- The weather chip grows a severity-tinted **⚠ badge**; clicking it opens a
  panel listing each alert with its event, headline, and expiry.
- A subtle **3D beacon** — a low colored light that gently pulses over the floor
  (faster and brighter for a warning, slower for an advisory) — washes the scene
  when an alert is active. Toggle it with the beacon checkbox.

### 3D weather effects

When effects are on, current conditions play out in the 3D scene:

- **Precipitation** — rain, snow, hail, and mixes fall across the floor, drifting
  with the wind.
- **Fog** — thickens the air and rolls translucent ground layers, scaled to real
  visibility.
- **Lightning** — flashes the scene during storms (no audio).
- **Wind** — drives the precipitation drift, with gust bursts, and can raise
  drifting dust on windy-but-dry days.
- **Clouds** — cloud-shadow patches drift across the ground, scaled to cloud
  cover.
- **Sun position** — the sun light follows your `sun.sun` entity's real azimuth
  and elevation.
- **Frost** — icicles and a rim appear when it's cold enough.
- **Puddles** — rain leaves puddles that linger for several minutes after it
  stops.

You can toggle each effect individually under the 3D effects controls, and there
is a master effects switch. Overcast, rainy, foggy, and stormy weather also
gently **dims** a daytime scene toward dusk (you can turn that off).

### Sky backdrop

Turn on the **Sky backdrop** (Display settings — on by default when a weather
source is set) to replace the flat background with a living sky:

- A **gradient sky dome** colored by the time of day, condition, and cloud
  cover, darkening its upwind horizon when a storm is brewing.
- A **sun disc** that follows your `sun.sun` entity's real position, and a
  night **starfield**.
- A **moon** with correct phases — bind a moon-phase `sensor.` (from Home
  Assistant's core Moon integration) in the Weather settings and the drawn moon
  matches tonight's phase; unbound, it shows a full moon.

### Background text

For a playful touch, write a short message into the world itself with
**Settings ▸ Display ▸ Background text**. Pick a mode and either type a static
message or bind an entity to display its live value:

- **Skywriting** — glowing cloud letters drifting high in the sky with the wind.
- **Banner plane** — a little toy plane towing a readable banner on a slow
  orbit.
- **Grass writing** — mowed-in lettering on the widest open patch of yard.

Skywriting and the banner hide during heavy storms (they'd read wrong in a
downpour); grass writing always shows.

### Geo landmarks & calibration

To place GPS positions on your plan, Diorama needs to know how your plan lines up
with the real world. You teach it by calibrating **landmarks** in the
**GPS / Geo** section (edit mode).

1. **Add a landmark** and click on the plan to drop it at a known spot (a corner
   of the house, a mailbox).
2. **Calibrate** it either by **GPS sampling** — pick a `device_tracker`, press
   Start, and physically stand at the landmark while Diorama collects fixes
   (it asks the companion app for high-accuracy updates) — or by **manual entry**
   of a `lat, lon` pair.

Landmarks are shared across all floors, not per floor.

- With **one** calibrated landmark, set the **north** direction (compass bearing
  of the plan's up direction) so orientation is known.
- With **two or more**, Diorama fits both position and rotation automatically and
  shows a **fit quality** readout (RMS error and a warning if a landmark looks
  off).

### GPS device pins

Once at least one landmark is calibrated, bind a person to an HA person or
device_tracker to pin them on the plan. Each pin is classified against the
current floor:

- **Indoor** — the fix lands inside the house. GPS is tens of meters off
  indoors, so the pin is drawn dimmed as a rough "find my phone" hint.
- **Yard** — within the boundary around the house (default 30 m). Drawn at its
  true position with an accuracy ring.
- **Beyond** — outside the boundary. Clamped to the boundary edge along the true
  bearing, labeled with the distance and compass direction (for example,
  "Name · 320 m NE").

Pins show the person's color and initials, dim when stale, and render in kiosk
and view modes too. In 3D they appear as floating labels; landmarks show as 📍
pins near the ground.

### Geo event pins

If you have `geo_location` entities (like severe-weather or nearby-quake feeds),
Diorama can plot them as warning diamonds around your home once geo is
calibrated, labeled with magnitude, distance, and direction. Toggle them with
the "Show events" option in the GPS / Geo section.

### Yard features

- **Ground coverings** — the Ground tool paints polygon areas of grass, rock,
  concrete, blacktop, mulch, sand, or water onto the ground plane, each with a
  toon texture. Hide the ground layer to click through a large painted area.
- **Outdoor furniture** — the furniture catalog includes an outdoor category:
  trees, pines, bushes, flower beds, a bird bath, a fountain, a swing set, lawn
  chairs (which figures actually sit in), a picnic table, and curbside trash and
  recycle bins.
- **3D grid** — the ground grid shows behind the scene when there's no
  background image; toggle it with the "3D grid" layer.
