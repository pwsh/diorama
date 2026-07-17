# Devices & bindings

Diorama's real power is binding the things you place to your Home Assistant
entities, so the model shows live state and lets you control anything with a
click.

### How binding works

Most fixtures have a **Bind** button in their sidebar editor that opens the
entity picker. The picker pulls your HA devices and entities, defaults to the
right domain for the fixture (lights for a light, `binary_sensor` for motion,
and so on), and lets you filter by domain or device or search by name. Each row
shows its parent device as a subtitle.

- **Toggle dispatch** — clicking a bound fixture calls the toggle service that
  matches the *entity's* domain. So a "switch" fixture bound to a `light.`
  entity calls the light toggle (and offers the color/brightness modal), not a
  switch toggle.
- **Local state for unbound items** — doors, windows, lights, switches, TVs,
  and appliances can be controlled even with **no** entity bound. Clicking one
  flips a local on/off (or playing) state so you can mock up a scene. The
  sidebar shows a dim `local: on/off` badge you can also click. Binding an
  entity later takes over; unbinding returns to the last local state.
- **Kiosk & view modes** — local toggles in kiosk mode are session-only (never
  written back), and view-only mode makes no changes at all.

### mmWave radar sensors

mmWave sensors (HLK-LD2450) are Diorama's first-class presence tech. Place one
with the mmWave tool, then bind it to your sensor's device — Diorama discovers
the LD2450 entities by their naming convention automatically, so zones and
tracked objects load without extra clicks.

- **Targets** — each sensor tracks up to three moving targets, drawn as dots in
  2D and animated figures in 3D, tinted with the sensor's color.
- **Zones & objects** — the sensor's inclusion zones and tracked objects show
  in place; zones glow when someone's inside. You can edit zones directly on the
  canvas.
- **Coverage** — the **Cov** topbar toggle draws each sensor's field-of-view
  wedge (from its range, field of view, and heading) in both 2D and 3D.
- **Pose** — sensor height and mount angle come from the HA number entities, so
  the 3D body tilts and aims the way the real sensor does.

Give each sensor a **color** to tell its targets apart, and optionally a
plumbob color override.

### Motion sensors & AI avatars

Simple presence / motion sensors place with the Motion tool and bind to a
`binary_sensor`. Set a color and intensity to control how they draw.

Because a plain motion sensor only knows "someone is in this room," you can give
it an **AI avatar**: when its entity is on, a synthetic figure wanders the
sensor's own room, sitting and doing activities, confined to the room's walls.

- **Demo avatar** — check "Demo avatar" to show an always-on figure with no
  binding at all, for a lively display. Demo figures render in kiosk and view
  modes too.
- Each fresh figure re-rolls its look from the sensor's avatar pool, so a
  respawn looks different.

### Environmental sensors

The Env tool binds any `sensor.` entity and shows its live reading. The kind
(temperature, humidity, CO₂, CO, particulates, VOC, pressure, illuminance,
radon, sound, and more) is auto-detected from the entity's device class and can
be overridden. Kinds with health thresholds (like CO₂ and CO) escalate their
color to amber or red as the reading climbs. Drag the handle on a selected chip,
or use the Size slider, to scale it.

### Lights

Place lights with the Light tool. Each fixture has a per-fixture **icon kind**,
plus adjustable height, floor-pool radius, and intensity:

- **Bulb** (default ceiling sphere), **spot**, **pendant**, **sconce** (lights
  the wall, no floor pool), **strip**, **lamp** (floor lamp).
- **Fireplace** — an open firebox with a mantel and animated, flickering
  flames. It forces a warm glow regardless of the bound color, and snaps flush
  to the nearest wall.
- **Floodlight** — a mount plate with twin angled heads and a wide pool; snaps
  flush to a wall.

Double-clicking a light bound to a `light.` entity opens the **light config**
modal for color, brightness, and color temperature.

### Switches

Switches place with the Switch tool and snap flush to the nearest wall on drop
or move. Set the mounting height and rotation. When you drop a switch near
others already on the same wall segment, it **gangs** with them — aligning to
their offset and rotation and taking the next free slot along the wall, like a
real multi-gang plate.

### Appliances

Appliance-category furniture (fridge, stove, dishwasher, washer, dryer,
microwave, TV) can be bound to an entity. A bound appliance that's on or
playing shows a pulsing green indicator and a soft glow.

- **Doors** — appliance doors open and close: a fridge with a bound door sensor
  swings open when the door is open, and unbound appliance doors ease open when
  a figure comes over to use them or when you click to toggle the appliance.
- **Oven / fridge temperature** — bind a temperature entity to a stove or
  fridge to show a live temperature chip and 3D readout.
- **Power glow** — bind a power sensor to make the in-use glow scale with the
  wattage; an unbound appliance drawing more than a few watts reads as in-use.

### Media & now-playing

Any furniture bound to a `media_player.` entity shows a now-playing card above
it while it's playing (title, artist, and album art when available) plus a
`♪` line in 2D. Paused players dim.

### Covers: garage doors & blinds

`doorOpenFraction` drives openings proportionally, so a cover that's 40% open
draws 40% open.

- **Garage doors** — set a door's kind to garage for a five-slat roll-up in a
  tall opening. Bind a cover entity; the door lifts and folds onto a ceiling
  track as it opens.
- **Window blinds** — bind a cover entity to a window for a roller shade that
  descends from the header.

### Door locks & doorbells

- **Locks** — bind a `lock.` entity to a door to show a padlock glyph (red
  locked, green unlocked) in 2D and a deadbolt in 3D. Deadbolt boxes on the door
  faces are clickable to lock/unlock a bound lock, or flip a local state on an
  unbound door.
- **Doorbells** — bind an event, `binary_sensor`, button, or `input_button`
  entity to a door. A press pulses expanding rings and a 🔔 in both views, and
  can trigger a thought bubble for nearby figures.

### Alarm panels

The Alarm tool places a wall-plate keypad bound to an
`alarm_control_panel.` entity. The screen band is color-coded to the alarm
state (amber while arming or pending, red when triggered). Clicking the panel
opens a keypad modal: with "Allow arm/disarm" checked it offers Disarm, Arm
Home, and Arm Away (with an optional code); otherwise it's read-only status.

### Cameras & alerts

The Camera tool places a camera fixture with a translucent field-of-view wedge,
tinted red while recording. The sidebar row shows a live snapshot with a refresh
button. Bind an **alert** binary_sensor to pop a snapshot card beside the camera
(in both views and every mode) with a pulsing FOV wedge when the alert fires.

### Robots: vacuum & mower

The Robot tool places a **dock**; the robot moves out from it.

- **Vacuum** — bind a `vacuum.` entity. Roborock users can also bind the map
  entity plus calibration to show the robot's **live position**, with a
  one-click "Set dock as reference" to line it up. Without a live position it
  roams a simulated pattern.
- **Mower** — bind a `lawn_mower.` entity, optionally with a GPS tracker (or a
  lat/lon sensor pair) to follow the mower's real position in the yard.

Clicking a robot starts or returns it (for a bound robot) or flips its
run/return state (unbound). LED colors show its state: green while working,
blue returning, amber docked, red on error.

### Smoke / CO, gas & leak detectors

The Safety tool places ceiling detectors — **smoke** (red) or **CO** (amber) —
bound to a `binary_sensor` ('on' = alarm). An alarming detector pulses expanding
rings. Related safety kinds include **gas** (a ceiling beacon) and **leak** (a
floor puck whose alarm grows a spreading blue puddle). Unbound detectors have a
Test button to trigger the alarm manually.

### Battery badges

Diorama finds the battery sensor that belongs to each device and draws a small
🔋 badge on mmWave, motion, env, BLE, alarm, safety, robot, and locked-door
fixtures when the battery drops to 20% or below. The sidebar rows show the
percentage. Toggle these with the **battery** layer.

### Room occupancy

Bind a `binary_sensor` (a Frigate zone, an FP2 occupancy sensor, or any
occupancy entity) to a room to fill it with a soft warm glow when occupied,
under the activity layer. The Rooms sidebar rows show an occupied dot.
