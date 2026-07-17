# Getting started

Diorama is a graphical dashboard for Home Assistant. You build a virtual copy
of your home — walls, rooms, furniture, and devices — and see live device
state in its actual spatial context. Click anything to control it. The 3D view
renders in a 2000-era *Sims* cartoon style, and the people and pets moving
through your home show up as animated figures.

It has first-class support for HLK-LD2450 mmWave radar (multi-target tracking
with animated figures that walk, sit, and run contextual activities), but the
model is generic: any Home Assistant entity can be placed and bound — lights,
switches, fans, media players, environmental sensors, cameras, locks, covers,
and more.

## Requirements

- **Home Assistant** — any recent version. Diorama talks to HA over its
  WebSocket API.
- **A browser** — desktop for building your plan; tablets and TVs work great
  for kiosk display.
- **[HACS](https://hacs.xyz)** if you want the one-click install below.
  (You can also deploy it by hand, or run it fully standalone with no Home
  Assistant at all — see [Configurations, notes & offline](configurations.html).)

## Install with HACS

Diorama is distributed as a HACS **custom repository** — it is not in the HACS
default store, so you add it once by URL.

**1. Add the custom repository**

- Open **HACS** in the Home Assistant sidebar.
- Click the **⋮** menu (top right) → **Custom repositories**.
- Repository: `https://github.com/pwsh/diorama`
- Type: **Dashboard**
- Click **Add**, then close the dialog.

**2. Download it**

- Search HACS for **Diorama** and open it.
- Click **Download** and pick the latest release. HACS unpacks the release
  zip into `config/www/community/diorama/`.

The release is a multi-file bundle (the 3D renderer is code-split into its own
chunk that loads on demand), which is why Diorama ships as a zip release rather
than a single file.

**3. Register the panel**

Add this to `configuration.yaml` and **restart Home Assistant** —
`panel_custom` is only read at startup:

```yaml
panel_custom:
  - name: diorama-panel
    sidebar_title: "Diorama"
    sidebar_icon: mdi:floor-plan
    url_path: diorama
    module_url: /hacsfiles/diorama/diorama-panel.js
    embed_iframe: false
```

**Diorama** now appears in your HA sidebar. Panel mode rides Home Assistant's
own authentication, so there are no tokens to paste.

## The panel vs. iframe modes

The **native panel** above is the recommended setup: no iframe, no token, and
HA handles authentication for you.

If you deploy the files manually (copy `dist/` to `config/www/diorama/`
instead of installing through HACS), the `module_url` becomes
`/local/diorama/diorama-panel.js` instead of the `/hacsfiles/...` path.

There is also an **iframe fallback** for setups where the native panel is not
an option. It loads Diorama as a standalone page and asks you to paste a
Long-Lived Access Token on first load:

```yaml
panel_iframe:
  diorama:
    title: "Diorama"
    icon: mdi:floor-plan
    url: "/local/diorama/index.html"
    require_admin: false
```

Prefer the native panel whenever you can — it is simpler and needs no token.

## Your first floor plan

Once the panel opens, you are in **Edit** mode with an empty floor.

1. **Create a floor.** Use the Floors section in the sidebar to name your
   first floor (for example, "Main level"). Add more floors later for
   multi-story homes.
2. **Draw walls.** Pick the Wall tool and click to place wall segments;
   endpoints snap and weld together so rooms close cleanly. Walls come in
   full, half, railing, and invisible kinds (invisible walls close off a floor
   region without drawing anything). A closed loop of walls becomes a floor
   patch in 3D.
3. **Add rooms.** Drop a room anchor inside a closed wall loop and give it a
   name. Room names drive contextual behavior — a room named "kitchen" gates
   snack and coffee thought bubbles, and a room's TV scopes what a seated
   figure watches.
4. **Place furniture.** Drop sofas, beds, tables, appliances, plants, and more
   from the Furniture section. Sittable pieces become seats your figures use;
   some pieces anchor activities like eating, working, or watching TV.
5. **Add doors and windows.** These snap onto the nearest wall automatically,
   cutting a real opening that figures walk through.
6. **Bind an entity.** Drop a light, switch, sensor, or appliance, then use
   the entity picker (filter by domain or by HA device, or search by name) to
   bind it to a real Home Assistant entity. The fixture now reflects live
   state — a bound light glows when it is on, and clicking it toggles the real
   device.

Switch to the **3D view** at any time to see your plan rendered in the Sims
style, with live figures walking through it.

## Where settings live

Most day-to-day building happens in the left **sidebar**: floors, tools,
sensors, furniture, fixtures, rooms, layers, and more, each in a collapsible
section.

Broader options live in the **Settings** drawer:

- **Connection** — your Home Assistant link, or exit offline mode.
- **Display** — 3D scene appearance (lighting preset, floor and wall colors,
  textures), camera and view options.
- **Weather** — weather source and 3D weather effects.
- **Avatars** — load, activate, and import avatar packs.
- **Integrations** — toggles such as Bermuda BLE positioning.
- **Data** — named configurations (save, rename, import, export), the notes
  field for the active configuration, and other data tools.

From here, continue to [The 2D editor](editor.html) to learn the drawing tools
in depth, or jump to [Kiosk & display modes](kiosk-modes.html) to put a plan
on a wall tablet.
