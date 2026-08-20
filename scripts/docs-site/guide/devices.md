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

- **Toggle dispatch** — clicking a bound fixture calls the toggle service that matches the *entity's* domain. So a "switch" fixture bound to a `light.` entity calls the light toggle (and offers the color/brightness modal), not a switch toggle.
- **Area filtering** — when you've bound a room to a Home Assistant area (see [The 2D editor](editor.html)), the picker for that room's occupancy sensor, or for an environmental sensor or thermostat standing in it, opens **already narrowed to that area**. A chip at the top of the list shows the filter; click it to drop the filter and see everything, or to put it back.
- **Local state for unbound items** — doors, windows, lights, switches, TVs, and appliances can be controlled even with **no** entity bound. Clicking one flips a local on/off (or playing) state so you can mock up a scene. The sidebar shows a dim `local: on/off` badge you can also click. Binding an entity later takes over; unbinding returns to the last local state.
- **Kiosk & view modes** — local toggles in kiosk mode are session-only (never written back), and view-only mode makes no changes at all.

### mmWave radar sensors

mmWave sensors (HLK-LD2450) are Diorama's first-class presence tech. Place one
with the mmWave tool, then bind it to your sensor's device — Diorama discovers
the LD2450 entities by their naming convention automatically, so zones and
tracked objects load without extra clicks.

- **Targets** — each sensor tracks up to three moving targets, drawn as dots in 2D and animated figures in 3D, tinted with the sensor's color.
- **Zones & objects** — the sensor's inclusion zones and tracked objects show in place; zones glow when someone's inside. You can edit zones directly on the canvas.
- **Coverage** — the **Cov** topbar toggle draws each sensor's field-of-view wedge (from its range, field of view, and heading) in both 2D and 3D.
- **Pose** — sensor height and mount angle come from the HA number entities, so the 3D body tilts and aims the way the real sensor does.
- **Tuning** — for zone drawing on the sensor's own canvas, every setting the device exposes, live diagnostics, and the presence heat-map, see [mmWave tuning & presence](mmwave.html).
- **Demo avatar** — check "Demo avatar" for an always-on figure that lives in the sensor's room, with or without a binding. It's the same display presence motion sensors offer (below), drawn from this sensor's own avatar pool, and it's happy to share: a bound sensor shows its real radar targets *and* the demo figure.

Give each sensor a **color** to tell its targets apart, and optionally a
plumbob color override.

### Motion sensors & AI avatars

Simple presence / motion sensors place with the Motion tool and bind to a
`binary_sensor`. Set a color and intensity to control how they draw.

Because a plain motion sensor only knows "someone is in this room," you can give
it an **AI avatar**: when its entity is on, a synthetic figure wanders the
sensor's own room, sitting and doing activities, confined to the room's walls.

- **Demo avatar** — check "Demo avatar" to show an always-on figure with no binding at all, for a lively display. Demo figures render in kiosk and view modes too. mmWave sensors have the same checkbox (above).
- Each fresh figure re-rolls its look from the sensor's avatar pool, so a respawn looks different.

Synthetic figures — AI avatars, demo avatars, and roamers — live in the **3D
view only**. The 2D plan draws real detections (radar, Bluetooth, camera), so a
demo figure walking a room in 3D shows no dot on the plan. That's deliberate,
not a missing marker.

### Environmental sensors

The Env tool binds any `sensor.` entity and shows its live reading. The kind
(temperature, humidity, CO₂, CO, particulates, VOC, pressure, illuminance,
radon, sound, and more) is auto-detected from the entity's device class and can
be overridden. Kinds with health thresholds (like CO₂ and CO) escalate their
color to amber or red as the reading climbs. Drag the handle on a selected chip,
or use the Size slider, to scale it.

### Solar panels

The Solar tool plants a motorized panel in the yard that **aims itself at the
sun**. It reads the same sun your 3D scene lighting does — your `sun.sun`
entity, the [hand-authored demo sun](outdoor-weather.html), or a local-clock
fallback if neither is available — so the panel and the shadows on the ground
always agree. It turns to the sun's bearing and tilts to face it directly; once
the sun sets it parks flat until morning.

- **Rotation** sets the pedestal's base bearing; the tracking turns from there.
- **Bind a power sensor** (watts) and the panel grows an energy bead that brightens with output, and a wattage chip on the plan. A **negative** reading — drawing from the grid rather than generating — turns both amber.
- The frame is tinted by the current **UV index** when your weather source reports one, using the same bands as the weather chip's UV row.
- Panels stand on the ground, following your yard's grade and terraces, and ride the **sensors** layer. They're display-only — there's nothing to click.

The sidebar shows the aimed bearing and tilt live, so you can tell at a glance
whether it's tracking a real sun or a clock guess.

### Lights

Place lights with the Light tool. Each fixture has a per-fixture **icon kind**,
plus adjustable height, floor-pool radius, and intensity:

- **Ceiling & hanging** — bulb (the default sphere), spot, recessed, pendant, bowl, tiered, round, jar, and oval.
- **Wall & accent** — sconce and wall sconce (they light the wall, so no floor pool), strip, under-cabinet, LED string, and step light.
- **Lamp** — a floor lamp with a pole, base, and shade.
- **Ceiling fan** and **fan + light** — a real spinning rotor. Bind a `fan.` entity (or let it fall back to the light's own entity) and the blades spin at the fan's actual percentage, reverse when the entity says reverse, and ramp up and down smoothly rather than snapping.
- **Fireplace** — an open firebox with a mantel and animated, flickering flames. It forces a warm glow regardless of the bound color, and snaps flush to the nearest wall.
- **Fire pit (round)** and **fire pit (square)** — outdoor fire features on the same idea, but for the yard. A ring of stones (or a squared-off rim) around an ash basin with crossed logs; lit, it grows swaying flames, an ember bed, and a warm pool of light on the ground around it. Unlit it's a cold, dark basin. They sit **on the ground** and follow your yard's grade and terraces, so a pit on a sunken patio burns at patio level — which also means they ignore the fixture Height setting. They don't snap to walls. Bind a `light.` or `switch.`, or just click one to light it.
- **Floodlight** — a mount plate with twin angled heads and a wide pool; snaps flush to a wall.
- **Heat lamp** and three **exhaust** kinds (ceiling, wall, and exhaust + light) — see climate appliances below.
- **In-ground uplight** and **ground spot** for landscape lighting; see [Yard & terrain](yard-terrain.html).

Double-clicking a light bound to a `light.` entity opens the **light config**
modal for color, brightness, and color temperature.

A light can also be driven by **logical state** instead of a `light.` binding —
its on/off, color, and flash come from any entity's value through a rule
editor. See [Logical-state lights](info-displays.html) for how to set that up.

### Switches

Switches place with the Switch tool and snap flush to the nearest wall on drop
or move. Set the mounting height and rotation. When you drop a switch near
others already on the same wall segment, it **gangs** with them — aligning to
their offset and rotation and taking the next free slot along the wall, like a
real multi-gang plate.

### Water valves & smart plugs

- **Water valve (🚰)** — a floor pipe run with a hand-wheel, placed freely with a rotation. Bind a `valve.` entity (open/closed with optional position), a `switch.` (the irrigation-zone pattern), or a `binary_sensor` (display-only). When open, blue flow dashes animate along the pipe in 2D and a pulsing flow segment shows in 3D; the wheel turns with the openness. Clicking picks the right open/close service for the current state (never a blind toggle). Turn "Allow open/close" off to make it display-only.
- **Smart plug (🔌)** — a wall outlet plate that snaps flush to a wall, bound to a `switch.` or `light.` (the outlet load). It energizes green when on; bind an optional power sensor to scale the glow and show a wattage chip. Clicking toggles it like a switch.

### Appliances

Appliance-category furniture (fridge, stove, dishwasher, washer, dryer,
microwave, TV) can be bound to an entity. A bound appliance that's on or
playing shows a pulsing green indicator and a soft glow.

- **Doors** — appliance doors open and close: a fridge with a bound door sensor swings open when the door is open, and unbound appliance doors ease open when a figure comes over to use them or when you click to toggle the appliance.
- **Oven / fridge temperature** — bind a temperature entity to a stove or fridge to show a live temperature chip and 3D readout.
- **Power glow** — bind a power sensor to make the in-use glow scale with the wattage; an unbound appliance drawing more than a few watts reads as in-use.

### Climate appliances: AC, fans & heaters

A family of furniture kinds that show whether they're actually running. Bind a
`climate.`, `fan.`, or `switch.` entity — a `climate.` unit in cool or heat mode
counts as running even though its state isn't "on" — and each piece animates
accordingly. Unbound, click one to flip it on and off locally.

- **Air conditioning** — a **window AC**, a wall-mounted **mini-split** (its louver bar swings open while running), and a **portable AC** with an exhaust hose. Each puffs airflow tinted for heating or cooling.
- **Floor fans** — a caged **floor fan**, a brass **retro fan** (sits on a table), a bladed **modern fan**, a slotted **tower fan**, and a **bladeless fan** with a pulsing air ring. Bladed fans spin at the bound fan entity's percentage and honor its direction. Check **Oscillate** on a bladed fan and the head sweeps side to side while it runs.
- **Heaters** — a **space heater** with a breathing ember coil, a **wall heater** with a rising heat shimmer, and a **towel warmer** whose bars glow up slowly and fade slower still.
- **Exhaust & heat lamps** are light kinds rather than furniture: a ceiling **heat lamp** with warm red domes, **exhaust (ceiling)** and **exhaust (wall)** vents whose blades spin and louvers open, and **exhaust + light**, where the bound light entity lights the globe and a bound fan entity spins the blades.

### Mechanical & utility equipment

The plant room, the basement, and the side of the house get their own appliance
kinds — the things that quietly run your home:

- **Water heater**, **boiler**, and **floor** / **wall radiators** — always glow warm when they're running, because that's the only thing they do.
- **Air handler** and **heat pump** — glow in the color of what they're currently doing: red for heat, blue for cool, white when they're just moving air.
- **AC condenser** — the outdoor unit, glowing cool with its top fan spinning while it runs.
- **Sump pump** and **recirculation pump** — water scrolls visibly through them while they're running, and freezes when they stop.
- **3D printer** — the gantry head sweeps back and forth and the print grows on the bed. Bind a progress sensor and the print height follows the real job; without one it loops through a print for effect.

Bind each to whatever your setup exposes — a `climate.` or `water_heater.`
entity, a `fan.`, a plain `switch.`, or a `binary_sensor` for something you can
only observe. A `climate.` unit sitting in heat or cool mode counts as running
even though its state isn't "on". Clicking one toggles it (or flips it locally
when nothing is bound).

For these kinds the **glow is the state readout** — they skip the generic green
in-use light, so you read them by color rather than by an indicator lamp.

### Sinks & running water

The five sink kinds — **sink**, **vanity sink**, **pedestal sink**, **kitchen sink** (double bowl), and **utility sink** — have open basins, faucets, and real
water. A running sink pours a stream and slowly fills its basin (about eight
seconds), then drains when it stops.

A sink runs when its bound `switch.` or `binary_sensor` says so, when you click
an unbound one to toggle it, **or** when a figure walks over and washes their
hands at it. In 2D the basin tints blue as it fills, with flow ticks at the
faucet.

### Vehicles, EV charging & mailbox

Three state-driven furniture kinds bring the driveway to life:

- **Garage car** — a car piece bound to a presence `binary_sensor`. When the bay is empty the car renders **ghosted** (translucent, dashed in 2D); present or unbound, it's solid. Bind EV charging status to it (or a nearby charger) to show a charge bolt with the state of charge.
- **EV charger** — a charging post with a state-colored port LED (charging, full, error, idle) resolved defensively from whatever your charger reports. Cars within range of a charging post show a green port glow.
- **Mailbox** — a classic curbside tunnel box on a wooden post: a rounded shell with an arched door, a latch tab, and a **U.S. MAIL** decal. The red flag on its side is the moving part — **up** stands vertical above the roofline, **down** rests along the flank — and it eases between the two rather than snapping. Bind a flag `binary_sensor` (the **Lid sensor** row) to drive it from a real sensor, or just **click the mailbox** in either view to flip it by hand. Bind a package-count sensor (**Mail count**) to float a small red **✉ count** badge above the box whenever there's mail waiting; anything over 99 shows as `99+`, and zero shows nothing. The door itself is decorative — it never opens.

Vehicle models — a pickup in the driveway, a fire engine at the curb — are a
separate library with its own packs; see [Vehicles & aircraft](vehicles.html).

### Media & now-playing

Any furniture bound to a `media_player.` entity shows a now-playing card above
it while it's playing (title, artist, and album art when available) plus a
`♪` line in 2D. Paused players dim. A TV can also show a **news ticker** or a
**weather card** on its screen — see [TV screen surfaces](info-displays.html).

### Home theater

The furniture catalog has a **theater** category for a proper setup:

- **Speakers** — tower, bookshelf, subwoofer, and center-channel cabinets. Bind one to a `media_player.` and its drivers pulse while it plays (the subwoofer breathes slower and deeper).
- **Recliners** — a single **theater recliner** and a **three-seat recliner row**, all real seats figures use; a seated figure watches a TV that's on in the room.
- **Riser platform** — a low carpeted deck figures can actually walk up onto. Place recliners on top for stadium seating.

### Projector & screen bias lighting

- **Projector (📽)** — the Projector tool places a ceiling or shelf projector. Bind a `media_player.`, `switch.`, or `light.` and pick a **screen** (a TV or wall-TV in the room) or aim it by rotation. While projecting, it casts a translucent light cone toward the screen with a soft glow on the surface, and a dashed throw wedge in 2D. Set the throw ratio and beam color.
- **Screen bias lighting** — check **Bias light** on a TV or wall-TV to add a soft halo behind the panel. Leave it on auto (glows while the TV plays) or bind a light/switch to drive it, and pick the halo color.

### Covers: garage doors & blinds

Openings move **proportionally** to the entity behind them, so a cover reporting
40% open draws 40% open — swing doors included.

- **Garage doors** — set a door's kind to garage for a five-slat roll-up in a tall opening. Bind a cover entity; the door lifts and folds onto a ceiling track as it opens.
- **Window blinds** — bind a cover entity to a window for a roller shade that descends from the header.
- **Sliding and patio doors** — the sliding, pocket, and sliding-glass kinds retract along the wall by the same fraction. All the door kinds are listed in [The 2D editor](editor.html).

### Door locks & doorbells

- **Locks** — bind a `lock.` entity to a door to show a padlock glyph (red locked, green unlocked, amber when jammed) in 2D and a deadbolt in 3D. Deadbolt boxes on the door faces are clickable to lock/unlock a bound lock, or flip a local state on an unbound door. Set **Lock control** to *display* to make the padlock a passive indicator you can't click — a look-but-don't-touch status readout.
- **Doorbells** — bind an event, `binary_sensor`, button, or `input_button` entity to a door. A press pulses expanding rings and a 🔔 in both views, and can trigger a thought bubble for nearby figures.

### Alarm panels

The Alarm tool places a wall-plate keypad bound to an
`alarm_control_panel.` entity. The screen band is color-coded to the alarm
state (amber while arming or pending, red when triggered). Clicking the panel
opens a keypad modal: with "Allow arm/disarm" checked it offers Disarm, Arm
Home, and Arm Away (with an optional code); otherwise it's read-only status.

### Thermostats (HVAC)

The **Thermostat (🌡)** tool places a wall plate bound to a `climate.` entity.
It snaps flush to a wall and shows a mode-colored screen band with the current
and target temperature; while the system is actively heating or cooling it
pulses and draws airflow arcs. In 3D a slatted vent below the plate glows and
puffs particles in the vent color — heat rises red, cool sinks blue, fan blows
straight out.

Clicking the plate opens a **thermostat modal**: current and target temperature
with +/− steppers (a single setpoint or a heat/cool range), HVAC-mode buttons,
and fan / preset dropdowns — all limited to what your entity actually supports.
Setpoint changes are optimistic and debounced before the service call. Turn off
**Allow control** for a read-only display; an unbound thermostat runs as a local
demo.

### Cameras & alerts

The Camera tool places a camera fixture with a translucent field-of-view wedge,
tinted red while recording. The sidebar row shows a live snapshot with a refresh
button. Bind an **alert** binary_sensor to pop a snapshot card beside the camera
(in both views and every mode) with a pulsing FOV wedge when the alert fires.

#### Frigate ground-truth targets

If you run **Frigate**, a camera can turn its detection boxes into real figures
walking your floor plan — perfect for yard, driveway, and porch areas no radar
or Bluetooth covers. This rides the **MQTT bridge** described at the bottom of
this page.

1. Set the camera's **Frigate name** to match Frigate's camera name.
2. **Calibrate** the view: click a spot on the camera snapshot, then click the matching spot on your plan, four or more times. Diorama solves the perspective mapping and shows a fit-quality readout. (Click points against the detection resolution Frigate reports, noted in the editor.)

Detected people become humanoid figures (dogs and cats become pets; cars draw
as a dot), tinted with the camera's color, and they can **fuse** with a BLE
identity so someone walking from the yard into the house keeps one name.

### Robots: vacuum & mower

The Robot tool places a **dock**; the robot moves out from it.

- **Vacuum** — bind a `vacuum.` entity. Roborock users can also bind the map entity plus calibration to show the robot's **live position**, with a one-click "Set dock as reference" to line it up. Without a live position it roams a simulated pattern.
- **Mower** — bind a `lawn_mower.` entity, optionally with a GPS tracker (or a lat/lon sensor pair) to follow the mower's real position in the yard.

Clicking a robot starts or returns it (for a bound robot) or flips its
run/return state (unbound). LED colors show its state: green while working,
blue returning, amber docked, red on error.

Docks and robots ride their own **Robots** 2D layer, so you can hide them
without losing your other sensors (a hidden robot isn't clickable either).

#### Aiming the dock

Set a **Rotation (°)** on the dock and it turns; at 0° the opening faces the
bottom of your plan. A chevron always marks the opening in 2D and a lit entry
strip marks it in 3D, so you can see which way the robot drives out. The mower
parks nose-first into its dock and eases onto that heading as it returns,
steering like a vehicle rather than spinning on the spot.

#### Lining the reported position up with your plan

When a robot reports its own position — a Roborock's map, a mower's GPS — that
position has to be mapped onto your floor plan, and it rarely lands perfectly
the first time. Three tools in the robot's sidebar row help:

- **Show position info** draws exactly what the robot is reporting: a crosshair at the reported point, a dashed line to where the robot is actually drawn if the two disagree, and a small readout of the raw value, the projected millimetres, and which mode it's in. Turn it on while you align, off afterwards. (2D only.)
- **Align position** nudges the mapping with ↑ ↓ ← → buttons at a step you choose (10 mm up to 1 m); a vacuum also gets ↺ / ↻ rotation nudges. Each click is one undo step, and **Reset** clears the lot.
- **Calibrate to dock** (mower, with GPS) does it in one click: park the mower on its dock, press the button, and Diorama solves the offset so the reported fix lands exactly on the dock you placed. It tells you in its tooltip if it can't yet — you need calibrated [geo landmarks](outdoor-weather.html) and a numeric fix first.

#### Valetudo room map & tap-to-clean

A vacuum running **Valetudo** can draw its own SLAM room segmentation as a
translucent, per-room overlay on your floor — a quick "does my plan match
reality" check. Set the vacuum's **Valetudo topic id** in its editor, and reuse
the same "Set dock as reference" calibration the live-position feature uses to
line the map up. The room being cleaned glows, and **tapping a room sends the vacuum there** (with a confirm). Turn it on with the **Vacuum room map** layer
(off by default). This rides the MQTT bridge below.

### The MQTT bridge

A couple of genuinely spatial data streams — **Frigate** detection boxes and
**Valetudo** room maps — aren't available over Home Assistant's normal
WebSocket API, so Diorama can read them over MQTT. Set this up once in
**Settings ▸ Integrations ▸ MQTT bridge**:

- **HA relay** — the simplest path. Diorama rides Home Assistant's own MQTT connection, so there are no extra credentials. It requires an **admin** Home Assistant user; if yours isn't admin, the status pill says so and suggests direct mode.
- **Direct broker** — connect straight to your MQTT broker. This needs the broker's **WebSocket listener** enabled (the Mosquitto add-on doesn't turn it on by default), uses `wss://` when the panel is served over HTTPS, and takes a host, port, and optional username / password. Those broker credentials are stored **only in this browser** (local storage), never synced to Home Assistant.

A live status pill and a **Test connection** button confirm the bridge is up.
Once it is, calibrated Frigate cameras and Valetudo vacuums start working.

### Smoke / CO, gas, leak & siren detectors

The Safety tool places ceiling detectors — **smoke** (red) or **CO** (amber) —
bound to a `binary_sensor` ('on' = alarm). An alarming detector pulses expanding
rings. Related safety kinds include **gas** (a ceiling beacon), **leak** (a
floor puck whose alarm grows a spreading blue puddle), and a **siren** (a blue
beacon with a spinning light-bar sweep and strobe, bound to a `siren.` or
`switch.`). Unbound detectors have a Test button to trigger the alarm manually.

For house-wide notifications and Repairs issues, and for a placeable
acknowledge-able **alert beacon**, see [Info displays & alerts](info-displays.html).

### Battery badges

Diorama finds the battery sensor that belongs to each device and draws a small
🔋 badge on mmWave, motion, env, BLE, alarm, safety, robot, and locked-door
fixtures when the battery drops to 20% or below. The sidebar rows show the
percentage. Toggle these with the **battery** layer.

### Presence zones

Some presence sensors report **areas**, not points — an Aqara FP2's zones, a
Frigate camera's zones, a bed or sofa occupancy sensor. Draw the shape those
report on with the **Presence zone (▱)** tool: click at least three corners,
then double-click or press Enter to finish (Esc cancels).

Bind the zone to a `binary_sensor` and it glows when the sensor is on — an
outline in 2D and a flat glowing patch in 3D. Unbound zones draw dashed. Select
a zone to drag its orange corner handles or press **Redraw**; clicking inside it
just selects it. Zones ride the **Zones & halos** layer, which is also the way to
stop a large zone from swallowing clicks meant for the fixtures on top of it.

### Room occupancy

Bind a `binary_sensor` (a Frigate zone, an FP2 occupancy sensor, or any
occupancy entity) to a room to fill it with a soft warm glow when occupied,
under the activity layer. The Rooms sidebar rows show an occupied dot.
