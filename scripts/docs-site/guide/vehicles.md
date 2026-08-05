# Vehicles & aircraft

Diorama ships a library of **vehicle models** — cars, buses, tanks, warbirds,
airliners and rockets — organized into packs you load only if you want them.
The same library feeds three completely different places:

- **On the ground** — park a pickup in the driveway or a fire engine at the curb, as ordinary placeable furniture.
- **In the sky** — pick the aircraft that tows your background-text banner around the property.
- **On real traffic** — draw actual overhead military aircraft with their own silhouette instead of a generic jet.

Both halves of the library have their own model gallery page, with a turntable
of every model:

- [**Vehicle models**](../models/vehicle-models.html) — the 26 that place on the ground.
- [**Flying models**](../models/flying-models.html) — every craft that can tow a banner, including the built-in toy plane, flight-tracker silhouettes, military & NASA roster and fiction homages.

### The pack manager

Vehicles work exactly like [avatar packs](avatars-people.html): the packs you
turn on are the only ones the app loads, so a library this size costs nothing
until you ask for it. Manage them in **Settings ▸ Vehicles**.

Each row shows the pack, how many models it holds, whether it's built in or a
novelty opt-in, and two checkboxes:

- **load** — fetch the pack's models. Nothing is downloaded until you check this.
- **active** — make its models available for placing and picking. (Disabled until the pack is loaded.)

Click the **▸** to expand a pack and pick a **subset** of its models — each
member row shows a body-color swatch, the model's name, and its real length in
metres. Leave them all checked to keep the whole pack.

| Pack | Models | Where it's used | On by default |
|---|---|---|---|
| Aircraft ▸ Military ▸ Historical (WWI–WWII) | 10 | Banner tow | Yes |
| Aircraft ▸ Military ▸ Cold War & Modern | 9 | Banner tow | Yes |
| Aircraft ▸ Civil | 8 | Banner tow | Yes |
| Space ▸ Real | 5 | Banner tow (3) + placeable (2) | Yes |
| Space ▸ Fiction | 4 | Banner tow | **No — opt in** |
| Ground Vehicles ▸ Civil | 9 | Placeable | Yes |
| Ground Vehicles ▸ Military & Historical | 7 | Placeable | Yes |
| Ground Vehicles ▸ Fiction | 8 | Placeable | **No — opt in** |

**Space ▸ Real is the one mixed pack.** Its rockets fly, but the two rovers —
the Apollo Lunar Roving Vehicle and the Perseverance Mars rover — are space
hardware that *drives*, so they place on the ground like any other vehicle and
show up in the Vehicles toolbar tab alongside the pickup truck.

The two **Fiction** packs are affectionate nods to vehicles you'll recognize
from film and television, described generically rather than by name. They ship
switched off; load them if you want a chrome time-traveling sports car in the
garage.

**Nothing is ever lost by switching a pack off.** A vehicle you've already
placed whose pack is unloaded or deactivated falls back to a plain block, and
its sidebar row tells you why. Turn the pack back on and the model returns.

### Parking one on the plan

Loaded, active **ground** packs add a **Vehicles (🚙)** tab to the placement
toolbar. (It's a different tab from the older **Vehicle (🚗)** one, which holds
the generic garage car and EV charger described in
[Devices & bindings](devices.html).) The tab is hidden entirely while no ground
pack is on.

Click a card, then click the plan to drop it. From there a vehicle is **ordinary
furniture**: drag it, rotate it, resize it, lock it, label it, and it blocks
figures' paths like any other object. Its sidebar editor shows a **Model** row
(the model name and which pack it came from) in place of the usual kind
dropdown.

Every model is built at its **real size**, so a semi truck really does dwarf the
motorcycle beside it, and a tank fills a driveway.

- **Ground ▸ Civil** — pickup truck, SUV, school bus, city transit bus, semi truck & trailer, fire engine, ambulance, police cruiser, and a cruiser motorcycle.
- **Ground ▸ Military & Historical** — a brass-era antique car, a classic round-bodied compact, a classic split-window van, a Willys MB Jeep, an HMMWV, and the M4 Sherman and M1 Abrams tanks.
- **Ground ▸ Fiction** — eight famous silhouettes, generically described (the newest is a black-and-white ex-police sedan).
- **Space ▸ Real** — the Apollo Lunar Roving Vehicle and the Perseverance Mars rover.

That's **26 placeable models** in all.

### Towing the banner

The aircraft packs — and the rockets in Space ▸ Real — have no ground
footprint: they fly. Their home is
the **Aircraft** dropdown on a **Banner plane** entry in
**Settings ▸ Display ▸ Background text** (see
[Weather, sky & geo](outdoor-weather.html) for background text itself).

The dropdown starts with four built-in groups — **Toy plane & airliners**
(the classic toy plane plus the eight silhouettes the flight tracker uses),
**Military & NASA**, **Fiction**, and **News** (the news helicopter, which used
to be a mode of its own and is now simply another aircraft you can pick).

Below those, **every loaded, active aircraft or space pack adds its own group**,
labelled with its place in the tree. Because the four base aircraft/space packs
are on out of the box, the dropdown ships with warbirds, airliners and rockets
already in it; only Space ▸ Fiction needs loading first.

- **Rockets fly upright.** The Saturn V, the Apollo Lunar Module and the Falcon 9 orbit standing on their tails, spinning slowly about their own axis, with the banner towed from the hull rather than a hundred metres astern.
- If a saved entry points at a model whose pack you've since switched off, it quietly falls back to the classic toy plane — your choice is remembered and comes back with the pack.

Every one of them has a turntable on the
[Flying models gallery page](../models/flying-models.html), in the same order
the dropdown offers them.

#### Painting it

Banner-plane and message-train entries have five color rows. Each one starts on
the shipped paint (a vehicle-pack craft starts on **its own livery**), shows
`default` until you change it, and has a **✕** to put it back.

| Color | Banner plane | Message train |
|---|---|---|
| **Vehicle color** | Fuselage | Engine and car bodies |
| **Accent color** | Wings and tail | Trim, roof, chimney, wheels, and the darker last car |
| **Banner background** | The banner cloth | The sign panel on the car sides |
| **Banner text color** | The lettering | The lettering |
| **Banner frame** | The trim stripes framing the banner | The same stripes on the sign |

### Skins for real aircraft overhead

If you have [flight tracking](neighborhood-flights.html) on, **Military
aircraft skins** (a checkbox in the flight-tracking settings, on by default)
draws aircraft that really *are* an F-16, F-22, A-10, B-2, B-52 or Apache with
that silhouette instead of the generic model.

Diorama decides from the feed: the aircraft's **type designator** first, then a
heavy-fighter **category**, then a helicopter that the database flags as
military.

A skinned aircraft is scaled to the same envelope as the generic model it
replaces, so its label, status beacon, speed trail and contrail all sit exactly
where they would otherwise — only the shape changes. Skins keep their own
markings, so the callsign stays on the label plate rather than on the fuselage.
Turn the setting off to put every aircraft back on the generic body.
