# The 2D editor

The 2D editor is where you build your home: draw walls, place rooms, drop in
furniture and devices, and lay everything out to match your real floor plan.
Switch to it any time with the **2D** view toggle in the topbar. The left
sidebar holds every tool and a section for each kind of thing you've placed.

Everything you build here is shared through Home Assistant, so every browser
and tablet sees the same home.

### Floors

Use the **Floors** section in the sidebar to manage the levels of your home.

- **Add** a floor to build a multi-story home. Each floor has its own walls,
  rooms, furniture, and devices.
- **Reorder** floors with the ▲ / ▼ buttons. The order you set here is the
  order used everywhere — the sidebar list, the kiosk floor picker, and the
  stacking of glass-house ghost floors.
- **Switch** floors by clicking a row. The view resets so the new floor is
  framed on screen.
- **Disable** a floor with the 👁 / 🚫 toggle. A disabled floor stays fully
  editable but drops out of the live experience — handy for keeping test
  iterations of a plan side by side. Disabled rows dim and show a
  "(disabled)" hint.

#### Resizing the floor boundary

The floor is a rectangle you can resize by dragging its edges. In Select mode,
hover within a few pixels of any of the four edges — a resize cursor appears,
and mid-edge square handles are always drawn so the affordance is easy to find.

- Dragging the **right** or **top** edge only grows or shrinks the floor.
- Dragging the **left** or **bottom** edge resizes *and* slides all your
  content so the plan stays glued to the opposite edge.

Sizes snap to the grid, and shrinking stops before it would strand any wall or
item off the edge (minimum 2 m). Locked items move too, because a boundary edit
is a change of frame, not a move of individual pieces.

### Tools

Pick a tool from the sidebar, then click (or tap) on the canvas to place. The
main tools:

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
| Void | Mark "no floor here" cutouts |
| Presence zone | Draw a polygon bound to a presence sensor |

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
- **Invisible** — draws as a faint dashed line in 2D and nothing in 3D. Use it
  to close off a floor region (so the 3D floor fills it) without a visible
  wall.

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

- **Window kinds**: single, double-hung, casement pair, sliding, and picture —
  set the kind plus sill and height in the Windows editor.
- **Door kinds**: standard swing or garage (five roll-up slats). Bind a lock
  entity to show a padlock state, or a doorbell entity to show ring pulses.

### Rooms & naming

Add a room from the **Rooms** section, then click on the canvas to drop its
anchor inside an enclosed wall loop. The room's name is tied to whichever
closed loop contains its anchor, so it survives wall edits. Rooms start
unnamed (shown as a dim "Unnamed room") until you type a name in the sidebar;
an anchor that isn't inside any wall loop shows an amber "not enclosed by
walls" marker.

Room names feed the avatar behavior system, so naming matters:

- A room whose name contains **kitchen** (any capitalization) unlocks the
  snack and coffee thought bubbles for people standing in it.
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

### Layers & presets

The **2D Layers** section turns groups of things on and off — background,
furniture, appliances, labels, lights, switches, sensors, motion, env, zones,
avatars, geo, battery badges, and more. Walls, doors, and windows always draw.

- The **activity** layer (off by default) adds warm glow pools where lights are
  on or motion is firing.
- Save your own layer combinations as presets. A built-in **Simple floorplan**
  preset shows just avatars and activity glow for a clean kiosk look.

Layers also drive the 3D scene, and they can be set from a kiosk URL.

### Pan, zoom & touch gestures

- **Zoom** with the mouse wheel (anchored at the cursor).
- **Pan** with the middle or right mouse button, or hold Space and drag.
- On a **touch screen**, one finger places or drags, and two fingers pinch to
  zoom and pan. An intentional edge-swipe from the left still opens the HA
  sidebar.
- Reset the view with **Ctrl/Cmd+0** or the **⟳ Reset view** button in the
  bottom-left corner. The view also resets when you switch floors.

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
