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
settings, layers, saved views, and the notes field — **plus any avatar packs
you have imported yourself**. That means a plan you hand to someone on a fresh
browser brings its custom avatars with it and renders exactly as you built it,
with nothing else to install.

Exports are portable across browsers and machines, and are the way to move a
plan when you are running offline (where there is no Home Assistant to sync
through).

## Offline standalone mode

Diorama also runs as a plain web page with **no Home Assistant connection at
all** — handy for designing a floor plan, building a demo, or trying it out
before you wire anything up.

**Serve the files statically.** Serve the built `dist/` folder from any static
file server (or unzip a HACS release and open it directly):

```bash
npm run build
cd dist && python3 -m http.server 8080   # or any static server
# open http://localhost:8080/index.html
```

**Choose offline on the connect screen.** On first load, click **Use offline —
no Home Assistant**. An **Offline** pill appears in the topbar to remind you.

In offline mode the full editor works — place walls, furniture, roamers, demo
avatars, and unbound fixtures (which you can still toggle locally), and weather
can pull directly from the keyless Open-Meteo service. The only thing missing
is live device state, since there is no Home Assistant to read it from.

**Where offline data lives.** Everything — including multiple named
configurations — is stored **in this browser** (local storage) rather than in
Home Assistant. To move a configuration to another browser or machine, use
**Export** / **Import** as described above.

**Reconnecting later.** To connect to Home Assistant, open **Settings ▸
Connection** and click **Exit offline mode**.
