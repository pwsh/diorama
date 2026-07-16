# Franchise pack: Star Trek — Deep Space Nine (DS9) crew

**Hierarchy path**: `docs/avatars/sci-fi/star-trek-ds9.md` — a franchise pack
under `docs/avatars/sci-fi/`. These are stylized geometric toon homage
figures (Sims-style minifigures inspired by the show's silhouettes and
color-coding) — no likenesses, no logos, no copyrighted insignia geometry.
Every member below uses a **descriptive-generic label** for in-app display;
the actual character name lives only in the Reference line of this doc.

## Overview

Eight members, all built on the standard humanoid rig (`sk`/`headR`/
`headShape`/`limbR`/`skin`/`body`/`shoe`/`emI`/`hands`/`eyes`/`steel`/`armL`/
`legL`/`footMul`/`legColor`) — no quadrupeds in this pack. All adult, `sk:
1.0`, `headR: 126`, `headShape: 'sphere'` unless noted.

**Shared style/palette — the DS9 uniform**: the mid-1990s two-piece
Starfleet jumpsuit (distinct from TNG's one-piece) reads as **mostly black**
(torso, sleeves, legs) with a **colored shoulder/collar yoke** signaling
division — command red, operations gold/mustard, sciences-and-medical
teal. The rig has no dedicated shoulder-color anchor (see Rig gaps), so
every Starfleet member here uses the same workaround: `body` stays near-black
(`0x18181c`), and a **collar-yoke accessory** — a thin curved band/box pair
at the `chest` anchor, offset up toward the neckline and wrapped slightly
onto the shoulders (`x = ±TORSO_W·0.55`, `y = shoulderY`) — carries the
division color. A small grey turtleneck sliver (`face`/`chest` anchor edge)
hints at the undershirt collar. `shoe: 0x0d0d10` (black boot) for every
Starfleet member. Non-Starfleet members (the constable, the bartender, the
first officer's Bajoran Militia uniform) use their own real-world palette
instead of the division scheme.

**Division color key** (used as the collar-yoke hex below):
- Command: `0x8b1a1a` (red)
- Operations/Engineering: `0xb8860b` (mustard-gold)
- Science/Medical: `0x2f6f6f` (teal)

**Shared technique — Bajoran nose ridge**: both Bajoran members (the first
officer, and by extension any future Bajoran add-on) get the same small
`face`-anchor nose-bridge accessory — a shallow wide box straddling the nose,
skin-toned but 1 shade darker, ~6 mm proud — approximating the ridged nasal
bridge without a new head shape.

## Members

### 1. `ds9-captain-command` — Captain (command red)

**Reference**: Captain (later station commander) Benjamin Sisko — a Black
Starfleet officer, bald or close-cropped in later seasons, with a
signature goatee; wears command-red Starfleet duty uniform and later the
grey/black First Contact-era jacket. This pack uses the classic red-collar
look he wears for most of the show's run.

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0,
skin: 0x6e4a30,   // dark brown skin, toon-saturation-pushed
body: 0x18181c,   // near-black DS9 jumpsuit
shoe: 0x0d0d10,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.0, legL: 1.0
```

**Accessories**:
- Collar yoke (×2, mirrored): box, `chest` anchor, `x = ±TORSO_W·0.55`, `y = shoulderY`, thin curved band ~150×40×30 mm, `0x8b1a1a` (command red).
- Undershirt sliver: thin box, `chest` anchor at the neckline, `0x8a8a8f` (grey).
- Goatee: small flattened box, `face` anchor at the chin, `0x1a1a1a` (near-black, matching a shaved head/goatee combo), ~40×25×15 mm.
- (No hair accessory — bald head; skin-colored scalp is the default sphere.)

**Silhouette check**: bald head + goatee is the one cue that reads at 30 px
even before the red collar registers up close.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 }` — steady, commanding, no exaggeration.
**Bubbles**: `☕ ⚾ 🖖 📖`

---

### 2. `ds9-first-officer-bajoran` — First Officer (Bajoran Militia)

**Reference**: Major (later Colonel) Kira Nerys — Bajoran liaison officer and
station first officer. Brown bob haircut, nose-ridge, and the signature
right-ear Bajoran earring (d'ja pagh). Wears the Bajoran Militia uniform,
NOT a Starfleet jumpsuit: a maroon/crimson top with a grey-tan diagonal
panel across the chest and khaki-toned trousers.

**Spec**:
```
sk: 0.95, headR: 122, headShape: 'sphere', limbR: 0.95,
skin: 0xd9a066,
body: 0x7a1f2b,       // Bajoran Militia crimson
legColor: 0x9c8a5e,   // khaki militia trousers
shoe: 0x3a2e20,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.95, legL: 0.95
```

**Accessories**:
- Diagonal chest panel: flattened box, `chest` anchor, angled (`rot.z ≈ 0.5`), running shoulder-to-hip, ~200×80×15 mm, `0x9c8a5e` (grey-tan) — approximates the militia uniform's signature diagonal seam.
- Nose ridge: shallow wide box, `face` anchor straddling the nose, ~30×10×8 mm, `0xc48a52` (skin −1 shade), 6 mm proud.
- Bajoran earring: small dangling chain of 2 tiny spheres + 1 thin ring, `head` anchor at the RIGHT ear only, ~8 mm each, brushed silver (`steel`-look hex `0xb8bcc2`).
- Hair: bob-shaped accessory, `crown` anchor, a squashed sphere hugging the skull to jaw-line, `0x4a3222` (brown).

**Silhouette check**: the diagonal grey-tan chest panel against the deep
crimson is a strong, un-Starfleet silhouette on its own; the ear glint seals
it up close.

**Personality**: `{ bobMul: 1.1, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.1 }` — brisk, no-nonsense soldier's stride.
**Bubbles**: `🙏 ⚔️ 🕯️ 📿`

---

### 3. `ds9-constable-shapeshifter` — Security Chief (shapeshifter constable)

**Reference**: Odo, the station's security chief — a shapeshifter whose
"regenerated" humanoid form has smooth, faintly unfinished features (no
visible ears, minimal brow definition, an amber/waxy skin tone) and
distinctively sculpted, immobile swept-back hair molded in one solid
piece. Wears the Bajoran security uniform: brown/tan two-piece with a
tan collar, no rank insignia.

**Spec**:
```
sk: 1.0, headR: 124, headShape: 'sphere', limbR: 0.95,
skin: 0xc9915a,   // amber/waxy shapeshifter skin
body: 0x6b4f30,   // brown Bajoran security uniform
legColor: 0x8a6a45,
shoe: 0x3a2a18,
emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.95, legL: 0.95
```

**Accessories**:
- Tan collar: thin box, `chest` anchor at the neckline, ~150×30×20 mm, `0x9c8a5e`.
- Sculpted hair: ONE smooth dome accessory (not a hairline part), `crown` anchor, a slightly flattened sphere hugging the skull back-to-front with no side gaps, `0x8a6a45` (dull dark-blond/grey), giving the "molded in one piece" look. No ear accessories (Odo's ears are famously vestigial/absent under the hair).
- (No face accessory — the smooth, faintly featureless look is better served by leaving brow/nose plain; standard `dots` eyes stay slightly under-emphasized by omission of brow/nose extras used on other members.)

**Silhouette check**: the single seamless hair-dome (no strand separation,
no side hair) plus the flat amber skin tone is the tell — it should look
subtly "unfinished" next to the more detailed human hair on other members.

**Personality**: `{ bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.8 }` — stiff, minimal, faintly inhuman economy of motion.
**Bubbles**: `🪣 🔍 🧴 😐`

---

### 4. `ds9-bartender-ferengi` — Bartender (Ferengi entrepreneur)

**Reference**: Quark, owner of the station's bar — a Ferengi, marked by
huge scalloped ears, a bald ridged head, small sharp teeth, orange-brown
skin, and a taste for gaudy, richly layered multi-tone jackets/vests over
a slight, stooped frame.

**Spec**:
```
sk: 0.85, headR: 108, headShape: 'sphere', limbR: 0.8,
skin: 0xb5651d,   // orange-brown Ferengi skin, saturation-pushed
body: 0x5a3620,   // brown base jacket
shoe: 0x2a1a10,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.85, legL: 0.8
```

**Accessories**:
- Ears (×2, mirrored) — **the defining feature**: large flared cone or scalene-box shapes, `head` anchor at the temple, ~110×140×30 mm each, angled outward and slightly forward, skin-tone matched (`0xb5651d`).
- Vest/collar layer: box, `chest` anchor, a contrasting green-patterned panel, ~120×90×15 mm, `0x3d5a2e`.
- Gold clasps: 2–3 tiny spheres, `chest` anchor in a vertical row, `0xc9a227` (gold), `emI: 0.1`.
- Head ridges: 2 small flattened boxes, `crown` anchor, running the sagittal midline of the bald scalp, `0xa8763f` (skin +1 shade darker), ~40×8×6 mm each.

**Silhouette check**: the two huge flared ears against a short (`sk 0.85`),
slightly stooped frame is unmistakable at any size — bigger ears than any
other member in any pack.

**Personality**: `{ bobMul: 0.9, swayMul: 1.3, cadenceMul: 1.2, ampMul: 1.0 }` — quick, fidgety, faintly furtive haggler's energy.
**Bubbles**: `💰 🍺 📊 😏`

---

### 5. `ds9-science-officer-trill` — Science Officer (Trill)

**Reference**: Lieutenant Commander Jadzia Dax — a joined Trill science
officer, marked by a double row of dark spots running from the temple down
the side of the neck (the Trill's signature symbiont marking), dark hair,
and the teal/science-medical division uniform.

**Spec**:
```
sk: 0.95, headR: 122, headShape: 'sphere', limbR: 0.9,
skin: 0xe8b891,
body: 0x18181c,
shoe: 0x0d0d10,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 0.95, legL: 0.95
```

**Accessories**:
- Collar yoke (×2): box, `chest` anchor, `x = ±TORSO_W·0.55`, `y = shoulderY`, ~150×40×30 mm, `0x2f6f6f` (science teal).
- Trill spots: a chain of 5–6 tiny flattened spheres (~7 mm each), `head` anchor, running from the temple down the jawline to the side of the neck in a gentle curve, dark brown (`0x3a2418`), 2–3 mm proud — an approximation of the mottled marking (see Rig gaps: no true speckle/decal primitive).
- Hair: sleek shoulder-length accessory, `crown` + `head` anchors, a smooth tapered form, `0x2a1a12` (dark brown/black).

**Silhouette check**: the dotted spot-trail down the neck is the specific
tell (nothing else in this pack has it); teal collar plus long dark hair
narrows it further.

**Personality**: `{ bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.1, ampMul: 1.05 }` — confident, athletic, warm energy.
**Bubbles**: `🎲 ⚔️ 🔬 😄`

---

### 6. `ds9-doctor` — Chief Medical Officer

**Reference**: Doctor Julian Bashir — young, dark-haired Starfleet medical
officer, clean-shaven, wearing the teal/medical division collar (shared
hex with science in this era).

**Spec**:
```
sk: 1.0, headR: 124, headShape: 'sphere', limbR: 0.95,
skin: 0xc48a5b,
body: 0x18181c,
shoe: 0x0d0d10,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.0, legL: 1.0
```

**Accessories**:
- Collar yoke (×2): box, `chest` anchor, `x = ±TORSO_W·0.55`, `y = shoulderY`, ~150×40×30 mm, `0x2f6f6f` (medical teal — same hex as science; the two divisions share the color in this era).
- Hair: short cropped accessory, `crown` anchor, a low dome hugging the scalp, `0x2a1a12` (dark brown).
- Medical tricorder prop (optional, held not worn): small box + antenna nub, `hand` anchor, `0xb0b4ba` (light grey), tiny `c.accent`-colored status light.

**Silhouette check**: on its own this member is the most "generic
Starfleet" in the pack (short dark hair, teal collar, no distinguishing
prosthetic) — deliberately, since he's human; the held tricorder prop is
the extra tell that reads as "doctor" rather than any other teal-collar
crewmember.

**Personality**: `{ bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 0.95 }` — brisk, precise, faintly eager.
**Bubbles**: `💉 🔬 📚 🎯`

---

### 7. `ds9-strategic-ops-klingon` — Strategic Operations Officer (Klingon)

**Reference**: Lieutenant Commander Worf — a Klingon Starfleet officer who
joins the station in later seasons. Marked by a heavily ridged forehead
running to the bridge of the nose, long dark hair, a Klingon sash (baldric)
worn diagonally over the Starfleet uniform, and the command-red collar
(Strategic Operations is a command-track post).

**Spec**:
```
sk: 1.05, headR: 128, headShape: 'sphere', limbR: 1.1,
skin: 0xa9744f,   // ruddy tan Klingon skin tone
body: 0x18181c,
shoe: 0x0d0d10,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.05, legL: 1.0
```

**Accessories**:
- Collar yoke (×2): box, `chest` anchor, `x = ±TORSO_W·0.55`, `y = shoulderY`, ~150×40×30 mm, `0x8b1a1a` (command red).
- Forehead ridges: a row of 4 small flattened boxes, `face`/`crown` boundary anchor, running from the brow up over the crown midline, graduated size (largest at the brow), `0x8a5f3f` (skin −1 shade, deep grooves), ~30×10×8 mm each — the pack's one true prosthetic silhouette element.
- Klingon sash (baldric): a flattened cylinder or long thin box, anchored at `back` and wrapping to `chest` (diagonal, `rot.z ≈ 0.6`), dark leather-brown (`0x2a1810`) with a small metal disc ornament (`0x8a8a90`, `steel`-tint) at the chest crossing point.
- Hair: longer, fuller accessory than the other members, `crown` + `head` anchors, waved/layered form, `0x1a1210` (near-black).

**Silhouette check**: the graduated forehead-ridge row is the unmistakable
cue, readable in profile even at 30 px; the diagonal sash reinforces
"not a standard human officer" from any angle.

**Personality**: `{ bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.9, ampMul: 1.15 }` — heavy, deliberate, powerful gait.
**Bubbles**: `⚔️ 🩸 🍖 😤`

---

### 8. `ds9-engineer` — Chief of Operations (engineer)

**Reference**: Chief Miles O'Brien — Starfleet NCO turned station chief of
operations, marked by a mustache, sandy-brown hair, and the operations
(gold/mustard) division collar. An everyman, hands-on engineer look —
often shown with a tool or padd prop.

**Spec**:
```
sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0,
skin: 0xd9a878,
body: 0x18181c,
shoe: 0x0d0d10,
emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
armL: 1.0, legL: 1.0
```

**Accessories**:
- Collar yoke (×2): box, `chest` anchor, `x = ±TORSO_W·0.55`, `y = shoulderY`, ~150×40×30 mm, `0xb8860b` (operations mustard-gold).
- Mustache: thin flattened box, `face` anchor just above the mouth, ~35×8×6 mm, `0x8a6a44` (sandy brown).
- Hair: short accessory, `crown` anchor, low dome, `0x9a7a50` (sandy brown).
- Engineering tool prop (optional): small box + cylinder "spanner", `hand` anchor, `0x8a8a90` (grey-steel).

**Silhouette check**: the mustache is the single feature distinguishing him
from the doctor at a glance (both are the "everyman human" build); the
mustard collar confirms operations division over medical's teal.

**Personality**: `{ bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 }` — steady, workmanlike, no exaggeration.
**Bubbles**: `🔧 🍻 🎣 🛠️`

---

## Rig gaps

1. **No dedicated shoulder/collar-yoke anchor.** Every Starfleet member in
   this pack (6 of 8) needs a division-colored band that wraps the
   shoulder/collar line, not a flat chest patch. This doc approximates it
   with a mirrored pair of `chest`-anchor boxes offset to `±TORSO_W·0.55`
   at shoulder height — workable, but every future Star Trek-era pack (TOS,
   TNG, Voyager, Enterprise, movies) will hit the exact same need. A true
   `shoulder` anchor (auto-mirrored L/R, pinned to the shoulder pivot,
   ideally able to wrap partially around the upper arm the way a real yoke
   does) would remove this repetition — this is the same gap the base
   `sci-fi` pack (`docs/avatars/base/scifi.md`) already flagged for its
   `space-marine` pauldrons; DS9 is a second, independent pack hitting it,
   which raises its priority.
2. **No speckle/mottle decal primitive for skin markings.** The Trill
   spot-trail is approximated as a chain of tiny flattened spheres along the
   `head` anchor. It reads fine at typical in-scene scale but is fiddlier
   to author (5–6 separately positioned primitives) than a single
   parametrized "spot pattern along a curve" helper would be. Low priority —
   only recurs for Trill-adjacent characters — but worth a note since this
   pack is the second dotted-marking case in the docs (compare freckle-style
   asks elsewhere) and a shared helper would pay off if a third comes along.
3. **No graduated-ridge helper for cranial prosthetics.** Worf's forehead
   ridges and Ferengi head ridges are both built as manually-sized/positioned
   box rows. It works with the existing primitive set (no new shape needed),
   but a "ridge row" helper (N boxes auto-spaced/auto-graduated along a
   curve) would reduce hand-tuning for any future Klingon/Cardassian/
   Ferengi/Bajoran-adjacent character. Flagged as a convenience gap, not a
   capability gap — nothing here is blocked without it.

None of these gaps blocked building this pack; all eight members are fully
expressible with the current rig via the workarounds above.

## Sources

- [Star Trek uniforms — Wikipedia](https://en.wikipedia.org/wiki/Star_Trek_uniforms)
- [Starfleet uniform (2370s-early 2380s) — Memory Alpha](https://memory-alpha.fandom.com/wiki/Starfleet_uniform_(2370s-early_2380s))
- [You Wear It Well: The Uniforms of Star Trek](https://www.startrek.com/news/you-wear-it-well-the-uniforms-of-star-trek)
- [Forgotten Relics 11: Star Trek Deep Space Nine ODO costume](https://thepropstop.wordpress.com/2010/09/20/forgotten-relics-11-star-trek-deep-space-nine-odo-costume/)
- [Bajoran Militia uniform — Memory Alpha](https://memory-alpha.fandom.com/wiki/Bajoran_Militia_uniform)
- [Deep Space Nine: Why the Dominion Founders Chose to Look Like Odo — CBR](https://www.cbr.com/star-trek-deep-space-nine-dominion-founders-odo-appearance/)
- [Quark (Star Trek) — Wikipedia](https://en.wikipedia.org/wiki/Quark_(Star_Trek))
- [Design Appreciation: the costumes of Star Trek: Deep Space Nine — Den of Geek](https://www.denofgeek.com/tv/design-appreciation-the-costumes-of-star-trek-deep-space-nine/)
- [Kira Nerys — Memory Alpha](https://memory-alpha.fandom.com/wiki/Kira_Nerys)
- [Star Trek DS9 Major Kira Bajoran Earring & Nose Bridge Prop Set](https://picclick.com/Star-Trek-DS9-Major-Kira-Bajoran-Earring-380611186792.html)
- In-repo precedent: `docs/avatars/base/scifi.md` (`space-marine` pauldron
  workaround, shoulder-anchor gap already flagged there); `src/three-renderer.ts`
  (`AVATAR_SPECS`, `AVATAR_PERSONALITY`, `AVATAR_BUBBLES`, `_buildHumanoid`
  accessory switch) as the implementation target this doc specs for.
