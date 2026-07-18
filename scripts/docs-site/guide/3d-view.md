# The 3D view

Switch to the **3D** view toggle in the topbar to see your home rendered as a
living doll's house. Devices show their real state in place, and the people
(and pets) your sensors detect walk through the rooms as animated figures.

### The Sims-2000 look

The 3D view is deliberately styled after early-2000s *Sims*: flat toon shading
with a cartoon feel rather than photorealism.

- **Cartoon outlines** trace furniture, doors, light fixtures, and figures.
- **Blob shadows** — soft round shadow patches — sit under furniture and every
  figure, following them as they move and sit.
- **Plumbobs** — spinning green octahedrons — float above each figure's head,
  colored to match the source they came from.

### Camera views & presets

The overlay buttons along the top of the 3D view frame the scene from preset
angles: **iso** (a 3/4 view), **top** (straight down), plus front, back, left,
and right.

- **💎 Sims** applies the classic dimetric Sims pose and turns on 45° azimuth
  snapping — as you orbit, the camera clicks to the nearest 45°, while tilt and
  zoom stay free. Click it again to release the snap.
- **💾 Save view** stores your current camera pose as a named view. Saved views
  can be recalled and used in kiosk URLs.
- **🎥 Auto-follow** eases the camera to keep the active figures framed —
  tight on a single person, wide when they're spread out, and a full-floor pose
  when no one's around. Orbiting by hand pauses it for a few seconds.
- **🎬 Cinematic orbit** slowly circles the scene (about 78 seconds per
  revolution) at your current zoom and height. It composes with auto-follow.

### Glass house & wall cutaway

Two features keep the interior visible from any angle — toggle both with the
🏠 button in the 3D bar or the checkboxes in the Display settings.

- **Wall cutaway** (on by default) fades away foreground walls — the ones
  between the camera and the room you're looking into — so you can always see
  inside. Top-down views hide nothing.
- **Glass house** turns every inactive floor into a translucent shell stacked
  above and below the current floor, and makes the active floor's walls and
  slab see-through, for a full doll's-house overview of the whole building.

### Scene presets & auto lighting

The **Display** settings hold the 3D scene appearance. The lighting **preset**
sets the mood: **night** (the default), **day**, or **dusk**. Preset light
levels are tuned so the toon shading bands read well.

Choose how the preset is picked:

- **Manual** — you set it directly.
- **Clock** — follows the time of day, reading your `sun.sun` entity's
  elevation (day when the sun is well up, dusk near the horizon, night
  otherwise) with a local-clock fallback.
- **Lux** — follows a light-level sensor you pick (bright → day, dim → dusk,
  dark → night).

When weather effects are on, overcast, rainy, foggy, and stormy conditions
gently dim a daytime scene toward dusk.

### Floor textures & colors

In Display settings you can set the floor color, floor texture
(**none**, **wood**, **tile**, or **concrete** — procedurally drawn in the toon
style), and wall color for the whole home.

#### Per-floor look overrides

Each floor can override the global look. In the **Floors** section, the "This
floor only" controls let you give a specific level its own floor color,
texture, and wall color — useful for distinguishing a basement or an attic.

### Imported Sweet Home 3D models

If you've modeled your home in Sweet Home 3D, you can import its OBJ/MTL export
as a reference model that sits under your plan. Diorama stores only the
placement (scale, position, rotation, opacity, visibility) synced through Home
Assistant; the model geometry lives in your browser, so re-import it once per
browser. Sweet Home 3D exports in centimeters with the default scale set for
you; adjust scale, offset, and rotation to line it up with your 2D plan. The
imported materials are re-shaded into the Sims toon style so the model blends in
rather than looking photorealistic against the cartoon scene.

This visual model is a non-editable backdrop. If you'd rather turn a Sweet
Home 3D file into **editable** floors, walls, rooms, and furniture, use the
structural `.sh3d` importer instead — see
[Configurations, notes & offline](configurations.html).

### Ghost floors

When you have more than one floor, the levels you're not currently on can
appear as faint translucent "ghost" shells stacked at their real heights — this
is what glass-house mode uses to show the whole building at once. Disabled
floors are left out of the stack.

### Stairs & multi-level connections

Stairs family pieces build real flights in 3D, and figures use them.

- **Descending flights** — a stairs piece set below floor level cuts its own
  stairwell hole and builds treads sinking below the slab. Figures occasionally
  walk down and "go downstairs," and fresh figures sometimes emerge up from a
  flight. Railings keep them from popping through the side of the slab.
- **Floor voids** — draw a "no floor here" polygon with the Void tool to open a
  hole in the slab (for a stairwell or a double-height space). Figures route
  around the missing floor and cross it only via a stairs piece that bridges it.
- **Cross-floor stair links** — pair a stairs piece on one floor with a stairs
  piece on the floor above using the "Linked stairs" picker. Identified people
  tracked across floors then hand off between levels: an arriving figure fades
  in at the linked stair and walks out, and a leaving figure walks to the stair
  and fades away. Linked stairs show a ▲ / ▼ chip in the 2D plan, and in
  glass-house mode a figure occasionally walks the flight between levels as a
  bit of theater.
