# Diorama

**A living model of your home.** Draw your floor plan, place your devices,
and watch Home Assistant state in real spatial context — in 2D and 3D.
Click anything to control it.

![Diorama overview](https://raw.githubusercontent.com/pwsh/diorama/main/docs/images/overview-iso.png)

## Highlights

- **The Sims, for your house** — the whole 3D view renders in a 2000-era
  *Sims* cartoon style: flat toon shading, bold outlines, blob shadows, a
  dimetric "Sims cam", a glass-house / wall-cutaway doll's-house view, an
  auto-follow camera, and green plumbobs over the people it's tracking.
- **Live presence with personality** — first-class HLK-LD2450 mmWave
  support: multi-sensor, multi-target tracking rendered as animated figures
  that **walk around furniture and through doorways**, sit down, and run
  contextual activities — making coffee, loading the dishwasher, watching a
  TV that's actually on, working out, getting **censored in the shower**, and
  hiding under the **covers** two-to-a-bed. 22 avatar models with their own
  walk styles; motion sensors can drive room-confined **AI avatars**. Idle
  figures show time- and place-aware **thought bubbles**.
- **Know who's who** — a **People** registry (avatars, colors, pets),
  **Bluetooth/Bermuda** indoor positioning solved right in the panel from
  your BLE proxies, and **identity fusion** that dresses a precise radar
  figure in a person's avatar and floating **name label**. **Pets** render as
  cat/dog rigs.
- **The world outside** — **GPS device pins** in the yard with a landmark
  calibration flow, and **weather** (a HA entity, local sensors, or keyless
  Open-Meteo by ZIP) with a corner chip plus 3D rain, snow, fog, wind, and
  lightning.
- **Real floor plans** — walls with 15° snapping and auto-welding, half
  walls, railings, doors and five window styles that cut real openings,
  stairs with landings, floors clipped to your rooms, named rooms, item
  locking, and smart alignment guides.
- **A full furniture catalog + a custom object editor** — seating,
  sectionals, beds, casework with door pulls, spec-size appliances,
  counter-mounted gadgets, bathroom fixtures, plants, rugs, stairs — and a
  **form-based editor** to build your own objects from primitive parts.
- **Every kind of light** — recessed cans, pendants, sconces, step lights,
  LED strips and strings, under-cabinet lighting, ceiling fans that spin at
  the fan's actual speed, and a crackling wall-snapping fireplace. Click to
  toggle, double-click for color/brightness; fans and TVs get device
  controls.
- **Sensors everywhere** — motion cones, environmental chips (temperature,
  humidity, CO₂/CO with health-threshold colors), coverage wedges.
- **Scene modes** — day/dusk/night lighting that can follow the sun or a
  lux sensor; saved 3D camera views; 2D + 3D layer presets including a
  minimal floorplan with activity glow.
- **Synced through HA** — the whole model lives in Home Assistant user
  data, so every browser and tablet sees the same home.
- **Kiosk & view-only modes** — pin a wall tablet to a configured view with
  a URL (`?mode=kiosk&lock=1&view=3d&floor=…`): devices stay tappable but
  nothing can be edited; view-only drops interaction entirely.

📖 **[Full user guide with screenshots](https://github.com/pwsh/diorama/blob/main/docs/GUIDE.md)**

## Setup

**Add as a HACS custom repository**: HACS → ⋮ → *Custom repositories* →
repository `https://github.com/pwsh/diorama`, type **Dashboard** → Add,
then download **Diorama**.

Register the panel in `configuration.yaml` and restart Home Assistant:

```yaml
panel_custom:
  - name: diorama-panel
    sidebar_title: "Diorama"
    sidebar_icon: mdi:floor-plan
    url_path: diorama
    module_url: /hacsfiles/diorama/diorama-panel.js
    embed_iframe: false
```

Open **Diorama** in the sidebar, draw your first walls, and bind your
devices — no tokens or extra configuration needed in panel mode.

For LD2450 presence features, pair with the companion ESPHome firmware so
zone/object entities follow its naming conventions.
