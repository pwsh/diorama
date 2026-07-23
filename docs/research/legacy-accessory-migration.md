# Legacy accessory migration inventory

*Source-of-truth for porting the 22 hand-coded `_addAvatarAccessories` kind
blocks (24 `AvatarDef` members across 7 packs + core `adult`) to declarative
`AvatarPrimitive[]`, then deleting `_addAvatarAccessories` and
`LegacyAvatarKind` entirely. Written from `src/three-renderer.ts` (function
spans `_addAvatarAccessories` lines 15944–16322, `_addDeclarativeAccessories`/
`_buildPrimitiveMesh`/`anchorOf` lines 16332–16550, the humanoid build
`_buildHumanoid` lines 17460–18052), `src/avatars.ts` (schema), and every
`src/avatar-packs/*.ts` file that references `legacyAccessories`. All numbers
are resolved at each member's ACTUAL `sk`/`headR` (not just sk=1) so a coding
agent can author final primitives without re-deriving rig math.*

## How to read this doc

- **Formula** columns quote the exact expression from `_addAvatarAccessories`.
- **Resolved (mm/rad)** columns plug in that member's real `sk`, `headR`,
  `legL`, `armL`, `footMul` — copy these numbers directly into
  `AvatarPrimitive.pos`/`size`/`rot` (they are **absolute world-offset-from-
  anchor** numbers at `sk=1` scale, i.e. already divided by `sk` where the
  schema expects "mm at sk=1" — see the per-kind header for the member's own
  `sk`, since `AvatarPrimitive` sizes/positions are authored at sk=1 and the
  renderer multiplies by `sk` at build time. Where a member's sk ≠ 1, the
  "Resolved" column already backs out the sk factor so the number you author
  is portable if the def's `sk` ever changes).
- **Parent** is always `root` unless noted — see Part 3 finding on anchors.
- Every mesh in every kind block is built via `this._mat({...})` (the shared
  toon-gradient factory) **except** the astronaut helmet, which sets
  `transparent:true` — flagged, this is schema gap **G2**.

---

## Part 0 — inventory scope confirmed

`LegacyAvatarKind` (`src/avatars.ts`) has 24 values. `_addAvatarAccessories`'s
switch has content for **19** of them (`adult`, `child`, `alien` build zero
extra meshes — the bare rig is the whole look); `cat`/`dog` never reach this
function at all (they route through `_buildQuadruped`, a fully data-driven
builder with no legacy switch — **out of scope**, nothing to migrate there).

24 `AvatarDef` members carry `legacyAccessories`, across 7 pack files + core:

| Pack file | Members using `legacyAccessories` |
|---|---|
| `src/avatars.ts` (core) | `adult` (1) |
| `base-humans.ts` | `child` (1) |
| `base-careers.ts` | `professional`, `hacker`, `tech_expert`, `farmer`, `cowboy`, `athlete`, `movie_star`, `supermodel`, `magician`, `wise_oracle` (10) |
| `base-pop-culture.ts` | `teddy_bear`, `cartoon_mouse`, `cartoon_dog`, `cartoon_duck`, `ninja` (5) |
| `base-robotic.ts` | `robot`, `cyborg`, `ninja_cyborg` (3) |
| `base-scifi.ts` | `astronaut` (1) |
| `base-aliens.ts` | `alien` (1) |
| `disney-animals.ts` | `disney-animals/sailor-duck` → reuses `'cartoon_duck'`, `disney-animals/tall-dog-pal` → reuses `'cartoon_dog'` (2) |

**24 members, 22 unique kind strings** (disney-animals' two members deliberately
re-invoke the `cartoon_duck`/`cartoon_dog` blocks at their own `sk`/color to
avoid re-deriving bill/muzzle geometry — see their notes below). Migrating
the **22 kind blocks** once automatically covers all 24 members.

**Total mesh count: 66** built-mesh instances across the 22 kind blocks (see
Part 5 per-kind counts). `adult`/`child`/`alien` contribute 0.

---

## Part 1 — per-kind mesh inventory

### Resolved base metrics per kind (sk=1 unless noted)

Formulas (`_buildHumanoid`): `TORSO_W=240·sk`, `TORSO_H=600·sk`, `TORSO_D=140·sk`;
`hipY = 430·sk·legL + 380·sk·legL + 60·sk·footMul[1]`; `torsoY = hipY + TORSO_H/2`;
`headY = hipY + TORSO_H + HEAD_R + 40·sk`; `shoulderY = hipY + TORSO_H·0.88`;
`frontZ = −TORSO_D/2`; `backZ = TORSO_D/2`. `HEAD_R` is **absolute** (not ×sk).

| Kind | sk | legL | footMul[1] | HEAD_R | hipY | TORSO_H | torsoY | headY | frontZ / backZ |
|---|---|---|---|---|---|---|---|---|---|
| adult (no meshes) | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| child (no meshes) | 0.6 | 1 | 1 | 107 | 522 | 360 | 702 | 1029 | −42 / 42 |
| alien (no meshes) | 1 | 1 | 1 | 158 | 870 | 600 | 1170 | 1668 | −70 / 70 |
| robot | 1 | 1 | 1 | 128 | 870 | 600 | 1170 | 1638 | −70 / 70 |
| professional | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| hacker | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| movie_star | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| ninja_cyborg | 1 | 1 | 1 | 120 | 870 | 600 | 1170 | 1630 | −70 / 70 |
| ninja | 1 | 1 | 1 | 120 | 870 | 600 | 1170 | 1630 | −70 / 70 |
| cyborg | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| athlete | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| teddy_bear | 0.9 | 0.8 | 1 | 140 | 637.2 | 540 | 907.2 | 1353.2 | −63 / 63 |
| cartoon_mouse | 0.85 | 1 | 1 | 120 | 739.5 | 510 | 994.5 | 1403.5 | −59.5 / 59.5 |
| cartoon_dog | 0.95 | 1 | 1 | 128 | 826.5 | 570 | 1111.5 | 1562.5 | −66.5 / 66.5 |
| cartoon_duck | 0.85 | 1 | 0.7 | 122 | 724.2 | 510 | 979.2 | 1390.2 | −59.5 / 59.5 |
| cowboy | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| magician | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| farmer | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| tech_expert | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| supermodel | 1.05 | 1 | 1 | 124 | 913.5 | 630 | 1228.5 | 1709.5 | −73.5 / 73.5 |
| wise_oracle | 1 | 1 | 1 | 126 | 870 | 600 | 1170 | 1636 | −70 / 70 |
| astronaut | 1 | 1 | 1 | 118 | 870 | 600 | 1170 | 1628 | −70 / 70 |

`TORSO_W`/`TORSO_D` at non-1 sk: teddy_bear 216/126, cartoon_mouse 204/119,
cartoon_dog 228/133, cartoon_duck 204/119, supermodel 252/147.

All meshes below parent to `root` (the rig group) — **never** a sub-group —
confirmed by reading every `root.add(...)` call in the switch; there is no
per-kind exception. See Part 3 for why this matters.

---

### `robot` — 3 meshes

| Mesh | Geometry | Position (formula → resolved) | Rotation | Color / material | Flags |
|---|---|---|---|---|---|
| stalk | `Cylinder(9,9,130)` | `(0, headY+HEAD_R+65, 0)` → `(0, 1831, 0)` | — | `c.dark` (0x202024) | — |
| tip | `Sphere(26)` | `(0, headY+HEAD_R+135, 0)` → `(0, 1901, 0)` | — | `c.accent` (tint) | — |
| stripe | `Box(216, 108, 24)` (= `TORSO_W·0.9, TORSO_H·0.18, 24`) | `(0, torsoY+TORSO_H·0.12, frontZ−6)` → `(0, 1242, −76)` | — | `c.accent` | — |

Declarative color mapping: `dark`→`'dark'`, `accent`→`'tint'`.

### `professional` — 2 meshes

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| shirt (V-neck) | `Cone(TORSO_W·0.34=81.6, TORSO_H·0.6=360, **3 radial segments**)` | `(0, torsoY+TORSO_H·0.02, frontZ−8)` → `(0, 1182, −78)` | `x:π, y:π/3` | fixed `0xf2f2f0`, rough .6 met 0 | **needs low-poly cone — G3** |
| tie | `Box(24, 264, 14)` (`TORSO_W·0.1, TORSO_H·0.44, 14`) | `(0, torsoY−TORSO_H·0.02, frontZ−8−TORSO_W·0.17−14)` → `(0, 1158, −132.8)` | — | `c.accent` | must build AFTER/proud of the cone (z more negative) |

### `hacker` — 1 mesh

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| hoodie cowl | `Sphere(HEAD_R·1.22=153.72, sphereArc[0,2π,0,0.6π])` | `(0, headY+HEAD_R·0.08, HEAD_R·0.34)` → `(0, 1646.08, 42.84)` | `x:0.5` | fixed `0x18181c` | fully expressible today — `sphereArc` + `rot` |

### `movie_star` — 1 mesh

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| gold stripe | `Box(TORSO_W·0.16=38.4, TORSO_H·0.78=468, 20)` | `(0, torsoY, frontZ−6)` → `(0, 1170, −76)` | — | `0xffdd66`, emissive `0xcaa53a` @0.4, metalness .5 rough .3 | — |

### `ninja_cyborg` / `ninja` — shared katana (2 meshes) + ninja-only (2 meshes)

Shared branch fires for **both** kind strings; the `if (kind==='ninja')` block
adds two more meshes ONLY for `ninja`. Per-member totals: **ninja_cyborg = 2,
ninja = 4**.

Katana is built as a `THREE.Group` at `(-TORSO_W·0.1, torsoY, backZ+30)`,
`rotation.z=0.55`, then two child meshes at LOCAL (group-relative) positions:

| Mesh | Geometry | Local position | Color | Notes |
|---|---|---|---|---|
| katana group origin | — | `(-24, torsoY, backZ+30)` → ninja_cyborg `(−24, 1170, 100)`; ninja `(−24, 1170, 100)` (backZ same, 70) | — | `rot.z=0.55` on the GROUP |
| blade | `Box(26, TORSO_H·1.35=810, 26)` | `(0,0,0)` (group-local) | `0x2a2a30`, emissive `0x11121a`@0.1, met .6 rough .35 | — |
| handle | `Box(30, TORSO_H·0.34=204, 30)` | `(0, TORSO_H·0.7=420, 0)` (group-local) | `c.accent` (tint) — "grip tinted so sensor color survives" | — |

Migration note: the schema has **no group/composite primitive** — author the
katana as TWO separate `AvatarPrimitive`s both anchored at `back`, each with
its own absolute `pos`/`rot` pre-composed through the group transform (rotate
the local offsets by 0.55 rad about the group origin by hand, or accept the
schema gap **G4** "no nested/grouped primitives" and author two independent
world-space prims — recommended, since the group here has only 2 children).

Ninja-only extras:

| Mesh | Geometry | Position → resolved (ninja: headY=1630, torsoY=1170) | Rotation | Color |
|---|---|---|---|---|
| hood | `Sphere(HEAD_R·1.14=136.8, sphereArc[0,2π,0,0.85π])` | `(0, 1630, 0)` | — | fixed `0x131317` |
| sash | `Box(TORSO_W·1.06=254.4, TORSO_H·0.12=72, TORSO_D·1.06=148.4)` | `(0, torsoY−TORSO_H·0.28)` → `(0, 1002, 0)` | — | `c.accent` (tint) |

### `cyborg` — 2 meshes + limb/eye/ear special cases (see Part 2)

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| head half-plate | `Sphere(HEAD_R·1.06=133.56, phi[0,π])` (half shell) | `(0, headY=1636, 0)` | `y:π/2` | steel: `0x8a9099`, emissive same @0.1, met .8 rough .3 | new shared "steel" material — see G4 |
| chest panel | `Box(TORSO_W·0.34=81.6, TORSO_H·0.22=132, 22)` | `(TORSO_W·0.18=43.2, torsoY+TORSO_H·0.16, frontZ−6)` → `(43.2, 1266, −76)` | — | `c.accent` (tint) | — |

`sphereArc` already covers a half-sphere shell (`phiLength=π`); the offset
side is chosen entirely by `rotation.y=π/2` — **fully expressible today**.

### `athlete` — 2 meshes (+ 2 decals already declarative on the pack member)

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| headband | **`Torus(HEAD_R·0.93=117.18, HEAD_R·0.13=16.38, 8, 20)`** | `(0, headY+HEAD_R·0.45)` → `(0, 1692.7, 0)` | `x:π/2` | fixed `0xf2f2f2` | **no torus shape — G1** |
| shorts | `Box(TORSO_W·1.04=249.6, TORSO_H·0.34=204, TORSO_D·1.04=145.6)` | `(0, torsoY−TORSO_H·0.32)` → `(0, 978, 0)` | — | `0x243043` emissive same @0.15 | — |

The pack member (`base-careers.ts`) already ALSO carries 2 `decals` (jersey
`'7'` on back, `★` glyph on chest) — those are unaffected by this migration
(decals are a separate mechanism, already declarative).

### `teddy_bear` — 5 meshes

| Mesh | Geometry | Position → resolved (sk .9, HEAD_R 140) | Color | Notes |
|---|---|---|---|---|
| ear L | `Sphere(HEAD_R·0.42=58.8)` | `(−HEAD_R·0.62=−86.8, headY+HEAD_R·0.78=1462.4, 0)` | `c.skin` (= PLUSH, tint-equivalent since `skin===body===PLUSH`) | use `'skin'` |
| ear R | same | `(86.8, 1462.4, 0)` | same | — |
| muzzle | `Sphere(HEAD_R·0.42=58.8)`, scale `(1,0.72,0.7)` | `(0, headY−HEAD_R·0.28=1314, −HEAD_R·0.8=−112)` | `lite` = `0xc9a87c` fixed, emissive same @0.15 | schema `sphere` supports ellipsoid via 3-tuple `size` — use `[58.8,42.34,41.16]` (r×scale) |
| belly | `Sphere(TORSO_W·0.42=90.72)`, scale `(1,1.25,0.35)` | `(0, torsoY−TORSO_H·0.08=864, frontZ−8·sk=−70.2)` | `lite` | ellipsoid size `[90.72,113.4,31.75]` |
| tail | `Sphere(66·sk=59.4)` | `(0, torsoY−TORSO_H·0.34=723.6, backZ+30·sk=90)` | `lite` | — |

### `cartoon_mouse` — 6 meshes

sk .85, HEAD_R 120, hipY 739.5.

| Mesh | Geometry | Position → resolved | Rotation | Color |
|---|---|---|---|---|
| ear disc L | `Cyl(HEAD_R·0.56=67.2, 26·sk=22.1)` | `(−HEAD_R·0.74=−88.8, headY+HEAD_R·0.86=1506.7, 0)` | `x:π/2` (disc faces −Z) | `c.skin` (MOUSE) |
| ear disc R | same | `(88.8, 1506.7, 0)` | `x:π/2` | same |
| inner disc L | `Cyl(HEAD_R·0.36=43.2, 10·sk=8.5)` | `(−88.8, 1506.7, −12·sk=−10.2)` | `x:π/2` | pink `0xf2a0b5` emissive same @0.2 |
| inner disc R | same | `(88.8, 1506.7, −10.2)` | `x:π/2` | same |
| tail seg 1 | `Cyl(15·sk=12.75, 300·sk=255)` | `(0, hipY·0.9=665.55, backZ+90·sk=136)` | `x:−1.15` | `c.skin` |
| tail seg 2 | `Cyl(11·sk=9.35, 240·sk=204)` | `(0, hipY·0.72=532.44, backZ+300·sk=314.5)` | `x:−0.35` | `c.skin` |

Note: `cyl()` builds `CylinderGeometry(r,r,h,16)` (equal top/bottom radius) —
the tail tapers only because seg2's radius (9.35) is smaller than seg1's
(12.75), not because either segment itself tapers. Two straight cylinders,
directly portable.

### `cartoon_dog` — 5 meshes

sk .95, HEAD_R 128, hipY 826.5.

| Mesh | Geometry | Position → resolved | Rotation | Color |
|---|---|---|---|---|
| ear L (box) | `Box(44·sk=41.8, HEAD_R·1.1=140.8, HEAD_R·0.6=76.8)` | `(−HEAD_R·1.05=−134.4, headY+HEAD_R·0.05=1568.9, 0)` | `z:+0.18` (sx=−1 → `−sx·0.18`) | `earMat` `0x6b4226` |
| ear R (box) | same | `(134.4, 1568.9, 0)` | `z:−0.18` | same |
| snout | `Box(HEAD_R·0.64=81.92, HEAD_R·0.46=58.88, HEAD_R·0.6=76.8)` | `(0, headY−HEAD_R·0.28=1526.66, −HEAD_R·1.0=−128)` | — | `muzzleMat` `0xc99e6a` |
| nose | `Sphere(HEAD_R·0.18=23.04)` | `(0, headY−HEAD_R·0.18=1539.46, −HEAD_R·1.32=−168.96)` | — | `c.dark` |
| tail | `Cyl(18·sk=17.1, 250·sk=237.5)` | `(0, hipY·0.95=785.175, backZ+90·sk=152)` | `x:−0.9` | `earMat` |

Reused verbatim (same code, different `sk`/color/headR) by
`disney-animals/tall-dog-pal` (sk 1.05, headR 128, skin `0xd98a4a`) — migrate
ONCE, both members benefit.

### `cartoon_duck` — 1 mesh

sk .85, HEAD_R 122, footMul[1]=0.7 (only affects `hipY`, irrelevant here).

| Mesh | Geometry | Position → resolved | Color |
|---|---|---|---|
| bill | `Box(HEAD_R·1.05=128.1, HEAD_R·0.17=20.74, HEAD_R·0.6=73.2)` | `(0, headY−HEAD_R·0.14=1373.12, −HEAD_R·1.08=−131.76)` | `billMat` `0xe8931d` emissive same @0.25 |

Reused verbatim by `disney-animals/sailor-duck` (sk 0.85, headR 122, skin
`0xf2f0e6`). Trivially the simplest kind to migrate (1 mesh).

### `cowboy` — 5 meshes (+ 1 declarative accessory already present: lasso)

| Mesh | Geometry | Position → resolved | Color |
|---|---|---|---|
| brim | `Cyl(HEAD_R·1.42=178.92, 24)` | `(0, headY+HEAD_R·0.55=1705.3, 0)` | `hatMat` `0x7a5230` |
| crown | `Cyl(HEAD_R·0.72=90.72, HEAD_R·0.72=90.72)` | `(0, 1705.3+HEAD_R·0.36=1750.66, 0)` | `hatMat` |
| bandana | `Box(TORSO_W·0.78=187.2, 55, TORSO_D·0.9=126)` | `(0, torsoY+TORSO_H·0.5+20=1490, 0)` | `c.accent` |
| vest panel L | `Box(TORSO_W·0.32=76.8, TORSO_H·0.72=432, 18)` | `(−TORSO_W·0.33=−79.2, torsoY+TORSO_H·0.05=1200, frontZ−8=−78)` | `vestMat` `0x6b4226` |
| vest panel R | same | `(79.2, 1200, −78)` | same |

The pack member ALSO carries a declarative `accessories: [{cylinder coiled
lasso @ hip}]` — leave untouched, just add the 5 above as new prims on the
same member.

### `magician` — 4 meshes (+ 2 declarative accessories already present: wand + tip)

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| brim | `Cyl(HEAD_R·1.12=141.12, 18)` | `(0, headY+HEAD_R·0.6=1711.6, 0)` | — | fixed `0x111114` | — |
| crown | `Cyl(HEAD_R·0.7=88.2, HEAD_R·1.25=157.5)` | `(0, 1711.6+HEAD_R·0.63=1790.98, 0)` | — | same | — |
| shirt V | `Cone(TORSO_W·0.34=81.6, TORSO_H·0.6=360, **3 seg**)` | `(0, torsoY+TORSO_H·0.02=1182, frontZ−8=−78)` | `x:π, y:π/3` | fixed `0xf2f2f0` | **G3 (low-poly cone)** |
| bowtie | `Box(TORSO_W·0.3=72, 45, 22)` | `(0, torsoY+TORSO_H·0.44=1434, frontZ−12=−82)` | — | `c.accent` | — |

### `farmer` — 5 meshes

| Mesh | Geometry | Position → resolved | Color |
|---|---|---|---|
| brim | `Cyl(HEAD_R·1.3=163.8, 20)` | `(0, headY+HEAD_R·0.55=1705.3, 0)` | `straw` `0xd9b36a` |
| crown | `Cyl(HEAD_R·0.7=88.2, HEAD_R·0.55=69.3)` | `(0, 1705.3+HEAD_R·0.28=1740.58, 0)` | `straw` |
| bib | `Box(TORSO_W·0.56=134.4, TORSO_H·0.5=300, 20)` | `(0, torsoY−TORSO_H·0.05=1140, frontZ−10=−80)` | `denim` `0x3f5f8a` |
| strap L | `Box(48, TORSO_H·0.5=300, 16)` | `(−TORSO_W·0.26=−62.4, torsoY+TORSO_H·0.28=1338, frontZ−8=−78)` | `denim` |
| strap R | same | `(62.4, 1338, −78)` | `denim` |

The pack member also has a `decals` check print (flannel) — untouched.

### `tech_expert` — 7 meshes

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| lens L | `Box(HEAD_R·0.4=50.4, HEAD_R·0.3=37.8, 20)` | `(−HEAD_R·0.38=−47.88, headY+HEAD_R·0.12=1651.12, −HEAD_R·0.92=−115.92)` | — | `frame` `0x17181c` | — |
| lens R | same | `(47.88, 1651.12, −115.92)` | — | same | — |
| bridge | `Box(HEAD_R·0.2=25.2, 16, 16)` | `(0, 1651.12, −HEAD_R·0.94=−118.44)` | — | `frame` | — |
| headset band | **`Torus(HEAD_R·1.02=128.52, 16, 8, 18, arc=π)`** (half-torus) | `(0, headY=1636, 0)` | — | `bandMat` `0x2c2e34` | **G1 (torus + arc)** |
| mic stub | `Cyl(10, HEAD_R·0.7=88.2)` | `(HEAD_R·0.62=78.12, headY−HEAD_R·0.35=1591.9, −HEAD_R·0.5=−63)` | `z:1.15` | `bandMat` | — |
| mic tip | `Sphere(22)` | `(HEAD_R·0.32=40.32, headY−HEAD_R·0.5=1573, −63)` | — | `c.accent` | — |
| belt | `Box(TORSO_W·1.05=252, TORSO_H·0.1=60, TORSO_D·1.05=147)` | `(0, torsoY−TORSO_H·0.42=918, 0)` | — | `c.accent` | — |

### `supermodel` — 4 meshes

sk 1.05, HEAD_R 124.

| Mesh | Geometry | Position → resolved | Rotation | Color | Flags |
|---|---|---|---|---|---|
| hair cap | `Sphere(HEAD_R·1.13=140.12, sphereArc[0,2π,0,0.44π])` | `(0, headY+HEAD_R·0.04=1714.46, HEAD_R·0.04=4.96)` | `x:0.28` | `hairMat` `0x2a2026` | fully expressible today |
| hair fall | `Box(HEAD_R·1.6=198.4, HEAD_R·1.9=235.6, HEAD_R·0.5=62)` | `(0, headY−HEAD_R·0.4=1659.9, HEAD_R·0.72=89.28)` | — | `hairMat` | — |
| glasses | `Box(HEAD_R·1.1=136.4, HEAD_R·0.22=27.28, HEAD_R·0.16=19.84)` | `(0, headY+HEAD_R·0.62=1786.38, −HEAD_R·0.72=−89.28)` | — | fixed `0x0a0a0c` met .5 rough .2 | — |
| dress | `Box(TORSO_W·1.06=267.12, TORSO_H·0.46=289.8, TORSO_D·1.06=155.82)` | `(0, torsoY−TORSO_H·0.5=913.5, 0)` | — | `c.accent` | — |

### `wise_oracle` — 3 meshes (+ 1 declarative accessory already present: two-handed staff) + force-gown

| Mesh | Geometry | Position → resolved | Color | Notes |
|---|---|---|---|---|
| skirt | `skirtH=hipY−20=850`; `Box(TORSO_W·1.45=348, 850, TORSO_D·2.0=280)` | `(0, hipY+40−skirtH/2)` → `(0, 485, 0)` | `c.bodyMat` (ROBE `0x7b718f`) | sized/positioned from `hipY` — safe to hardcode since this member never overrides `legL`/`sk` beyond default |
| beard | `Box(HEAD_R·0.62=78.12, HEAD_R·0.85=107.1, HEAD_R·0.28=35.28)` | `(0, headY−HEAD_R·0.78=1537.72, −HEAD_R·0.72=−90.72)` | fixed `0xe8e8e4` emissive same @0.1 | — |
| amulet | `Sphere(50)` | `(0, torsoY+TORSO_H·0.22=1302, frontZ−24=−94)` | `c.accent` | — |

**Force-gown**: `_buildHumanoid` does `const gown = (hf.gown ?? false) ||
kind==='wise_oracle'` — a KIND-STRING special case, but trivially fixable:
add `humanoid: { gown: true }` to the migrated def, then delete the
`|| kind === 'wise_oracle'` clause. Not a schema gap, just a required
follow-up edit alongside the accessory migration.

### `astronaut` — 4 meshes

HEAD_R 118, headY 1628.

| Mesh | Geometry | Position → resolved | Color | Flags |
|---|---|---|---|---|
| helmet bubble | `Sphere(HEAD_R·1.26=148.68)` | `(0, 1628, 0)` | `0xbfd8e8`, rough .15 met .1, **transparent:true, opacity:0.22** | outlineSkip; **G2 (no per-primitive opacity)** |
| chest panel | `Box(TORSO_W·0.5=120, TORSO_H·0.28=168, 26)` | `(0, torsoY+TORSO_H·0.1=1230, frontZ−10=−80)` | `panelMat` `0x8a9099` | — |
| status lamp | `Sphere(20)` | `(TORSO_W·0.14=33.6, torsoY+TORSO_H·0.18=1278, frontZ−26=−96)` | `c.accent` | — |
| backpack | `Box(TORSO_W·0.85=204, TORSO_H·0.6=360, TORSO_D·0.6=84)` | `(0, torsoY+TORSO_H·0.05=1200, backZ+TORSO_D·0.32=114.8)` | fixed `0xd8d8dc` | — |

---

## Part 2 — renderer special-cases keyed on legacy kind STRINGS

Full-file greps for every one of the 22 kind literals outside the accessory
switch, plus a read of the rest of `_buildHumanoid`, `_carryLookState`,
`resolveLook`/`UNIVERSAL_LOOKS` (avatars.ts), and `thumbs.ts`/`thumbs-cache.ts`.

| # | Special case | Location | Driven by | Migration status |
|---|---|---|---|---|
| 1 | `gown = ... \|\| kind==='wise_oracle'` (force floor-length-robe leg-swing damping) | `_buildHumanoid` ~17515 | **kind string** | Trivial fix: add `gown:true` to the migrated def, delete the OR clause. Not a schema gap. |
| 2 | `steelMat = (kind==='ninja_cyborg'\|\|kind==='cyborg') ? steel : skin` — right ARM (+ hand) forced to brushed-steel material (metalness .8/roughness .3/emissive) | `_buildHumanoid` ~17876 | **kind string** | **Gap G4** — `limbColors` only carries a flat hex; no metalness/roughness/emissive override. |
| 3 | `rightLeg` material `= legRSeg ?? (kind==='cyborg' ? steelMat : baseLegMat)` — cyborg ALSO gets a steel right LEG (ninja_cyborg does not) | `_buildHumanoid` ~17911 | **kind string** | Same **Gap G4**. |
| 4 | `if (kind==='cyborg') makeEar(-1); else {makeEar(-1); makeEar(1)}` — cyborg shows only its organic (−x) ear, others get both | `_buildHumanoid` ~17868 | **kind string** | **Gap G5** — `earSkip` is a plain boolean (both-or-neither); no "one side only" option. |
| 5 | Eye styles (`visor`/`almond`/`redvisor`/`shades`/`slit`/`halfred`/`compound`/`t_visor`/`sleepy`/`luminous`) | `_buildHumanoid` ~17720–17834 | **`spec.eyes` field** (`hf.eyes`) — already set per-member in the pack files (`robot`→visor, `cyborg`→halfred, `ninja_cyborg`→redvisor, `ninja`→slit, `alien`→almond, `movie_star`→shades) | **No migration needed** — already fully data-driven. |
| 6 | `earSkip` gating (skip both ears entirely) | `_buildHumanoid` ~17868 | **`spec.earSkip` field** — already `true` on robot/alien/hacker/tech_expert/supermodel/teddy_bear/cartoon_mouse/cartoon_dog/cartoon_duck/ninja/wise_oracle/ninja_cyborg in the pack files | **No migration needed.** |
| 7 | `trouserTone`/`legIsTint` pants derivation | `_buildHumanoid` ~17879–17898, `trouserTone()` fn ~1224 | Pure function of `spec.skin === color` (i.e. whether the def leaves `skin`/`body` at the tint default) — **not** kind-string | **No migration needed** — already generic; the "keeps costume legs" exemption for robot/alien/hacker/ninja/wise_oracle falls out automatically because those defs set an explicit non-tint `skin`. |
| 8 | Anchor `'head'`/`'crown'`/`'face'` parent to `root`, not a per-rig "head bone" | `anchorOf()` ~16403–16445 | Schema/renderer design, not a per-kind check | **Confirmed non-issue** — see Part 3 finding; every IMPERATIVE accessory in `_addAvatarAccessories` is ALSO added straight to `root` (never a head sub-group), so migrating to declarative changes nothing about how hats/hair track (or don't track) head motion. Exact parity. |
| 9 | `resolveLook`/`UNIVERSAL_LOOKS`/`universalLookEligible` (costume swaps) | `avatars.ts` 531–600 | Generic predicate (`hf.skin` tint-or-not, `legColor`, `hover`, `pet`, `rig`) | **No kind-string checks found.** No migration needed; migrated defs get costume-swap eligibility "for free" exactly as today (e.g. `professional`/`farmer`/`athlete` etc. are already eligible; `robot`/`alien`/`hacker`/`ninja`/`ninja_cyborg`/`wise_oracle` are already ineligible via their non-tint `skin`/`earSkip`+`hover` fields — none of that changes). |
| 10 | `_carryLookState` (rebuild-preserves-pose) | `three-renderer.ts` ~18135 | Generic, no kind checks | **No migration needed.** |
| 11 | `PROP_DEFS`/`propEligible`/`propTierOf` (shared-props feature) | `three-renderer.ts` ~937–1121 | Generic (`h.sessile`, `h.noProps`, `h.quad`) | **No kind-string checks found.** `wise_oracle`'s two-handed staff is already a declarative hand accessory (anchor `handR`, `twoHanded:true`) — unaffected by, and doesn't conflict with, the prop-swap system (hand-accessory hide/restore is anchor-driven, not kind-driven). |
| 12 | `AVATAR_BUBBLES`/personality bubbles | — | `resolveDef(h.avatarKind).bubbles` (line ~15664) | **Already 100% field-driven** (`def.bubbles`) — no kind-string table exists to migrate. |
| 13 | `thumbs.ts` / `thumbs-cache.ts` (toolbar 3D thumbnail glyphs) | `src/ui/thumbs*.ts` | No `LegacyAvatarKind` references found | **No migration needed** — thumbnails render every avatar through the same real-3D-renderer capture path regardless of legacy-vs-declarative. |

**Summary of genuinely kind-string-driven special cases requiring migration
follow-up: #1 (gown, trivial), #2+#3 (steel limb, schema gap G4), #4 (single
ear, schema gap G5).** Everything else (#5–13) is already field-driven or a
non-issue.

---

## Part 3 — declarative schema gap analysis

| Gap | What's missing | Where it bites | Proposed extension |
|---|---|---|---|
| **G1** | No `'torus'` primitive shape | `athlete` headband (full ring), `tech_expert` headset band (half ring, `arc=π`) | Add `shape:'torus'` to `AvatarPrimitive['shape']`; `size: [radius, tube]` or `[radius, tube, arcLength]` (arcLength default `2π`; `tech_expert` needs `π`). Consumed in `_buildPrimitiveMesh`'s geometry switch as `new THREE.TorusGeometry(r*sk, tube*sk, 8, 18or20, arc)`. |
| **G2** | No per-primitive transparency/opacity | `astronaut` helmet bubble (`transparent:true, opacity:0.22`) | Add `opacity?: number` to `AvatarPrimitive`; in `matFor()`, when `prim.opacity != null` pass `{transparent:true, opacity: prim.opacity}` into `_mat()`. Auto-implies `outlineSkip` is still author-set explicitly (transparent materials already auto-skip the outline pass per the house convention, so this may be redundant with existing behavior — verify against `_addOutlines`'s transparent-material skip). |
| **G3** | No control over primitive segment/radial-segment count | `professional`/`magician` shirt V — a **3-radial-segment** `ConeGeometry` (a flat triangular wedge), vs the declarative builder's hardcoded 16 | Add `segments?: number` to `AvatarPrimitive`, applied to `cone`/`cylinder` geometry construction (`new THREE.ConeGeometry(r,h, prim.segments ?? 16)`). Alternative naming to match existing convention: `radialSegments?`. |
| **G4** | No per-limb material override beyond flat hex | `cyborg` (steel right arm+hand+leg), `ninja_cyborg` (steel right arm+hand only) — need `metalness:0.8, roughness:0.3, emissiveIntensity:0.1` on top of a color, not just a recolor | Extend `HumanoidFields.limbColors` entries from `number` to `number \| {color:number; metalness?:number; roughness?:number; emissiveIntensity?:number}`. Consumed in `_buildHumanoid`'s `limbMat()` closure (currently hardcodes `metalness:0.1, roughness:0.6, emissiveIntensity: spec.emI*0.5` for every override). Simpler alternative: a boolean `limbColors.armR: 'steel'` sentinel reusing the SAME steel-material recipe already built for `spec.steel` bodies — cheaper to implement, less flexible. |
| **G5** | No asymmetric/single-side ear control | `cyborg` (organic left ear only; the plated +x side has no ear) | Extend `HumanoidFields.earSkip` from `boolean` to `boolean \| 'left' \| 'right'` (or add a separate `earSide?: 'both'\|'left'\|'right'\|'none'`, default `'both'`). Consumed at the `!spec.earSkip && ...` gate in `_buildHumanoid` (~17868), replacing the `kind==='cyborg'` check with `spec.earSkip !== 'right' ? makeEar(-1) : null` / `spec.earSkip !== 'left' ? makeEar(1) : null` (mind the sign: `-1`=left/−x, per `cyborg`'s own `makeEar(-1)` call being its ONE visible/organic ear). |
| **G6** (informational, not a hard blocker) | No grouped/composite sub-transform for a multi-mesh unit (e.g. the katana: a rotated `Group` containing 2 children, so both meshes share one `rotation.z=0.55` pivot) | `ninja`/`ninja_cyborg` katana (blade+handle) | Not proposed as a schema addition — cheaper to just author 2 independent world-space primitives (rotate each mesh's own `pos`/`rot` by the group transform at authoring time, done in Part 1's table already). Flag if a FUTURE multi-mesh composite (e.g. a two-part staff+banner) makes this common enough to warrant a `group` primitive kind. |
| — | Position/size parameterized off rig metrics (`hipY`) rather than static mm | `wise_oracle` skirt height depends on `hipY` (which depends on `sk`/`legL`) | **Not a blocking gap for this migration** (the member never overrides `legL`/`sk` beyond 1, so hand-computed static numbers are exact and stable). Worth a note in `docs/avatars/AUTHORING.md`'s parked-recipes section for FUTURE gown-wearing members at non-default `sk`: author against that member's OWN resolved `hipY`, or prefer the existing `cape` shape (already handles a draped sheet anchored at `back`/neck-collar) for anything longer than a fixed skirt box. |

### Anchor precision finding (requested investigation)

**`anchorOf('head' | 'crown' | 'face')` parents to `root`, at a FIXED offset
(`headY`/`+HEAD_R`/`−HEAD_R`) — it does NOT parent to any independent
"head bone" that nods/turns separately from the body.** Verified by reading
the entire humanoid head/face build: the `head` mesh itself, every eye/brow/
nose/mouth/ear feature, and (confirmed above) every single imperative
accessory in `_addAvatarAccessories` are `root.add(...)`'d directly — **there
is no head sub-`Group` in the humanoid rig at all.** The humanoid's only
whole-body rotations are on `root` (`rotation.order='YXZ'`: yaw=facing,
pitch=lean, roll=stride-sway) — nothing rotates the head independently.

Contrast with the **quadruped** rig: `qhead` anchors to `headG`, a REAL
`THREE.Group` that gets its own per-frame `rotation.x` (nod, walk/idle-driven)
and `rotation.y` (slow idle look-around) in `_applyQuadPose` (~17422–17430).
So a quad accessory at `qhead` DOES ride independent head motion; a humanoid
accessory at `head`/`crown`/`face` does not (because none exists to ride).

**Migration impact: zero.** Since the imperative code ALSO parents every
head-region accessory to `root` at the same fixed offset, porting to
declarative `head`/`crown`/`face` anchors reproduces byte-identical parenting
and motion behavior. This is a real asymmetry in the rig (humanoid vs quad),
worth documenting for future pack authors expecting head-tracking on a
humanoid hat, but it is **not** a migration regression — parity is exact.

### Non-gaps confirmed (schema already covers)

- **`sphereArc`** already covers every partial-sphere hood/hair/shell/helmet
  in the inventory (hacker hood, ninja hood, supermodel cap, cyborg half-plate,
  knight helm) via `[phiStart, phiLength, thetaStart, thetaLength]` + `rot`.
- **Ellipsoid spheres** (`size: [rx,ry,rz]`) already cover teddy_bear's
  scaled muzzle/belly.
- **Color tokens** `'tint'`/`'skin'`/`'body'`/`'dark'`/`'accent'` map 1:1 onto
  every imperative material source found (`c.accent`↔`'tint'`, `c.skin`↔
  `'skin'`, `c.bodyMat`↔`'body'`, `c.dark`↔`'dark'`) — confirmed by reading
  `propBuildCtx` construction (`tint: accent, skin, bodyMat, dark`), so no
  fixed-hex imperative material needs to stay a "magic number" unless the
  ORIGINAL code used a fixed hex unrelated to any of the four rig materials
  (most do — those port as plain numeric `color` + explicit
  `emissive`/`emissiveIntensity`/`metalness`/`roughness`, all already
  supported per-primitive).
- **`cape` shape** already exists (`shoulderWidth, length, flareBottomWidth`,
  auto-pinned to the neck collar) — not needed by any of these 22 kinds, but
  confirms draped-sheet geometry is a solved problem for any FUTURE gown
  migration, superseding the `wise_oracle` fixed-box skirt approach.

---

## Part 4 — parity-test recommendation

Follow the **`test-pages/necktie-test.html`** idiom exactly (it already
regression-tests declarative `neck`/`chest` accessories against real
world-space geometry, so extending it — or adding a sibling
`legacy-migration-test.html` — is the path of least resistance):

1. **Build both versions side by side.** For each of the 22 kinds, call
   `r._buildHumanoid(TINT, kind)` against the CURRENT (pre-migration) code to
   capture a "before" snapshot, then again after the def's `legacyAccessories`
   is replaced by `accessories:` to capture "after". (In practice this means
   running the test once per branch/commit, or keeping a frozen copy of the
   old imperative function under a different name temporarily during the
   migration PR.)
2. **Sample every mesh through `matrixWorld`**, exactly like `probe(mesh)` in
   `necktie-test.html`: iterate `geometry.attributes.position`, transform each
   vertex by `mesh.matrixWorld`, and record a world-space bbox
   (`minx/maxx/miny/maxy/minz/maxz`) + centroid.
3. **Per-mesh signature to record** (enough to match "before" meshes to
   "after" prims and catch regressions):
   - Geometry `type` + constructor `parameters` (radius/width/height/depth) —
     use `findBox`/`findCone`-style matchers already in necktie-test.
   - World bbox (6 numbers) + centroid.
   - Material `color`/`emissive`/`emissiveIntensity`/`metalness`/`roughness`
     (read straight off `mesh.material`, no need to sample pixels).
   - Mesh **count** per kind (must match Part 1's table exactly — a dropped
     or duplicated mesh is an instant fail).
4. **Tolerance**: since every "after" number in Part 1 is the EXACT resolved
   value from the "before" formula (not re-derived or eyeballed), use a TIGHT
   tolerance — **≤ 0.05 mm** on positions/sizes (matches `necktie-test.html`'s
   `near(a,b,0.02)` pattern scaled up slightly for the larger numbers here)
   and **≤ 0.001 rad** on rotations. Anything looser risks masking a real
   transcription error (e.g. a dropped `sk` factor or a sign flip).
5. **Special assertions per known risk area**:
   - `cyborg`/`ninja_cyborg`: assert the right-arm/hand material's
     `metalness ≈ 0.8` and `roughness ≈ 0.3` (not the generic `limbColors`
     defaults of 0.1/0.6) — this is the canary for schema gap **G4** landing
     correctly.
   - `cyborg`: assert exactly ONE ear mesh exists (not zero, not two) and its
     `x` position is negative (organic/left side) — canary for **G5**.
   - `astronaut`: assert the helmet mesh's material has `transparent===true`
     and `opacity≈0.22` — canary for **G2**.
   - `professional`/`magician`: assert the shirt-V mesh's geometry
     `parameters.radialSegments === 3` (not 16) — canary for **G3**; without
     it the cone silhouette becomes a smooth wedge instead of a flat V, a
     visible (if subtle) regression.
   - `athlete`/`tech_expert`: assert a `TorusGeometry` mesh exists with the
     right `radius`/`tube` (and `arc≈π` for tech_expert) — canary for **G1**.
   - `wise_oracle`: assert `def.humanoid.gown === true` post-migration (not
     just that the skirt mesh still builds) so the renderer's
     `kind==='wise_oracle'` OR-clause can be safely deleted.
6. **Mesh order**: not asserted (Part 1's tables note legacy-then-declarative
   build order for the 5 members that mix both today — `cowboy`, `magician`,
   `wise_oracle`, and the two disney reuses — but nothing downstream depends
   on array order, only on final world transforms).
7. Run under the existing `esbuild`-bundle-and-serve pattern
   (`python3 -m http.server`, per the CORS note other renderer test pages
   carry) so dynamic imports of the compiled `three-renderer.js` +
   `avatar-packs/*.js` chunks resolve.

---

## Part 5 — proposed batch split

Per-kind mesh counts (from Part 1), used to balance the 3 batches by both
mesh volume and special-case risk (Part 2/3 gaps):

| Kind | Meshes | Risk flags |
|---|---|---|
| adult | 0 | none (no-op — confirm empty accessories list, delete the switch case) |
| child | 0 | none |
| alien | 0 | none |
| hacker | 1 | none |
| movie_star | 1 | none |
| cartoon_duck | 1 | none (2 members reuse it) |
| professional | 2 | **G3** (low-poly cone) |
| ninja_cyborg | 2 | **G4** (steel arm) |
| cyborg | 2 | **G4 + G5** (steel arm+leg, single ear) — highest risk |
| athlete | 2 | **G1** (torus) |
| robot | 3 | none |
| wise_oracle | 3 | force-gown fix (trivial) + twoHanded staff already present |
| magician | 4 | **G3** (low-poly cone) |
| ninja | 4 | none (shares katana meshes with ninja_cyborg) |
| supermodel | 4 | none |
| astronaut | 4 | **G2** (opacity) |
| teddy_bear | 5 | none |
| cartoon_dog | 5 | none (2 members reuse it) |
| cowboy | 5 | none |
| farmer | 5 | none |
| cartoon_mouse | 6 | none |
| tech_expert | 7 | **G1** (torus ×2, one with `arc=π`) — highest mesh count |

**Total: 66 meshes across 22 kind blocks** (24 members once disney's 2 reuse
entries are counted as free).

### Batch A — schema extensions first (prerequisite, ships G1–G5)

Not a kind-migration batch — implement the 5 schema extensions (Part 3) and
their `_buildPrimitiveMesh`/`matFor` consumers FIRST, with unit coverage in
the parity-test harness (Part 4 canaries), before any kind migrates. Nothing
downstream can port `cyborg`/`ninja_cyborg`/`professional`/`magician`/
`athlete`/`tech_expert`/`astronaut` correctly without this landing first.

### Batch B — low-risk, no schema gaps (13 kinds, 34 meshes)

`adult`(0), `child`(0), `alien`(0), `hacker`(1), `movie_star`(1),
`cartoon_duck`(1), `robot`(3), `ninja`(4, shares katana meshes with
ninja_cyborg — migrate together with Batch C's `ninja_cyborg` or duplicate the
2 shared meshes), `supermodel`(4), `teddy_bear`(5), `cartoon_dog`(5),
`cowboy`(5), `farmer`(5), `cartoon_mouse`(6). None of these touch G1–G5.
Good first PR to validate the parity-test harness itself cheaply before
tackling the risky kinds.

### Batch C — schema-gap-dependent kinds (7 kinds, 22 meshes) — do LAST, after Batch A lands

`professional`(2, G3), `ninja_cyborg`(2, G4), `cyborg`(2, G4+G5 — the single
riskiest kind: two independent gaps plus the eye-style/earSkip interplay
already field-driven around it), `athlete`(2, G1), `magician`(4, G3),
`astronaut`(4, G2), `tech_expert`(7, G1×2). Also carries the `wise_oracle`(3)
force-gown follow-up (no schema gap, but bundle it here since it's the other
"renderer OR-clause needs deleting" cleanup alongside `cyborg`'s ear-check
deletion, so the final PR that deletes `_addAvatarAccessories` and
`LegacyAvatarKind` entirely removes ALL kind-string branches — the accessory
switch, the gown OR, the steel-limb ternaries, and the single-ear check — in
one sweep with nothing left dangling).

After Batch C, delete: `_addAvatarAccessories` (whole function),
`AvatarDef.legacyAccessories` field + `LegacyAvatarKind` type (avatars.ts),
every `legacyAccessories: '<kind>'` line in the 7 pack files (replaced by
their new `accessories:` arrays), and the 3 kind-string special cases in
`_buildHumanoid` (gown OR, steelMat ternaries, single-ear if/else).
