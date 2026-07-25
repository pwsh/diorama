# The 2D editor

The 2D editor is where you build your home: draw walls, place rooms, drop in
furniture and devices, and lay everything out to match your real floor plan.
Switch to it any time with the **2D** view toggle in the topbar. The left
sidebar holds every tool and a section for each kind of thing you've placed.

Everything you build here is shared through Home Assistant, so every browser
and tablet sees the same home.

### Floors

Use the **Floors** section in the sidebar to manage the levels of your home.

- **Add** a floor to build a multi-story home. Each floor has its own walls, rooms, furniture, and devices.
- **Reorder** floors with the ▲ / ▼ buttons. The list reads like an elevator panel — **the highest story is at the top** — and the order you set is used everywhere: the kiosk floor picker, cross-floor stair links, and the stacking of glass-house ghost floors.
- **Switch** floors by clicking a row. The view resets so the new floor is framed on screen.
- **Yard fill** and the "this floor only" look overrides (floor color, texture, wall color) also live here, per floor.

#### Show, peek & hide

![A floor plan with the story above traced over it as a faint dashed onion-skin underlay](img/floor-peek.png)

Each floor row has a three-state visibility button you click to cycle:

| State | Button | What it means |
|---|---|---|
| **Show** | 👁 | Normal. |
| **Peek** | a peeking-monkey glyph | The floor is fully live, and while you're editing *another* floor its walls trace over your plan as a faint dashed **onion-skin underlay** — so you can line a bathroom up with the one below it. |
| **Hide** | 🙈 | The floor stays fully editable but drops out of the live experience — it disappears from the kiosk floor picker, ghost-floor stacking, and cross-floor tracking. Handy for keeping test iterations of a plan side by side. Hidden rows dim and show a hint. |

Peek shows structure only (walls, no furniture) and works in every mode. In 3D,
glass-house mode already shows the other floors, so peek is a 2D feature.

#### Rotating & moving the whole plan

Two rows in the Floors section move everything on the current floor at once —
each click is a single undo step.

- **Rotate plan (set a new top)** — ↺ 15° · ↺ 1° · ↻ 1° · ↻ 15° buttons spin the entire floor's contents about its center, so you can re-orient a plan you drew sideways. Walls, rooms, furniture, fixtures, zones, ground areas, paths, and the background image all turn together, and the compass keeps pointing at true north. The floor rectangle only ever grows to fit.
- **Move plan** — ↑ ↓ ← → nudges slide all the content without changing the floor size. Pick the step (10 mm, 100 mm, 500 mm, or 1 m) from the dropdown; it's remembered on this device.

Locked items rotate and move too — this is a change of frame, not a move of
individual pieces.

#### Resizing the floor boundary

The floor is a rectangle you can resize by dragging its edges. In Select mode,
hover within a few pixels of any of the four edges — a resize cursor appears,
and mid-edge square handles are always drawn so the affordance is easy to find.

- Dragging the **right** or **top** edge only grows or shrinks the floor.
- Dragging the **left** or **bottom** edge resizes *and* slides all your content so the plan stays glued to the opposite edge.

Sizes snap to the grid, and shrinking stops before it would strand any wall or
item off the edge (minimum 2 m). Locked items move too, because a boundary edit
is a change of frame, not a move of individual pieces.

### The placement toolbar

![The bottom placement toolbar showing category tabs and 3D thumbnail cards](img/toolbar.png)

The quickest way to put something down is the **toolbar** docked along the
bottom of the editor. It's a visual catalog: pick a category tab, then click a
card to arm it and click on the plan to place.

- **Category tabs** — Furniture, Appliances, Bathroom, Theater, Outdoor, Vehicle, Lights, Controls & Sensors, Structure, Ground, and Custom.
- **Cards** show a **real 3D thumbnail** of the actual piece — the same renderer that draws your scene, so what you see is what you place. Sensors and control fixtures use clear glyph tiles.
- **Variant chips** appear under the cards where a kind has options: door and window types, wall kinds (including fences and hedges), light kinds, and ground coverings. Pick a chip and the next thing you drop uses it.
- The armed card keeps a highlight ring, and it follows along if you change tools from the sidebar instead.
- **Collapse** the dock with its toggle when you want the full canvas; the choice is remembered on this device.

The toolbar is edit-mode only, and it sits below the canvas rather than over it,
so it never covers your plan.

### Tools

Every tool is also in the sidebar. Pick one, then click (or tap) on the canvas
to place. The main tools:

| Tool | What it places |
|------|----------------|
| Select | Pick, move, rotate, resize, and delete items |
| Wall | Draw wall segments (click corners, double-click to finish) |
| Room | Drop a room anchor to name an enclosed space |
| Door / Window | Openings that snap onto the nearest wall |
| Furniture | Any furniture kind (chosen from the kind picker) |
| Light / Switch | Light fixtures and wall switches |
| mmWave | Positional radar sensors (LD2450) |
| Motion | Simple presence / motion sensors |
| Env | Environmental sensors (temperature, CO₂, and more) |
| BLE | Bluetooth proxy fixtures for indoor positioning |
| Camera | Camera fixtures with a field-of-view wedge |
| Robot | Robot vacuum / lawn mower docks |
| Safety | Smoke / CO detectors |
| Alarm | Alarm keypad wall plates |
| Ground | Paint outdoor ground coverings (grass, water, and more) |
| Path | Draw a walk or driveway along its centerline |
| Pool | Draw a pool or spa basin |
| Sprinkler | Irrigation heads with a spray arc |
| Flagpole | A yard flagpole with a flag library |
| Void | Mark "no floor here" cutouts |
| Presence zone | Draw a polygon bound to a presence sensor |
| Ruler | Measure between two points, walls, or pieces |
| Info card / Action | Value plaques and service buttons |
| Thermostat / Alarm / Calendar | Wall plates |
| Valve / Plug / Projector / Alert beacon | Further bindable fixtures |

The yard tools are covered in [Yard & terrain](yard-terrain.html); the bindable
fixtures in [Devices & bindings](devices.html).

A hint appears near the tools when a placement tool is active. Press the
matching hotkey or click **Select** to stop placing.

### Walls

New walls draw as connected segments — click each corner, then double-click or
press Enter to finish (Esc cancels). While drawing, angles snap to 15°
increments unless an endpoint welds to something first.

#### Wall kinds

Pick a kind from the picker that appears when the Wall tool is active, or
double-click a wall body in Select mode to cycle it:

- **Full** (2.7 m / 9 ft) — the default, full-height wall.
- **Half** (1.4 m) — a low divider.
- **Railing** (0.9 m / 3 ft) — posts, rails, and balusters in 3D.
- **Invisible** — draws as a faint dashed line in 2D and nothing in 3D. Use it to close off a floor region (so the 3D floor fills it) without a visible wall.

#### Welding

When you finish a wall or drag its endpoints, nearby endpoints automatically
weld together — corner-to-corner joins, T-junctions onto the middle of another
wall, or closing a room loop back onto itself. Locked walls can still be welded
*onto* (so a room divider can attach to a structural wall), they just can't be
dragged themselves.

#### Doors, windows & openings

Doors and windows snap onto the nearest wall when you drop them and again when
you move them. They cut a real opening: in 3D the wall builds around the gap,
and open doors swing, windows tilt or slide, and garage doors roll up.

- **Window kinds**: single, double-hung, casement pair, sliding, and picture — set the kind plus sill and height in the Windows editor. Windows also take **curtains**; see [The 3D view](3d-view.html).
- **Door kinds**: standard swing, garage (five roll-up slats), or gate (for fences and hedges). Bind a lock entity to show a padlock state, or a doorbell entity to show ring pulses.

### Measuring: rulers & dimensions

![A floor plan annotated with a ruler between two walls and CAD-style wall dimension lines](img/rulers-dimensions.png)

Both features draw on the **Dimensions** 2D layer, so you can hide all the
measurement clutter at once.

#### The ruler tool

The **Ruler (📏)** tool measures a distance in two clicks. The tool stays armed
so you can lay down several in a row (Esc stops).

What each end snaps to depends on what you click:

- **A wall** — the ruler anchors to that wall and reports the **clear inside dimension** between the two wall faces, not their centerlines. Move either wall and the measurement updates itself.
- **A piece of furniture** — anchors to the piece and reports the gap between the two footprints (zero if they overlap), so you can check that a walkway stays wide enough as you shuffle things around.
- **Empty floor** — a plain grid-snapped point you can drag by its handle afterwards.

Select a ruler to see it in the **Rulers** sidebar section: the live distance, a
length input (type an exact millimeter length and the free end moves along the
current bearing), lock, and delete. A ruler whose anchor has been deleted turns
red with a "?" rather than disappearing.

#### Wall & structure dimensions

The **Dimensions** sidebar section adds proper CAD-style dimension lines to your
walls. Pick a **Show** mode:

| Mode | What's dimensioned |
|---|---|
| **Off** | Nothing (the default). |
| **All walls** | Every wall segment, plus overall structure width and depth. |
| **Outside only** | Just the exterior walls, plus overall extents. |
| **Custom selection** | Only the walls you pick. |

In custom mode, click **Pick walls** and then click walls on the plan to toggle
them in and out of the set (Esc stops picking); the section shows how many are
selected. Very short segments are skipped, and labels always read right-way-up.

### Rooms & naming

Add a room from the **Rooms** section, then click on the canvas to drop its
anchor inside an enclosed wall loop. The room's name is tied to whichever
closed loop contains its anchor, so it survives wall edits. Rooms start
unnamed (shown as a dim "Unnamed room") until you type a name in the sidebar;
an anchor that isn't inside any wall loop shows an amber "not enclosed by
walls" marker.

Room names feed the avatar behavior system, so naming matters:

- A room whose name contains **kitchen** (any capitalization) unlocks the snack and coffee thought bubbles for people standing in it.
- A seated person's room decides which TV they can watch.

### Furniture & custom objects

The Furniture tool drops whichever kind is selected in the kind picker, which
is grouped into categories — seating, tables and casework, appliances,
bathroom fixtures, outdoor pieces, and more. Each piece has sensible default
dimensions you can adjust per item (width, depth, label, and — for appliances
and TVs — a bound entity).

Sittable pieces (chairs, sofas, beds, and the like) become seating anchors that
avatars actually use; appliances and desks become activity anchors.

#### Custom objects (recipes)

Build your own objects in the **Custom Objects** section. It's a form editor:
give the object a label and size, mark it as a surface or mountable, choose an
activity and seat height, and assemble a parts list of simple shapes (boxes,
cylinders, spheres, cones) positioned in local millimeters. A new object is
placed at the view center so the live scene is your preview. Once defined, a
custom object shows up as a furniture kind you can drop like any other.

### Locking

Every placeable — walls, sensors, furniture, lights, doors, windows, and the
rest — has a 🔒 lock toggle in its sidebar row. A locked item can't be moved,
rotated, resized, or deleted on the canvas, but you can still edit it from the
sidebar and still click it to toggle its device. Walls also have a bulk
lock / unlock button in the tools area.

### Undo, redo & delete

Editing is fully undoable.

- **Undo / redo** — use the ↶ / ↷ buttons in the topbar, or press **Ctrl/Cmd + Z** to undo and **Ctrl/Cmd + Shift + Z** (or **Ctrl/Cmd + Y**) to redo. A whole drag counts as a single step. History is per-session and isn't saved with the plan.
- **Delete** — press **Delete** or **Backspace** to remove the current selection: a selected item, or a single **polygon vertex** (of a presence zone, ground area, void, or wall) when one is selected. Deleting a wall vertex removes the whole wall if only two points remain; a polygon refuses to drop below three points. Locked items won't delete.

Undo, redo, and delete are edit-mode features, and the hotkeys stay out of your
way while you're typing in a text field.

### Layers & presets

The **2D Layers** section turns groups of things on and off — background,
furniture, appliances, labels, lights, switches, sensors, motion, env, info
cards, zones, avatars, name labels, geo, battery badges, ground, dimensions,
neighborhood, flights, and more. Walls, doors, and windows always draw.

- The **activity** layer (off by default) adds warm glow pools where lights are on or motion is firing.
- A few layers ship **off** by default — the **temperature heat-map** and the **vacuum room map** — so turn them on when you want them.
- Save your own layer combinations as presets. A built-in **Simple floorplan** preset shows just avatars and activity glow for a clean kiosk look.

Layers also drive the 3D scene, and they can be set from a kiosk URL.

The small floor readout in the bottom-right corner (floor name, sensor and wall
counts, and the floor's size) can be switched off with **"Show floor info readout"** in Settings ▸ Display.

### Pan, zoom & touch gestures

- **Zoom** with the mouse wheel (anchored at the cursor).
- **Pan** with the middle or right mouse button, or hold Space and drag.
- On a **touch screen**, one finger places or drags, and two fingers pinch to zoom and pan. An intentional edge-swipe from the left still opens the HA sidebar.
- Reset the view with **Ctrl/Cmd+0** or the **⟳ Reset view** button in the bottom-left corner. The view also resets when you switch floors.

### Alignment guides

While you drag a single item in Select mode, its center snaps to line up with
other items of the same category on the X and Y axes independently. Dashed
guide lines show through the aligned coordinate so you can see the match. This
works for lights and switches (as one group), furniture, environmental
sensors, motion sensors, mmWave sensors, and BLE proxies.

### Background images

The **Background** section lets you load a reference image (a scanned blueprint
or a screenshot of an existing plan) to trace over. Loading an image
automatically re-enables the background layer; if the layer is off, the section
shows an amber reminder. Very large images are downscaled automatically before
they're stored, and blank SVGs are sized to the floor.
