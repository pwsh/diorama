# Configurations, notes & offline

Diorama can hold more than one plan at a time, keep a description with each, and
run with no Home Assistant connection at all. Everything in this section lives
in **Settings ▸ Data**, except offline mode, which starts from the connect
screen.

## Multiple configurations

A **configuration** is one complete plan — its floors, walls, rooms, furniture,
fixtures, bindings, people, avatars, weather, and scene settings. You can keep
several and switch between them: a real home plus a demo, a "before" and
"after" remodel, or one plan per property.

Configurations are managed in **Settings ▸ Data ▸ Configurations**:

| Action | What it does |
|---|---|
| **Dropdown** | Switch the active configuration. The whole plan swaps instantly. |
| **Save** | Save the active configuration now. |
| **Save as…** | Duplicate the current plan into a new named configuration and switch to it. |
| **New…** | Start a brand-new, empty configuration and switch to it. |
| **Rename** | Rename the active configuration. |
| **Import** | Add a configuration from an exported file and switch to it. Importing never overwrites your current plan — it adds a new one. |
| **Export** | Download the active configuration as a portable file. |
| **Delete** | Remove a configuration (with confirmation). You cannot delete the last one. |

Your configurations are stored in Home Assistant (in the same `user_data` area
HA uses for its own preferences), so they sync across your browsers and devices
and are included in HA backups. The last configuration you had active is the
one restored the next time you open the panel.

## The notes field

Each configuration carries a free-text **Notes** field — a description saved
alongside the plan. Use it for anything: what this plan is, what still needs
wiring up, room-by-room details, or a changelog.

The notes for the **active** configuration appear in **Settings ▸ Data**, just
below the configuration controls, as an editable text box. Type a description
and it is saved with that configuration; switch configurations and the notes
box updates to show the newly active plan's notes.

Notes travel with the plan: they are included when you **export** a
configuration and restored when you **import** it, so a shared plan arrives
with its description intact.

## What's in an export

An exported configuration is a self-contained snapshot. It includes the entire
plan — floors, walls, rooms, doors and windows, furniture and custom objects,
lighting and switches, sensors, people, roaming avatars, weather and geo
settings, layers, saved views, and the notes field — **plus any avatar packs you have imported yourself**. That means a plan you hand to someone on a fresh
browser brings its custom avatars with it and renders exactly as you built it,
with nothing else to install.

Exports are portable across browsers and machines, and are the way to move a
plan when you are running offline (where there is no Home Assistant to sync
through).

## Import from Sweet Home 3D

If you've already drawn your home in **Sweet Home 3D**, you can import its
native `.sh3d` file as a real, editable Diorama plan — not just a reference
model. Diorama reads the file and builds actual **floors, walls, rooms, doors, windows, and furniture** you can then edit like anything you drew by hand.

- Use **Import Sweet Home 3D (.sh3d)** in **Settings ▸ Data** (or the 3D Model sidebar section). Levels become stacked floors that line up, walls become wall runs, room polygons become named rooms, and doors/windows snap onto their walls.
- Furniture is matched best-effort by name to Diorama's kinds (toggle it off if you'd rather not); pieces it can't recognize are skipped rather than dropped in as mystery blocks.
- The import arrives as a **new configuration** after a summary confirmation, so it never disturbs your current plan. Any open-plan rooms that aren't fully enclosed by walls are flagged but still imported.

This is different from the visual OBJ/MTL model import (covered in
[The 3D view](3d-view.html)), which drops a non-editable model *under* your plan
as a tracing reference. Use the `.sh3d` import when you want editable geometry;
use the OBJ import when you just want a visual backdrop.

## Offline standalone mode

Diorama also runs as a plain web page with **no Home Assistant connection at all** — handy for designing a floor plan, building a demo, or trying it out
before you wire anything up.

**Serve the files statically.** Serve the built `dist/` folder from any static
file server (or unzip a HACS release and open it directly):

```bash
npm run build
cd dist && python3 -m http.server 8080   # or any static server
# open http://localhost:8080/index.html
```

**Choose offline on the connect screen.** On first load, click **Use offline — no Home Assistant**. An **Offline** pill appears in the topbar to remind you.

In offline mode the full editor works — place walls, furniture, roamers, demo
avatars, and unbound fixtures (which you can still toggle locally), and weather
can pull directly from the keyless Open-Meteo service. The only thing missing
is live device state, since there is no Home Assistant to read it from.

**Where offline data lives.** Everything — including multiple named
configurations — is stored **in this browser** (local storage) rather than in
Home Assistant. To move a configuration to another browser or machine, use
**Export** / **Import** as described above.

**Reconnecting later.** To connect to Home Assistant, open **Settings ▸ Connection** and click **Exit offline mode**.

## The live demo

Offline mode is also how the [live demo](../demo/index.html?demo=ranch-3bed) at
`pwsh.github.io/diorama/demo` works: it's the real production build running
client-side in your browser, with nothing installed and no account.

- It arrives seeded with **twelve sample homes** — a studio through a large multi-level house — each loaded as its own configuration. Switch between them from the configuration dropdown, or link straight to one with `?demo=<name>` (the floor-plan library pages do exactly that).
- Everything is **editable**. Draw, place, bind, orbit — the whole editor works. Bound devices simply show no live state, since there's no Home Assistant.
- Your edits are saved **only in that browser's local storage**, never uploaded.
- A **Reset demo** button in the topbar clears your changes and restores the original samples.

It's the easiest way to try a feature before building it into your real plan —
and because a configuration **Export** file is portable, you can build something
in the demo and import it into your own Diorama afterwards.
