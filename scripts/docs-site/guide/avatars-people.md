# Avatars & people

The figures walking through your 3D home are **avatars** — the visible bodies
Diorama gives to the presence your sensors detect. This page covers how they
behave, how to choose their looks, and how to tie them to real people.

### What avatars are

Every radar target, AI avatar, roaming presence, or tracked person becomes a
persistent animated rig — head, torso, two-segment arms and legs, a face, and
shoes — that walks, sits, and reacts. Figures **path around furniture and
through doorways** rather than sliding through walls.

- **Walking** — gait and facing follow the figure's actual on-screen motion, so
  feet don't skate or pump in place. Movement stays smooth between the few
  position updates a sensor sends.
- **Sitting** — a figure that lingers near a chair, sofa, bench, or stool eases
  into a seated pose, turning to face the seat. Multi-seat pieces hold several
  people, and no two figures claim the same spot.
- **Activities** — near the right furniture, figures run contextual actions:
  making coffee, foraging the fridge, loading the dishwasher, showering,
  exercising, eating at a table, working at a desk, and watching a TV that's
  actually on. Bathroom activities apply a privacy blur.
- **Beds** — settled occupants lie down in a bed's lanes; two people in one bed
  hide under a breathing blanket.
- **Thought bubbles** — time- and place-aware bubbles float up: coffee and
  breakfast in a kitchen in the morning, snacks at night, reading or a phone in
  the evening, plus reactions to a light or fireplace or TV that just switched.
- **Idle fidgets** — standing figures look around, shift their weight, and run
  little one-shots (stretch, check a watch, yawn, tap a foot), and wave when
  they spawn.

Pets never trigger privacy blur, standing activities, or thought bubbles.

### Avatar packs

Avatars are organized into **packs** you load and activate in
**Settings ▸ Avatars**.

- The **core** pack is a single `adult` avatar that's always loaded and can't be
  removed — it's the default that stands in whenever nothing else resolves.
- Nine **base** packs ship loaded and active, giving you the full set of
  everyday humanoids out of the box.
- **Franchise** packs are novelty character sets that ship unloaded — opt into
  them when you want them.

For each pack you can toggle **Loaded** and **Active**, pick a **member subset**
(with color swatches), and **import / export** your own packs as JSON. The core
row is locked.

### Choosing looks: pools & re-roll

A sensor, motion sensor, or roamer can hold a **pool** of avatar ids instead of
a single pick. Resolution filters the pool to loaded, active members, so
deactivating a pack silently drops its members from every pool.

- A pool of one always shows that avatar; a larger pool picks one.
- When a fresh figure spawns from a pool, it **re-rolls** to a random member, so
  a respawn looks different. Explicitly named single avatars and identified
  people never re-roll.
- An unidentified stranger draws from the random pool of active, non-franchise
  humanoids — franchise characters never surprise you on an unknown person.

### Roaming avatars

Roamers are persistent display presences that need no sensor at all. Add them in
the **Roamers** sidebar section — give one a name and an avatar pool, and it
wanders your home in every mode, mostly living indoors (sitting, watching TV,
using appliances) with the occasional trip outside. They're perfect for making
an empty demo house feel alive.

### The people registry

The **People** section is the shared identity concept. Each person has a name,
an optional color, a single avatar pick, and up to three Home Assistant
bindings:

- an **HA person** entity (for GPS via the person),
- a **BLE device** (the Bluetooth device Bermuda tracks),
- a **device_tracker** (for GPS).

A person can be marked as a **pet**, which renders as a cat or dog rig.

### BLE indoor positioning (Bermuda)

Diorama can locate people indoors from Bluetooth signal, solved right in the
panel from your BLE proxies.

- **Proxies** — place BLE proxy fixtures with the BLE tool (they ride the
  sensors layer) and bind each to its physical proxy device. Three or more give
  the best fix.
- **Bermuda setup** — enable the Bermuda integration in **Settings ▸
  Integrations**. The People section's Bermuda subsection lists the tracked
  devices and how many of their distance entities are disabled; a consent button
  enables a device's entities (Home Assistant needs about half a minute to start
  reporting).
- **Unknown devices** — configured-but-unmapped BLE devices can show as
  "unknown" figures; toggle that with "Show unknown BLE devices."

A person is drawn with their color, initials chip, and a faint confidence
circle showing how sure the fix is.

### Identity fusion & name labels

When a person's BLE position lines up with a precise mmWave radar figure,
Diorama **fuses** the two: the radar figure adopts the person's avatar, color,
and a floating **name label**, and the person's separate BLE ghost hides so
nobody's drawn twice. Fusion is careful — it only commits when the match is
unambiguous and held steadily, and releases cleanly when they separate or one
disappears.

Name labels show only when Diorama is confident (a fused figure or an identified
BLE person, never an unknown device). Turn them on or off with the **name
labels** layer.

### Pets

Cats and dogs render as dedicated four-legged rigs that trot, sit on their
haunches, and curl up on soft furniture. They use the same walking, pathing, and
fading machinery as people but never trigger bubbles, activities, or privacy
blur. A person marked as a pet with no explicit avatar renders as a cat.
