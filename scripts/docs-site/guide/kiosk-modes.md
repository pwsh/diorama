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

## Device-local view memory

Each device remembers the last view (2D or 3D) it was showing, stored locally
in that browser, so a tablet reopens where it left off. A `view=` URL
parameter always wins over the remembered view, so a locked kiosk URL stays
put.

## Touch behavior

Diorama is built to behave well on touch screens:

- **Tap to control.** In Kiosk mode, tapping a light, switch, appliance, door
  lock, alarm keypad, or other bound fixture toggles or opens it, just like a
  click.
- **Double-tap** on a light opens its color and brightness controls (where
  available).
- **Two-finger** gestures pan and zoom the 2D plan and orbit the 3D view;
  they will not accidentally open the Home Assistant sidebar drawer, except for
  an intentional swipe that starts right at the left edge of the screen.
- The 3D view caps its pixel ratio and guards against WebGL context loss, so
  tablets stay smooth and recover cleanly if the browser drops the GL context.

## Running on tablets and TVs

Because everything you need is in the URL, putting Diorama on a wall is
straightforward:

1. Build and lay out the view you want in **Edit** mode.
2. Save the layer preset and/or 3D camera view you want to show.
3. Use the **🔗 Kiosk link** button to copy a locked URL, or assemble one from
   the parameter table above.
4. Open that URL on the tablet or TV browser (or point a kiosk-browser app or
   a Home Assistant dashboard card at it).

Add `lock=1` so the device cannot be bumped out of Kiosk or View mode, and
pick the floor, view, and camera that make the best always-on display for that
spot in your home.

For plans you want available even without a Home Assistant connection, see
offline standalone mode in
[Configurations, notes & offline](configurations.html).
