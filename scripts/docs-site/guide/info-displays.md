# Info displays & alerts

Beyond controlling devices, Diorama can turn your plan into a set of live
information surfaces — value readouts, a wall calendar, TV screens, a
temperature heat-map, and a house-wide alert bell. This page covers the
glanceable "what's going on" features.

### Info cards

The **Info (🔢)** tool places a value plaque that shows the live state of *any*
Home Assistant entity as crisp text — a temperature, a person's location, a
sensor reading, anything. It generalizes the environmental-sensor chip to every
domain.

- **Bind any entity**, or set the card to a **clock** or **date** mode that
  needs no binding at all.
- **Formatting** — choose precision, a unit, prefix/suffix, and how binary and
  enumerated states read.
- **Color rules** — add value rules (less-than, greater-than, between,
  contains, matches) that recolor the card or make it **flash** when a reading
  crosses a threshold, so a card can turn red when a freezer warms up.
- **Placement** — a card can face the camera (**billboard**) or mount flat on a
  wall, and it snaps flush to the nearest wall on drop.

Info cards are display-only — clicking one just selects it for editing. They
have their own **info** layer.

### Action buttons

The **Action (🔘)** tool places a button that fires a configurable Home
Assistant service when tapped — a "goodnight" scene, a script, an automation,
a scene, or any custom `domain.service` with your own data.

- **Any action** — pick the action kind and its target, or write a custom
  service call with JSON service data (validated inline).
- **Mounting** — wall-plate, or a free-standing table / floor puck.
- **Confirm** — turn on a confirmation prompt for destructive actions.
- **Feedback** — the cap depresses and pulses a ring on press, the sidebar
  shows a "fired N ago" line, and nearby figures react with a thought bubble.

Action buttons ride the **switches** layer. In Kiosk mode they fire; in View
mode they are inert. A quick **Test** button in the sidebar lets you try the
action while editing.

### Logical-state lights

A light doesn't have to be bound to a `light.` entity — you can drive its
on/off, color, and flash from *any* entity's value using the same rule engine
info cards use. Add a **Logic binding** in the Lights editor: pick a source
entity, write value rules (each with a color, and optionally a flash), and set
an off-color. The light then lights up and colors itself from the matched rule,
with no `light.` entity involved — perfect for turning a decorative fixture
into a status indicator. A logic light is read-only (clicking does nothing —
its state is computed).

### Wall calendar

The **Calendar (📅)** tool places a read-only wall plaque bound to one or more
`calendar.` entities. It shows a today-accented header and the next upcoming
event, with the full agenda fetched periodically from Home Assistant (calendars
don't push their whole agenda, so Diorama polls every few minutes). Bind
several calendars to a single panel to merge them. The panel is display-only —
the sidebar section is where you configure it.

### TV screen surfaces

A TV or wall-TV in your plan can show more than now-playing art. In the TV
furniture editor, pick a **Screen** mode:

- **News ticker** — bind a headline sensor (an RSS/feed sensor or an event
  entity) and the screen scrolls its headlines, rotating through them.
- **Weather on TV** — a mini weather card drawn from your weather source and
  forecast (no binding needed).

Whenever the TV is actually presenting media, the now-playing card always wins
and hides the surface. A small `📰` / `⛅` line appears under the TV in 2D as a
glanceable hint.

### Per-room temperature heat-map

Turn on the **Temperature heat-map** layer (off by default) to tint each room by
its temperature. Diorama averages the temperature-kind environmental sensors
placed inside a room's walls, plus any thermostat sitting in that room, and
fills the room on a five-band cold-to-hot ramp (blue → cool cyan → faint
comfort green → warm amber → hot red) around a comfort band you set in
**Settings ▸ Display** (default 20–24 °C, shown in °F when you use imperial
units). Rooms with no temperature sensor render nothing — an unknown room is
left blank rather than guessed. The fill and a centroid temperature label show
in 2D, and translucent patches show in 3D.

### The alert center

A **🔔 bell** in the topbar surfaces Home Assistant's "needs a human's
attention" streams — **persistent notifications** and the **Repairs** issue
registry — in one place. The bell carries a severity-tinted unread badge and
pulses when a new alert arrives; clicking it opens a dropdown of alert rows
(newest and most severe first) with relative times, a Dismiss / Ignore action
per source, and a deep-link into Repairs.

Configure it in **Settings ▸ Integrations ▸ Alert Center**: per-source toggles,
a minimum Repairs severity, and whether the bell shows in Kiosk / View modes
(off by default, since notification text can be instance-specific). Repairs
issues require an admin Home Assistant user; a non-admin kiosk simply shows
fewer alerts rather than failing.

#### Alert beacons

The **Alert beacon (🔔)** tool places a ceiling puck bound to an `alert.` entity
(or any `binary_sensor`) that pulses expanding rings while active. Click it to
acknowledge a bound `alert.` entity. Beacons ride the **sensors** layer and
render in Kiosk mode too, so a wall display can flash a room-level warning.
