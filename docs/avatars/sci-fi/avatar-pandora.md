# Franchise pack: Avatar (Pandora)

**Hierarchy path**: `Sci-Fi / Avatar` — a franchise pack under `docs/avatars/sci-fi/`
(sci-fi genre beats medium — Firefly/Stranger Things precedent). These are
stylized geometric toon homage figures (Sims-style minifigures inspired by
the films' color-coding and costuming) — no likenesses, no logos, no
copyrighted creature-design geometry beyond silhouette/color/build. Every
member below uses a **descriptive-generic label** for in-app display; the
actual character name lives only in the Reference line of this doc.

## Overview

- **Group**: the primary Na'vi and human/RDA cast of James Cameron's *Avatar*
  (2009) — the franchise's original, best-known ensemble.
- **Member count**: 7
- **Rig**: humanoid only (Na'vi are bipedal; their tail is a static
  `tailbone` accessory, not a separate quadruped rig).
- **packId**: `avatar-pandora` · **path**: `['Sci-Fi', 'Avatar']` · **label**:
  "Avatar (Pandora)".
- **Pack-wide `base` proposal — the shared Na'vi body** (applies to the four
  Na'vi members only; the three human/RDA members override nearly every
  field back to human proportions — see the merge note below):
  ```
  rig: 'humanoid'
  humanoid: {
    sk: 1.2,                 // capped WELL below the lore-accurate ~1.7×
                              // ratio (Na'vi read ~3 m / ~9-10 ft vs. a
                              // ~1.75 m human baseline) — see "cap
                              // rationale" below
    headR: 128,
    headShape: 'oval',        // elongated Na'vi skull silhouette
    limbR: 0.85,              // slender, lithe limbs despite the height —
                              // Na'vi are tall but NOT bulky
    skin: 0x2a8fa3,           // cyan-blue base skin (see "skin hex" note)
    body: 0x2a8fa3,
    legColor: 0x2a8fa3,
    shoe: 0x2a8fa3,           // barefoot — no separate footwear tone
    hands: 'sphere',
    eyes: 'almond',           // closest existing style to large Na'vi eyes
                              // (color stays the rig default — see Rig gaps)
    emI: 0.03,                // faint all-over bioluminescent-skin catch-light
    earSkip: true,            // suppress the generic round humanoid ears —
                              // Na'vi use a dedicated pointed-ear accessory
                              // instead (see "shared Na'vi accessory set")
    armL: 1.05,
    legL: 1.1,
    footMul: [0.9, 0.9, 1.15] // long, narrow, faintly elongated bare feet
  }
  ```
  **Cap rationale**: real Na'vi are described at ~3 m (9-10 ft) vs. a ~1.75 m
  human — a literal ratio would put `sk` around 1.7 (the same math the
  `star-wars-ot.md` Chewbacca entry uses for its `sk: 1.32` ≈ 2.3 m note).
  But this app's walls build at a fixed 2743 mm (9 ft) `full` wall height,
  and a true ~3 m rig would clip through ceilings and break nav/gait at an
  untested scale (the documented sk-floor precedent runs the other
  direction — sk 0.45 for small creatures — but the humanoid rig also
  tolerates `sk` values above 1 for tall figures, as the Chewbacca/Hulk/
  Groot-scale entries across other packs already demonstrate, none of them
  pushed past ~1.5). `sk: 1.2` keeps Na'vi the tallest, most imposing
  silhouettes in this pack — clearly towering over the human RDA members at
  `sk` ~0.95–1.05 — while staying inside the tested/nav-safe range other
  packs already rely on.
- **Skin hex**: no single official swatch is published; canon describes the
  Na'vi as cyan-blue with clan variation (greener-cyan for oceanic Metkayina,
  deeper blue for jungle-dwelling Omatikaya) from a fictional "cyanin"
  pigment. `0x2a8fa3` (a mid cyan-teal-blue) is this doc's pick, kept
  IDENTICAL across all four Na'vi members by design — canon distinguishes
  them by hair/costume/props, not skin-tone variation, so this pack does the
  same (see "Distinguishing the Na'vi members" below).
- **Shared Na'vi accessory set** (repeated in EACH Na'vi member's own
  `accessories` list, not left in `base.accessories` — see the merge-order
  note immediately below):
  - **Pointed ears**: 2 small cones on the `head` anchor (mirrored ±x),
    ~16×34×16 mm, skin-tone (reuses the exact recipe `pop-culture/movies-
    lotr.md` already used for Legolas's elf ears — no new gap).
  - **Tail**: a 2-segment tapering cylinder chain on `tailbone`
    (~30×260 mm → ~18×220 mm), skin-tone, hanging down and slightly back —
    the "long, sweeping tail" signature; static (see Rig gaps).
  - **Queue** (the neural braid/"kuru"): a tapering cylinder on `crown`
    trailing down behind the head to the upper back, black `0x14100c`,
    plus a small tip accent (bead or feather, member-specific) — the same
    chained-cylinder-off-`crown` idiom `cartoons/disney-princess.md` used
    for the Tower Girl's floor-length braid, scaled down.
  - **Faint markings**: Na'vi canon layers two things onto the base skin —
    darker tiger-stripe patterning and a scatter of tiny bioluminescent
    "freckle" dots. Both are handled per the existing pattern/decal
    convention (proud solid-color patches, not a true print) and are
    trimmed per-member to fit the ≤10-primitive budget — see each entry.
- **IMPORTANT merge-order note for the pack module author**: `avatars.ts`'s
  base-merge is `accessories: a.accessories ?? base.accessories` — a
  member's OWN `accessories` array (if present) fully REPLACES `base`'s, it
  does not concatenate. Since every Na'vi member here needs member-specific
  accessories anyway (weapon, jewelry, headdress...), `base.accessories`
  would silently never apply to any of them. **The shared Na'vi accessory
  set above must be repeated inline in each of the four Na'vi members' own
  `accessories` arrays**, not hoisted into the pack's `base`. This is a
  design decision worth the orchestrator/implementer's attention — it's the
  reason each Na'vi member's accessory list looks longer than a typical
  pack member's despite sharing one visual identity.
- **Distinguishing the Na'vi members** (same skin, same base body): Jake
  carries a bow + a small RDA dog-tag pendant (his one holdover from being
  human — a deliberate story detail, not a mistake); Neytiri carries a bow +
  a feathered/beaded queue tip + a beaded choker + a single freckle-dot
  accent; Tsu'tey carries a spear (not a bow, to avoid a silhouette clash
  with Jake/Neytiri) + a diagonal quiver strap + a warpaint stripe; Mo'at
  carries a feathered headdress (by far the tallest head silhouette in the
  pack) + a bone/teeth necklace + a walking staff and skips the tail/queue
  tip embellishments to make budget room for the headdress. Build/size also
  varies slightly (Tsu'tey biggest at `sk 1.25`, Mo'at/Neytiri at `1.15`).
- **Human/RDA members override the base almost entirely**: Grace, Quaritch,
  and Trudy each restate `sk`/`headR`/`headShape`/`limbR`/`skin`/`body`/
  `legColor`/`shoe`/`eyes`/`emI`/`earSkip`/`armL`/`legL`/`footMul` back to
  ordinary human values (only `hands: 'sphere'` survives unchanged from
  `base`) — consistent with the schema (`{...base, ...member}` shallow
  merge per field) but worth noting since it means `base` mainly pays off
  for the 4/7 Na'vi members, exactly as the pack brief asked for ("propose
  a base for the shared Na'vi body and note which members override it").
- **Member-selection notes**: trimmed to the 2009 film's primary seven —
  the two Na'vi leads (Jake, Neytiri), the two next-most-recognizable Na'vi
  (Mo'at the clan's spiritual leader, Tsu'tey the rival-turned-co-leader
  warrior), and three human/RDA figures spanning the film's other camps
  (Grace the scientist, Quaritch the antagonist, Trudy the pilot-turned-
  defector). *The Way of Water* (2022) leads (Kiri, Lo'ak, Ronal, Tonowari)
  were considered and **trimmed**: none test as more casually recognizable
  than the seven above, and the 2009 line-up alone already fills a
  comfortable 7-of-12 budget without stretching for a second film's cast —
  matching the brief's own steer ("probably trim"). Also omitted: Norm
  Spellman (secondary scientist, overshadowed by Grace), Dr. Max Patel,
  Selfridge (RDA administrator — recognizable but a suit, not a visual
  read), Eytukan/Sylwanin (Neytiri's father/sister, minor screen time),
  and the Na'vi/RDA rank-and-file. Nine sat comfortably in range at 12 but
  7 keeps this pack tight around the names a casual fan actually lists
  first; a "Way of Water" follow-on pack (path level 3) remains open if
  that film's cast is ever wanted independently.
- **Recurring accessory idiom — the diagonal strap**: Tsu'tey's quiver
  baldric reuses the chest→hip rotated-box approximation already flagged in
  `sci-fi/firefly.md`, `sci-fi/star-trek-tng.md`/`star-trek-ds9.md`, and
  `sci-fi/stranger-things.md` (Dustin's backpack strap) — a FIFTH
  independent pack hitting this same need.
- **Recurring accessory idiom — dominant-solid-color pattern patches**: the
  RDA digital-camo pattern (four-tone pixel-block print, per costume
  references) and the Na'vi stripe/freckle markings are both approximated as
  a few flat solid-color patches rather than a true print/scatter texture —
  the same class of gap already flagged in `firefly.md` (Wash's Hawaiian
  shirt), `star-trek-ds9.md` (Trill spots), and `stranger-things.md`
  (Lucas's camo headband) — a FOURTH+ pack hitting this; this pack keeps
  RDA costumes mostly SOLID olive/khaki rather than multi-patching a camo
  print purely for texture's sake, since the uniform silhouette/color block
  is already doing the identifying work.
- **Reused eyewear approximation**: Grace's glasses reuse the thin-ring-on-
  `face` approximation already established across many packs (`pop-culture/
  movies-harry-potter.md` flagged the underlying "no dedicated eyewear
  anchor" gap first; over a dozen packs since have reused the same
  workaround) — not re-flagged here as a new gap.
- **Already-parked gap reused, not re-flagged**: large amber/yellow
  Na'vi eyes map to the closest existing style (`eyes: 'almond'`) but the
  rig has no per-avatar iris-color override — already covered by
  `docs/ROADMAP.md` § "Avatar rig gaps" ("Extra eye styles ... eye color
  overrides"). See Rig gaps for a one-line pointer, not a new entry.

## Members

### 1. `navi-clan-leader` — "Adopted clan leader (Na'vi form, bow, dog-tag pendant)"

**Reference**: Jake Sully — a paraplegic former Marine who pilots a Na'vi
avatar body for the RDA's Avatar Program, is adopted into the Omatikaya
clan, bonds with a banshee (ikran), and ultimately leads the Na'vi against
the RDA. Signature look in Na'vi form: the shared cyan-blue Na'vi build, a
simple hunter's loincloth/wrap, a bow, and — a small character detail this
pack keeps — he's occasionally shown still wearing his human dog tags even
in his avatar body, a quiet nod to where he came from. (Jake Sully, played
by Sam Worthington.)

**Spec**:
```
sk: 1.2, headR: 128, headShape: 'oval', limbR: 0.85,
skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
armL: 1.05, legL: 1.1, footMul: [0.9, 0.9, 1.15]
```

**Accessories**:
- **Pointed ears**: `head` anchor, 2 cones (mirrored ±x), ~16×34×16 mm,
  skin-tone `0x2a8fa3`.
- **Tail**: `tailbone` anchor, 2-segment tapering cylinder chain
  (~30×260 mm → ~18×220 mm), skin-tone, hanging down/back.
- **Queue**: `crown` anchor, a tapering cylinder ~22×320 mm trailing down
  the back, black `0x14100c`.
- **Dog-tag pendant** (his one distinguishing prop vs. the other Na'vi
  males): `chest` anchor, a small flattened box ~30×40×4 mm, dull steel
  `0x9a9a92`, hanging at mid-chest as if on an unseen cord.
- **Bow** (signature hunter/warrior prop): `handR` anchor, a single long
  thin cylinder ~10 mm r × 900 mm, wood-brown `0x5a3a20`, held vertically —
  approximated straight (see Rig gaps: no curved-bow geometry, same gap
  `cartoons/disney-princess.md`'s Archer entry already flagged).

**Silhouette check**: the shared Na'vi cyan-blue build plus a held bow is
common to two other members here — the dog-tag pendant at the chest is
Jake's unique tell (nobody else in the pack, human or Na'vi, wears one),
readable as a small dark rectangle against the blue chest even at 30 px.

**Personality**: `{ bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.05 }`
— adapting confidence, a warrior still learning the role.
**Bubbles**: `🏹 🦅 💙 🌳` (the bow, his ikran bond, devotion to Neytiri, his
growing connection to Eywa/the forest)

---

### 2. `navi-huntress` — "Na'vi huntress (feathered queue, beaded choker, bow)"

**Reference**: Neytiri — the Omatikaya princess and finest young huntress of
her clan, who teaches Jake the Na'vi way and becomes his mate. Signature
look: the shared cyan-blue Na'vi build with tiger-stripe markings, a
dusting of bioluminescent freckle-like markings across her face, thin
braids often decorated with feathers/beads, and a bow. (Neytiri, played by
Zoe Saldaña.)

**Spec**:
```
sk: 1.15, headR: 128, headShape: 'oval', limbR: 0.8,
skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
hands: 'sphere', eyes: 'almond', emI: 0.04, earSkip: true,
armL: 1.0, legL: 1.05, footMul: [0.88, 0.9, 1.15]
```

**Accessories**:
- **Pointed ears**: `head` anchor, 2 cones, ~15×32×15 mm, skin-tone.
- **Tail**: `tailbone` anchor, 2-segment tapering cylinder chain
  (~26×250 mm → ~16×210 mm), skin-tone.
- **Queue with feather accent** (her signature decorated braid): `crown`
  anchor, a tapering cylinder ~20×300 mm, black `0x14100c`, plus a small
  cone "feather" accent at the tip, ~10×60×10 mm, warm red-orange
  `0xb2542a`.
- **Beaded choker**: `chest`/`neck` anchor, a thin band ~140×10×8 mm, bone
  `0xe8dcc4`, with 2–3 tiny sphere bead accents, dark wood `0x3a2a1a`.
- **Bow**: `handR` anchor, same straight-cylinder approximation as Jake's,
  ~9 mm r × 850 mm, wood-brown `0x5a3a20`.
- **Freckle-dot accent** (the bioluminescent facial markings): `face`
  anchor, a single small emissive sphere ~6 mm, pale cyan-white `0xdfffff`,
  `emissiveIntensity` ~0.3 — one accent sphere stands in for the "dusting of
  freckles" description; a true scatter is a pattern-generator gap (see
  Overview and Rig gaps).

**Silhouette check**: the feather-tipped queue + beaded choker is a
combination unique to her among the Na'vi members — Jake's bow-carrying
silhouette is close, but no other member has hair ornamentation, so the two
read apart even at 30 px.

**Personality**: `{ bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 }`
— alert, fluid, huntress-quick.
**Bubbles**: `🏹 🦅 🌺 😤` (the bow, her ikran/banshee bond, Pandora's flora,
fierce independence)

---

### 3. `navi-spiritual-elder` — "Clan spiritual elder (feathered headdress, bone necklace, staff)"

**Reference**: Mo'at — the Omatikaya clan's Tsahìk (spiritual leader),
Neytiri's mother, and the one who interprets Eywa's will for the clan.
Signature look: the shared cyan-blue Na'vi build, an elaborate feathered
headdress marking her spiritual office, and layered bone/tooth necklaces.
(Mo'at, played by CCH Pounder.)

**Spec**:
```
sk: 1.15, headR: 128, headShape: 'oval', limbR: 0.85,
skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
armL: 1.0, legL: 1.05, footMul: [0.9, 0.9, 1.15],
posture: { pitch: 0.06 }   // a slight elder's forward set, subtler than a
                            // hunched stoop — the pack's only Na'vi member
                            // with a static posture bias
```

**Accessories**:
- **Pointed ears**: `head` anchor, 2 cones, ~16×34×16 mm, skin-tone.
- **Tail**: `tailbone` anchor, 2-segment tapering cylinder chain
  (~28×250 mm → ~17×210 mm), skin-tone.
- **Queue** (kept plain — no feather/bead tip, to leave primitive budget
  for the headdress below): `crown` anchor, a single tapering cylinder
  ~20×280 mm, black `0x14100c`.
- **Feathered headdress** (the defining silhouette — by far the tallest
  head profile in the pack): `crown` anchor, a low flattened band
  ~140×30×140 mm, bone `0xe8dcc4`, plus an upright cone "feather plume"
  fan, ~20×160×20 mm, warm red-orange `0xb2542a` — raised + tilted back
  (the crown-clearance idiom) so the front band clears the brow.
- **Bone/tooth necklace**: `chest` anchor, a wide band ~150×14×10 mm, bone
  `0xe8dcc4`.
- **Walking staff** (elder/authority prop): `handR` anchor, a plain
  cylinder ~14 mm r × 950 mm, dark wood `0x3a2a1a`.

**Silhouette check**: the tall feathered headdress is unmistakable at
30 px — no other Na'vi member wears headgear, and paired with the staff it
reads instantly as "elder/spiritual leader" rather than warrior or hunter.

**Personality**: `{ bobMul: 0.85, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.8 }`
— measured, dignified, unhurried.
**Bubbles**: `🙏 🌳 🔮 😌` (invoking Eywa, the sacred forest, spiritual
sight, serenity)

---

### 4. `navi-warrior-scout` — "Na'vi warrior-scout (quiver strap, spear, warpaint)"

**Reference**: Tsu'tey — the Omatikaya clan's finest warrior and
apprentice clan leader, Neytiri's intended before Jake, and Jake's rival
turned co-commander in the final battle. Signature look: the shared
cyan-blue Na'vi build, a notably bigger/more muscular warrior frame than
Jake, a quiver worn diagonally across the chest, and a spear/bow as a
hunter-warrior. (Tsu'tey, played by Laz Alonso.)

**Spec**:
```
sk: 1.25, headR: 128, headShape: 'oval', limbR: 0.95,
skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
armL: 1.1, legL: 1.1, footMul: [0.92, 0.9, 1.15]
```

**Accessories**:
- **Pointed ears**: `head` anchor, 2 cones, ~17×36×17 mm, skin-tone.
- **Tail**: `tailbone` anchor, 2-segment tapering cylinder chain
  (~32×270 mm → ~19×230 mm), skin-tone.
- **Queue** (plain, no ornament — a working warrior's braid): `crown`
  anchor, a single tapering cylinder ~22×300 mm, black `0x14100c`.
- **Diagonal quiver strap** (the diagonal-strap idiom — see Overview):
  `chest`→`hip`, a thin rotated box, dark leather `0x3a281c`, ~14 mm wide,
  rotated ~0.5 rad, with 2 small cylinder arrow-shaft nubs peeking over the
  shoulder.
- **Spear** (deliberately NOT a bow, to avoid a silhouette clash with
  Jake/Neytiri — see Overview): `handR` anchor, a long thin cylinder
  ~12 mm r × 1000 mm, dark wood `0x3a2a1a`, with a small cone spearhead tip,
  `0x9a9a92`.
- **Warpaint stripe**: `chest` anchor, a single proud diagonal box accent,
  ~180×24×4 mm, darker teal `0x1c5f70`, 3 mm proud of the torso.

**Silhouette check**: the biggest, broadest Na'vi build in the pack
(`sk 1.25`, the tallest here), carrying a spear and a diagonal quiver strap
rather than a bow, reads distinctly from both Jake and Neytiri even before
the warpaint stripe registers.

**Personality**: `{ bobMul: 1.0, swayMul: 0.8, cadenceMul: 1.0, ampMul: 1.1 }`
— proud, forceful, a natural second-in-command.
**Bubbles**: `🏹 ⚔️ 🦅 😤` (hunter-warrior skill, combat readiness, his
ikran bond, pride)

---

### 5. `rda-xenobotanist` — "RDA xenobotanist (cropped hair, glasses, field khakis)"

**Reference**: Dr. Grace Augustine — the RDA Avatar Program's founder and
lead xenobotanist, a blunt, dedicated scientist who cares more about
Pandora's ecology than RDA's mining operation. Signature HUMAN-form look
(chosen over her avatar form per this pack's brief — her avatar shares this
pack's Na'vi base almost exactly and reads far less distinctly than her
human self): cropped grey-white hair, glasses, and RDA-issue field/lab
khakis. (Grace Augustine, played by Sigourney Weaver.)

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'sphere', limbR: 0.95,
skin: 0xe0b696, body: 0xb8a878, legColor: 0x8a7a5a, shoe: 0x3a2e22,
hands: 'sphere', eyes: 'dots', emI: 0, earSkip: false,
armL: 0.95, legL: 1.0
```

**Accessories**:
- **Cropped grey-white hair**: `crown` anchor, a short close dome,
  ~126×34×126 mm, `0xd8d4c8`.
- **Glasses** (reused eyewear approximation — see Overview): `face` anchor,
  a thin flattened ring/box, ~90×8×4 mm, dark `0x2a2a2a`.
- **RDA ID patch**: `chest` anchor, a small flattened box, ~40×30×3 mm,
  tan `0xc9bd94` with a thin dark border hint.
- **Field tablet/clipboard** (scientist prop): `handL` anchor, a small
  flattened box, ~90×120×8 mm, dark `0x2a2a2a` with a pale "screen" face
  `0xcfe0d8`.
- **Cigarette** (a well-known personality tic for this character; a plain,
  non-graphic prop, same treatment as other packs' small handheld props):
  `handR` anchor, a tiny thin cylinder, ~3 mm r × 40 mm, off-white
  `0xf0ece0` with a small dark-red ember tip, `0x8a2a1a`.

**Silhouette check**: cropped grey-white hair + glasses + a held tablet is
a combination no other human member shares (Quaritch is buzzed-and-scarred,
Trudy is dark-ponytailed-with-headset) — reads as "the scientist" instantly.

**Personality**: `{ bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85 }`
— brisk, no-nonsense, impatient with bureaucracy.
**Bubbles**: `🌿 🔬 🚬 😤` (xenobotany/Pandora's ecology, science, her
smoking habit, exasperation with RDA)

---

### 6. `rda-security-colonel` — "RDA security colonel (buzz cut, facial scars, dog tags)"

**Reference**: Colonel Miles Quaritch — the RDA's hard-line chief of
security on Pandora and the film's chief antagonist, a career Marine driven
to "get bigger" by design. This entry depicts his ordinary HUMAN/AMP-less
form (not the tall blue recombinant body he receives in the sequels).
Signature look: an extremely muscular build, a high-and-tight buzz cut, and
a trio of scars down the right side of his face/head from a viperwolf
attack on his first day on Pandora. (Miles Quaritch, played by Stephen
Lang.)

**Spec**:
```
sk: 1.05, headR: 128, headShape: 'sphere', limbR: 1.3,
skin: 0xc99268, body: 0x4a4d34, legColor: 0x6b6b5c, shoe: 0x1a1a1a,
hands: 'sphere', eyes: 'dots', emI: 0, earSkip: false,
armL: 1.15, legL: 1.05
```

**Accessories**:
- **Buzz-cut stubble**: `crown` anchor, an extremely thin dome barely
  proud of the scalp (~3 mm, same "reads bald/shorn" idiom `stranger-
  things.md` used for Eleven's buzzed head), grey `0x8a8a80`.
- **Viperwolf scars** (his single most identifying feature): `face`
  anchor, 3 thin dark diagonal marks down the right side of the
  face/scalp, ~30×3×2 mm each, `0x6b3a2a`.
- **Dog tags**: `chest` anchor, a small flattened box on a thin loop hint,
  ~26×36×3 mm, dull steel `0x9a9a92`.
- **Sidearm** (security-chief prop): `hip` anchor, a small holstered box,
  ~30×60×20 mm, dark `0x1c1c1c`.

**Silhouette check**: the pack's single most muscular build (`limbR 1.3`,
by far the biggest arms in the pack) plus the trio of face scars is
unmistakable — nobody else here has visible scarring or this bulk.

**Personality**: `{ bobMul: 0.8, swayMul: 0.5, cadenceMul: 0.85, ampMul: 1.15 }`
— heavy, controlled, aggressive-when-provoked.
**Bubbles**: `🎖️ 💪 😤 🎯` (military command, physical dominance,
short temper, ruthless focus)

---

### 7. `rda-gunship-pilot` — "RDA gunship pilot (dark ponytail, aviators, flight suit)"

**Reference**: Trudy Chacón — an RDA SecOps Samson gunship pilot who flies
for the Avatar Program's science teams and ultimately defects to fight
alongside Jake and the Na'vi in the final battle. Signature look: a
flight-suit uniform, dark hair pulled back, and tactical/aviator eyewear.
(Trudy Chacón, played by Michelle Rodriguez.)

**Spec**:
```
sk: 0.95, headR: 124, headShape: 'sphere', limbR: 0.9,
skin: 0xc78f66, body: 0x707a52, legColor: 0x5c6444, shoe: 0x2a2a2a,
hands: 'sphere', eyes: 'shades', emI: 0, earSkip: false,
armL: 0.9, legL: 0.95
```

**Accessories**:
- **Dark ponytail**: `crown`/`back` anchor, a small tapered sphere-cylinder
  bundle trailing to the collar, ~40×30×90 mm, near-black `0x1c140e`.
- **Flight headset**: `head` anchor, a thin band over the crown plus a
  small earcup, ~140×14×14 mm band + ~26 mm earcup, dark `0x2a2a2a`.
- **Sidearm holster**: `hip` anchor, a small box, ~26×55×18 mm, dark
  `0x2a2a2a`.
- **Flight-suit chest patch**: `chest` anchor, a small flattened box,
  ~36×26×3 mm, tan `0xc9bd94`.

**Silhouette check**: `eyes: 'shades'` (reflective aviators) is unique to
her in this pack, paired with the headset band and dark ponytail — reads
instantly as "pilot" against Grace's bare-eyed glasses look and Quaritch's
bare scarred face.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 }`
— loose, confident, quick to act.
**Bubbles**: `🚁 😎 💥 ❤️` (her gunship, aviator cool, action-ready energy,
her late loyalty turn to Jake's side)

## Rig gaps

1. **No true "curved bow" primitive.** Both Jake's and Neytiri's bows are
   approximated as straight cylinders, same limitation `cartoons/disney-
   princess.md`'s Archer entry already flagged — not a new gap, a repeat
   use case.
2. **No animated tail.** The `tailbone` anchor (landed per the batch-C
   rig-gap triage) gives every Na'vi member a STATIC tail; a believable
   sweeping/swaying tail during walk-cycle motion is still parked under
   "Animated appendages: tail sway..." in `docs/ROADMAP.md` § Avatar rig
   gaps — same gap already noted by `cartoons/shrek.md` and others with
   tails.
3. **No pattern/scatter primitive for freckle-like markings or fabric
   prints.** Neytiri's bioluminescent facial markings are approximated as
   a SINGLE accent sphere rather than a true scatter of dozens of tiny
   dots, and the RDA digital-camo print is skipped entirely in favor of
   solid uniform colors — both fall under the already-parked "fabric
   patterns/prints/decals/text" and "pattern/scatter generator" gaps in
   `docs/ROADMAP.md` § Avatar rig gaps (a further pack hitting this, after
   Firefly/DS9/Stranger Things).
4. **Eye-color override — pointer only, not a new entry.** Na'vi canon
   calls for large AMBER/yellow eyes; the closest rig style is
   `eyes: 'almond'`, which (like every eye style) has no per-avatar iris-
   color field. Already covered by `docs/ROADMAP.md` § "Avatar rig gaps"
   ("Extra eye styles ... eye color overrides").
5. **`base.accessories` doesn't merge with member-level accessories** (see
   the Overview's merge-order note) — not a rig gap exactly, but a pack-
   authoring ergonomics gap worth flagging: a pack with a large shared
   humanoid subgroup (like this one's 4 Na'vi members) can't put ANY
   always-on accessory in `base` if every member also needs its own
   member-specific accessories, since the member array fully replaces
   base's rather than concatenating. A future `avatars.ts` enhancement
   (e.g. `accessories: [...(base.accessories ?? []), ...(a.accessories ??
   [])]`) would let shared body features (ears/tail/queue here) live once
   in `base` instead of being copy-pasted into every Na'vi member's entry.

None of these gaps blocked building this pack; all seven members are fully
expressible with the current rig via the workarounds above.

## Sources

- [Na'vi | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Na'vi)
- [Avatar (species) | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Avatar_(species))
- [How tall are the Na'vi in 'Avatar?' — We Got This Covered](https://wegotthiscovered.com/movies/how-tall-are-the-navi-in-avatar/)
- [Why James Cameron Made the Na'vi People in 'Avatar' Blue — Mental Floss](https://www.mentalfloss.com/entertainment/movies/why-avatar-navi-people-are-blue)
- [Queue | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Queue)
- [The Na'vi Queue | Avatar: The Game Wiki — Fandom](https://avatargame.fandom.com/wiki/The_Na'vi_Queue)
- [Neytiri | Avatar: Initium Wiki — Fandom](https://avatarinitium.fandom.com/wiki/Neytiri)
- [Avatar Deluxe Neytiri Costume for Women — Fun.com](https://www.fun.com/avatar-adult-deluxe-neytiri-costume.html)
- [Tsahìk | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Tsah%C3%ACk)
- [Tsu'tey | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Tsu'tey)
- [Grace Augustine | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Grace_Augustine)
- [Dr. Grace Augustine | Avatar.com Pandorapedia](https://www.avatar.com/pandorapedia/dr-grace-augustine)
- [Miles Quaritch | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Miles_Quaritch)
- [Colonel Miles Quaritch | Avatar.com Pandorapedia](https://www.avatar.com/pandorapedia/colonel-miles-quaritch)
- [Miles Quaritch — Wikipedia](https://en.wikipedia.org/wiki/Miles_Quaritch)
- [Trudy Chacón | Avatar Wiki — Fandom](https://james-camerons-avatar.fandom.com/wiki/Trudy_Chac%C3%B3n)
- [Trudy Chacón | Avatar.com Pandorapedia](https://www.avatar.com/pandorapedia/trudy-chacon)
- [RDA Camouflage | Avatar: Initium Wiki — Fandom](https://avatarinitium.fandom.com/wiki/RDA_Camouflage)
- In-repo precedent: `docs/avatars/pop-culture/movies-lotr.md` (pointed-ear
  `head`-anchor cone recipe, Legolas); `docs/avatars/cartoons/disney-
  princess.md` (long-braid chained-cylinder/sphere `crown` recipe, Tower
  Girl; straight-bow approximation, Archer); `docs/avatars/sci-fi/star-wars-
  ot.md` (Chewbacca's tall-figure `sk` note); `docs/avatars/sci-fi/
  stranger-things.md` (buzzed-head idiom; diagonal-strap and pattern-patch
  gap tally); `docs/avatars/sci-fi/firefly.md`, `star-trek-tng.md`,
  `star-trek-ds9.md` (diagonal-strap precedent); `docs/avatars/pop-culture/
  movies-harry-potter.md` (eyewear-anchor gap origin); `docs/DESIGN-
  avatars.md` § "Rig-gap triage" (confirms `tailbone`, `posture.pitch`, and
  tall-`sk` tolerance are already-landed, not gaps); `docs/ROADMAP.md` §
  "Avatar rig gaps" (fabric patterns, eye-color overrides, animated tails —
  all already parked); `src/avatars.ts` (`mergeBase`/`accessories: a.
  accessories ?? base.accessories` — the merge-order behavior this doc's
  Overview flags); `src/three-renderer.ts` (`AVATAR_SPECS`, `_buildHumanoid`
  accessory switch) as the implementation target this doc specs for.
