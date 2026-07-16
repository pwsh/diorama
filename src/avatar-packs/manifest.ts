// Built-in avatar pack manifest — eagerly imported (tiny), but each pack BODY is
// loaded via dynamic import only (code-splitting gotcha mirrors three-renderer's:
// never statically import a pack data module into the startup graph).
//
// Each row:
//   { id, label, path, count, franchise?, load: () => import('./<id>.js') }
// where the imported module default-exports (or named-exports `pack`) an
// AvatarPackDef. The planner hydrates loaded packs on connect via `load()` +
// registerPack. Base packs (no franchise flag) default loaded+active; franchise
// packs default UNLOADED (opt-in via Settings ▸ Avatars).

import type { AvatarPackDef } from '../avatars.js';

export interface PackManifestRow {
  id: string;
  label: string;
  path: string[];
  count: number;
  franchise?: boolean;
  load: () => Promise<{ default?: AvatarPackDef; pack?: AvatarPackDef }>;
}

export const AVATAR_PACK_MANIFEST: PackManifestRow[] = [
  // ── Base-group packs — builtin, default loaded+active. The 23 legacy kinds
  // that moved out of core live here alongside the C2-generated members.
  { id: 'base-humans', label: 'Humans', path: ['Base', 'Humans'], count: 4,
    load: () => import('./base-humans.js') },
  { id: 'base-careers', label: 'Careers', path: ['Base', 'Careers'], count: 20,
    load: () => import('./base-careers.js') },
  { id: 'base-robotic', label: 'Robotic', path: ['Base', 'Robotic'], count: 8,
    load: () => import('./base-robotic.js') },
  { id: 'base-aliens', label: 'Aliens', path: ['Base', 'Aliens'], count: 6,
    load: () => import('./base-aliens.js') },
  { id: 'base-scifi', label: 'Sci-Fi', path: ['Base', 'Sci-Fi'], count: 7,
    load: () => import('./base-scifi.js') },
  { id: 'base-pop-culture', label: 'Pop Culture', path: ['Base', 'Pop Culture'], count: 15,
    load: () => import('./base-pop-culture.js') },
  { id: 'base-domestic-animals', label: 'Domestic Animals', path: ['Base', 'Domestic Animals'], count: 8,
    load: () => import('./base-domestic-animals.js') },
  { id: 'base-farm-animals', label: 'Farm Animals', path: ['Base', 'Farm Animals'], count: 8,
    load: () => import('./base-farm-animals.js') },
  { id: 'base-zoo-animals', label: 'Zoo Animals', path: ['Base', 'Zoo Animals'], count: 12,
    load: () => import('./base-zoo-animals.js') },

  // ── Franchise packs — builtin, default UNLOADED (novelty opt-in). Stylized
  // geometric homage figures; labels are descriptive-generic.
  { id: 'star-trek-tng', label: 'Star Trek: TNG crew', path: ['Sci-Fi', 'Star Trek', 'Next Generation'], count: 8,
    franchise: true, load: () => import('./star-trek-tng.js') },
  { id: 'star-trek-ds9', label: 'Star Trek: DS9 crew', path: ['Sci-Fi', 'Star Trek', 'Deep Space Nine'], count: 8,
    franchise: true, load: () => import('./star-trek-ds9.js') },
  { id: 'star-wars-ot', label: 'Star Wars: Original Trilogy', path: ['Sci-Fi', 'Star Wars', 'Original Trilogy'], count: 11,
    franchise: true, load: () => import('./star-wars-ot.js') },
  { id: 'star-wars-mandalorian', label: 'Star Wars: The Mandalorian', path: ['Sci-Fi', 'Star Wars', 'The Mandalorian'], count: 9,
    franchise: true, load: () => import('./star-wars-mandalorian.js') },
  { id: 'star-wars-prequels', label: 'Star Wars: Prequel Trilogy', path: ['Sci-Fi', 'Star Wars', 'Prequel Trilogy'], count: 8,
    franchise: true, load: () => import('./star-wars-prequels.js') },
  { id: 'stranger-things', label: 'Stranger Things', path: ['Sci-Fi', 'Stranger Things'], count: 9,
    franchise: true, load: () => import('./stranger-things.js') },
  { id: 'avatar-pandora', label: 'Avatar (Pandora)', path: ['Sci-Fi', 'Avatar'], count: 7,
    franchise: true, load: () => import('./avatar-pandora.js') },
  { id: 'power-rangers-mighty-morphin', label: 'Power Rangers: Mighty Morphin', path: ['Sci-Fi', 'Power Rangers', 'Mighty Morphin'], count: 10,
    franchise: true, load: () => import('./power-rangers-mighty-morphin.js') },
  { id: 'marvel-avengers', label: 'Marvel: The Avengers', path: ['Sci-Fi', 'Marvel', 'The Avengers'], count: 10,
    franchise: true, load: () => import('./marvel-avengers.js') },
  { id: 'transformers', label: 'Transformers (G1)', path: ['Sci-Fi', 'Transformers'], count: 7,
    franchise: true, load: () => import('./transformers.js') },
  { id: 'firefly', label: 'Firefly (Serenity crew)', path: ['Sci-Fi', 'Firefly'], count: 9,
    franchise: true, load: () => import('./firefly.js') },
  { id: 'tv-big-bang-theory', label: 'The Big Bang Theory', path: ['Pop Culture', 'TV Shows', 'The Big Bang Theory'], count: 7,
    franchise: true, load: () => import('./tv-big-bang-theory.js') },
  { id: 'tv-breaking-bad', label: 'Breaking Bad', path: ['Pop Culture', 'TV Shows', 'Breaking Bad'], count: 8,
    franchise: true, load: () => import('./tv-breaking-bad.js') },
  { id: 'tv-game-of-thrones', label: 'Game of Thrones', path: ['Pop Culture', 'TV Shows', 'Game of Thrones'], count: 8,
    franchise: true, load: () => import('./tv-game-of-thrones.js') },
  { id: 'tv-squid-game', label: 'Squid Game', path: ['Pop Culture', 'TV Shows', 'Squid Game'], count: 9,
    franchise: true, load: () => import('./tv-squid-game.js') },
  { id: 'tv-money-heist', label: 'Money Heist', path: ['Pop Culture', 'TV Shows', 'Money Heist'], count: 8,
    franchise: true, load: () => import('./tv-money-heist.js') },
  { id: 'tv-the-office', label: 'The Office', path: ['Pop Culture', 'TV Shows', 'The Office'], count: 8,
    franchise: true, load: () => import('./tv-the-office.js') },
  { id: 'tv-fresh-prince-of-bel-air', label: 'The Fresh Prince of Bel-Air', path: ['Pop Culture', 'TV Shows', 'The Fresh Prince of Bel-Air'], count: 7,
    franchise: true, load: () => import('./tv-fresh-prince-of-bel-air.js') },
  { id: 'tv-friends', label: 'Friends', path: ['Pop Culture', 'TV Shows', 'Friends'], count: 6,
    franchise: true, load: () => import('./tv-friends.js') },
  { id: 'tv-i-love-lucy', label: 'I Love Lucy', path: ['Pop Culture', 'TV Shows', 'I Love Lucy'], count: 6,
    franchise: true, load: () => import('./tv-i-love-lucy.js') },
  { id: 'tv-seinfeld', label: 'Seinfeld', path: ['Pop Culture', 'TV Shows', 'Seinfeld'], count: 8,
    franchise: true, load: () => import('./tv-seinfeld.js') },
  { id: 'tv-it-crowd', label: 'The IT Crowd', path: ['Pop Culture', 'TV Shows', 'The IT Crowd'], count: 6,
    franchise: true, load: () => import('./tv-it-crowd.js') },
  { id: 'movies-lotr', label: 'The Lord of the Rings', path: ['Pop Culture', 'Movies', 'The Lord of the Rings'], count: 10,
    franchise: true, load: () => import('./movies-lotr.js') },
  { id: 'movies-harry-potter', label: 'Harry Potter', path: ['Pop Culture', 'Movies', 'Harry Potter'], count: 8,
    franchise: true, load: () => import('./movies-harry-potter.js') },
  { id: 'movies-pirates-caribbean', label: 'Pirates of the Caribbean', path: ['Pop Culture', 'Movies', 'Pirates of the Caribbean'], count: 6,
    franchise: true, load: () => import('./movies-pirates-caribbean.js') },
  { id: 'movies-wizard-of-oz', label: 'The Wizard of Oz', path: ['Pop Culture', 'Movies', 'The Wizard of Oz'], count: 8,
    franchise: true, load: () => import('./movies-wizard-of-oz.js') },
  { id: 'zelda', label: 'The Legend of Zelda', path: ['Video Games', 'The Legend of Zelda'], count: 7,
    franchise: true, load: () => import('./zelda.js') },
  { id: 'metroid', label: 'Metroid', path: ['Video Games', 'Metroid'], count: 8,
    franchise: true, load: () => import('./metroid.js') },
  { id: 'animal-crossing', label: 'Animal Crossing', path: ['Video Games', 'Animal Crossing'], count: 8,
    franchise: true, load: () => import('./animal-crossing.js') },
  { id: 'pokemon', label: 'Pokémon', path: ['Video Games', 'Pokémon'], count: 9,
    franchise: true, load: () => import('./pokemon.js') },
  { id: 'mario', label: 'Mario', path: ['Video Games', 'Mario'], count: 9,
    franchise: true, load: () => import('./mario.js') },
  { id: 'lego', label: 'LEGO minifigures', path: ['Video Games', 'LEGO'], count: 8,
    franchise: true, load: () => import('./lego.js') },
  { id: 'minecraft', label: 'Minecraft', path: ['Video Games', 'Minecraft'], count: 8,
    franchise: true, load: () => import('./minecraft.js') },
  { id: 'sonic-the-hedgehog', label: 'Sonic the Hedgehog', path: ['Video Games', 'Sonic the Hedgehog'], count: 7,
    franchise: true, load: () => import('./sonic-the-hedgehog.js') },
  { id: 'league-of-legends', label: 'League of Legends', path: ['Video Games', 'League of Legends'], count: 8,
    franchise: true, load: () => import('./league-of-legends.js') },
  { id: 'genshin-impact', label: 'Genshin Impact', path: ['Video Games', 'Genshin Impact'], count: 8,
    franchise: true, load: () => import('./genshin-impact.js') },
  { id: 'pac-man', label: 'Pac-Man', path: ['Video Games', 'Pac-Man'], count: 6,
    franchise: true, load: () => import('./pac-man.js') },
  { id: 'street-fighter', label: 'Street Fighter', path: ['Video Games', 'Street Fighter'], count: 8,
    franchise: true, load: () => import('./street-fighter.js') },
  { id: 'halo', label: 'Halo', path: ['Video Games', 'Halo'], count: 7,
    franchise: true, load: () => import('./halo.js') },
  { id: 'overwatch', label: 'Overwatch', path: ['Video Games', 'Overwatch'], count: 8,
    franchise: true, load: () => import('./overwatch.js') },
  { id: 'disney-princess', label: 'Disney Princess', path: ['Cartoons', 'Disney Princess'], count: 10,
    franchise: true, load: () => import('./disney-princess.js') },
  { id: 'my-little-pony', label: 'My Little Pony', path: ['Cartoons', 'My Little Pony'], count: 6,
    franchise: true, load: () => import('./my-little-pony.js') },
  { id: 'he-man', label: 'He-Man', path: ['Cartoons', 'He-Man'], count: 8,
    franchise: true, load: () => import('./he-man.js') },
  { id: 'tmnt', label: 'Teenage Mutant Ninja Turtles', path: ['Cartoons', 'Teenage Mutant Ninja Turtles'], count: 7,
    franchise: true, load: () => import('./tmnt.js') },
  { id: 'disney-animals', label: 'Disney Animals (classic)', path: ['Cartoons', 'Disney Animals'], count: 9,
    franchise: true, load: () => import('./disney-animals.js') },
  { id: 'despicable-me', label: 'Despicable Me', path: ['Cartoons', 'Despicable Me'], count: 10,
    franchise: true, load: () => import('./despicable-me.js') },
  { id: 'shrek', label: 'Shrek', path: ['Cartoons', 'Shrek'], count: 7,
    franchise: true, load: () => import('./shrek.js') },
  { id: 'toy-story', label: 'Toy Story', path: ['Cartoons', 'Toy Story'], count: 8,
    franchise: true, load: () => import('./toy-story.js') },
];
