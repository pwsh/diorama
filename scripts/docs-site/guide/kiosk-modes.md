# Kiosk & display modes

Diorama has three modes, so the same plan can be a full editor on your desktop
and a locked-down live display on a wall tablet or TV.

## The three modes

| Mode | What you can do |
|---|---|
| **Edit** | The full editor: draw walls, place and bind fixtures, change settings. This is the default, and the only mode that saves changes. |
| **Kiosk** | See your views and control devices — click a light to toggle it, open an alarm keypad — but nothing is editable and nothing is written back. Device toggles are session-only. |
| **View only** | Pure visualization. No editing, no interaction; the plan just shows live state. |

Switch modes from the topbar mode selector. In Kiosk and View modes the
sidebar, floor editing tools, and settings are hidden — only what a viewer
needs remains.

Kiosk and View modes never save. Even a light you toggle in Kiosk mode lives
only in the current browser session; it is never persisted to Home Assistant
or to local storage. This is deliberate: a shared wall tablet should never
rewrite your saved plan.

## Boot straight into a view with URL parameters

You can drive Diorama entirely from the URL, which is how you point a tablet or
TV at a specific, locked display:

```text
/diorama?mode=kiosk&lock=1&view=3d&floor=First&view3d=Living%20room
/diorama?mode=view&lock=1&view=2d&layers=simple
```

Supported parameters:

| Parameter | Effect |
|---|---|
| `mode` | `edit`, `kiosk`, or `view`. |
| `lock=1` | Hide the mode switcher so the device stays in the chosen mode. |
| `view` | `2d` or `3d`. |
| `floor` | Which floor to show (by name or id). Disabled floors are ignored. |
| `layers` | A saved layer preset by name or id, or the built-in `simple` / `full`. |
| `view3d` | A saved 3D camera view by name or id. |
| `cam` | An explicit 3D camera pose: `x,y,z,tx,ty,tz`. |

Templates fall back gracefully — if a named floor, layer preset, or saved view
no longer exists, Diorama uses sensible defaults rather than showing an error.

## The Kiosk link button

You do not have to hand-write those URLs. Set up the exact view you want in the
editor, then use the **🔗 Kiosk link** button in the topbar. It copies a URL
that reproduces your current view — mode, floor, 2D/3D, layers, and (in 3D) the
current camera pose baked into a `cam=` parameter. Paste that into your
tablet's browser or a wall-panel dashboard.

## The Lovelace card

Diorama also ships a **dashboard card**, so a floor plan or a 3D room view can
sit on any Lovelace dashboard beside your other cards. It rides Home
Assistant's own connection (no token) and is **read-only**: build and edit the
plan in the panel, then *show* it in cards.

**1. Register the card resource** (once):

- **Settings → Dashboards → ⋮ (top right) → Resources → Add resource**
- URL: `/hacsfiles/diorama/diorama-card.js`
- Type: **JavaScript Module**

**2. Add the card** from the dashboard card picker (search "Diorama" — it
registers itself, and has a small visual editor), or in YAML:

```yaml
type: custom:diorama-card
view: 2d          # 2d (floor plan) | 3d (room view)   — default 2d
mode: kiosk       # kiosk (tap to control) | view (display only) — default kiosk
floor: Kitchen    # floor name or id (optional; default = current/first floor)
layers: simple    # a 2D-layer preset name/id, or "simple" | "full" (optional)
view3d: Iso       # a saved 3D view name/id (3D only, optional)
cam: [x,y,z,tx,ty,tz]   # explicit 3D camera pose (3D only, optional)
compact: false    # hide the overlay chrome; auto-on below ~360px wide
panelPath: /diorama     # href for the ⤢ "open full panel" link (default /diorama)
scene:            # 3D-only look overrides for THIS card (optional)
  glassHouse: true
  wallCutaway: true
  cinematicOrbit: true
  fovV: 45
```

| Field | Values | Default | Notes |
|---|---|---|---|
| `view` | `2d` or `3d` | `2d` | 3D loads the renderer only when a 3D card mounts. |
| `mode` | `kiosk` or `view` | `kiosk` | `edit` is rejected — a card never edits or saves the plan. `view` disables tap-to-control. |
| `floor` | floor name or id | current/first | Shared across cards on a tab (last-applied wins). |
| `layers` | preset name/id, `simple`, `full`, or an explicit `{layer: true/false}` map | plan default | The same presets as the panel's 2D Layers; the editor's **Custom…** option writes the map form. |
| `scene` | a map of 3D options | inherits the plan | 3D only, and **card-local** — see below. |
| `view3d` | saved view name/id | iso framing | 3D only. |
| `cam` | 6 numbers | — | 3D only; an explicit pose, and it wins over `view3d`. |
| `compact` | `true` or `false` | auto (below 360 px) | Hides the view-preset bar, reset button, weather chip, and compass. |
| `panelPath` | url path | `/diorama` | The `url_path` of your `panel_custom` panel, for the ⤢ link. |

### Card-local 3D look

A 3D card can override the plan's scene settings **for itself only**, so a
dashboard card can be a slowly orbiting glass-house showpiece while the panel
stays as you left it. In the card's visual editor these appear as
(inherit) / On / Off dropdowns; in YAML they go under `scene`:

`glassHouse`, `wallCutaway`, `autoFollow`, `cinematicOrbit`, `simsCam`,
`plumbobs`, and `skyBackdrop`, plus `fovV` (10–120) and `fovH` (10–150).

Anything you leave out is inherited from the plan. 2D cards ignore `scene`
entirely.

### One shared connection

Every Diorama card on a tab shares **one** live connection, so add as many as
you like — a 2D card beside a 3D card, several rooms — at no extra cost.

Two things to know about that sharing:

- **The floor is shared**, not per card. Cards on the same tab can show different views (one 2D, one 3D) and different modes, but the last-applied `floor` wins for all of them.
- Cards are permanently kiosk-locked at the connection level, so nothing on a dashboard can ever write back to your saved plan.

## Device-local view memory

Each device remembers the last view (2D or 3D) it was showing, stored locally
in that browser, so a tablet reopens where it left off. A `view=` URL
parameter always wins over the remembered view, so a locked kiosk URL stays
put.

## Touch behavior

Diorama is built to behave well on touch screens:

- **Tap to control.** In Kiosk mode, tapping a light, switch, appliance, door lock, alarm keypad, or other bound fixture toggles or opens it, just like a click.
- **Double-tap** on a light opens its color and brightness controls (where available).
- **Two-finger** gestures pan and zoom the 2D plan and orbit the 3D view; they will not accidentally open the Home Assistant sidebar drawer, except for an intentional swipe that starts right at the left edge of the screen.
- The 3D view caps its pixel ratio and guards against WebGL context loss, so tablets stay smooth and recover cleanly if the browser drops the GL context.

## Running on tablets and TVs

Because everything you need is in the URL, putting Diorama on a wall is
straightforward:

1. Build and lay out the view you want in **Edit** mode.
2. Save the layer preset and/or 3D camera view you want to show.
3. Use the **🔗 Kiosk link** button to copy a locked URL, or assemble one from the parameter table above.
4. Open that URL on the tablet or TV browser (or point a kiosk-browser app or a Home Assistant dashboard card at it).

Add `lock=1` so the device cannot be bumped out of Kiosk or View mode, and
pick the floor, view, and camera that make the best always-on display for that
spot in your home.

For plans you want available even without a Home Assistant connection, see
offline standalone mode in
[Configurations, notes & offline](configurations.html).
