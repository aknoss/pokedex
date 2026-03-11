const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
export const GEN1_COUNT = 151;

interface RawPokemonType {
  type: { name: string };
}

interface RawPokemonStat {
  stat: { name: string };
  base_stat: number;
}

interface RawPokemonAbility {
  ability: { name: string };
  is_hidden: boolean;
}

interface RawMoveVersionDetail {
  move_learn_method: { name: string };
  level_learned_at: number;
}

interface RawPokemonMove {
  move: { name: string; url: string };
  version_group_details: RawMoveVersionDetail[];
}

interface RawPokemonData {
  id: number;
  name: string;
  types: RawPokemonType[];
  stats: RawPokemonStat[];
  abilities: RawPokemonAbility[];
  moves: RawPokemonMove[];
}

interface RawMoveData {
  name: string;
  type: { name: string };
  pp: number;
}

interface RawFlavorTextEntry {
  flavor_text: string;
  language: { name: string };
}

interface RawSpeciesData {
  flavor_text_entries: RawFlavorTextEntry[];
}

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  stats: { name: string; value: number }[];
  abilities: { name: string; hidden: boolean }[];
  moveRefs: string[];
}

export interface Move {
  name: string;
  type: string;
  pp: number;
}

export interface PokemonDetail extends Pokemon {
  flavorText: string;
  moves: Move[];
}

const cache: {
  pokemon: Pokemon[] | null;
  species: Map<number, string>;
} = {
  pokemon: null,
  species: new Map(),
};

const moveCache = new Map<string, Move>();

async function fetchMoveDetails(moveUrl: string): Promise<Move | null> {
  if (moveCache.has(moveUrl)) return moveCache.get(moveUrl)!;
  const res = await fetch(moveUrl);
  if (!res.ok) return null;
  const data: RawMoveData = await res.json();
  const move: Move = {
    name: data.name,
    type: data.type.name,
    pp: data.pp,
  };
  moveCache.set(moveUrl, move);
  return move;
}

export function mapPokemon(data: RawPokemonData): Pokemon {
  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t) => t.type.name),
    sprite: `${SPRITE_BASE}/${data.id}.png`,
    stats: data.stats.map((s) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    abilities: data.abilities.map((a) => ({
      name: a.ability.name,
      hidden: a.is_hidden,
    })),
    moveRefs: data.moves
      .filter((m) => m.version_group_details.some((v) => v.move_learn_method.name === 'level-up'))
      .map((m) => m.move.url),
  };
}

export async function getAllGen1Pokemon(): Promise<Pokemon[]> {
  if (cache.pokemon) return cache.pokemon;

  const ids = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1);
  const results = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch pokemon ${id}`);
      return mapPokemon(await res.json());
    }),
  );

  cache.pokemon = results;
  return results;
}

export async function getPokemonDetail(id: string | number): Promise<PokemonDetail | null> {
  const numId = Number(id);
  if (isNaN(numId) || numId < 1 || numId > GEN1_COUNT) return null;

  const all = await getAllGen1Pokemon();
  const pokemon = all.find((p) => p.id === numId);

  if (!pokemon) return null;

  if (!cache.species.has(numId)) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${numId}`);
    if (!res.ok) return { ...pokemon, flavorText: '', moves: [] };
    const data: RawSpeciesData = await res.json();

    const entry = data.flavor_text_entries.find((e) => e.language.name === 'en');
    const flavorText = entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : '';

    cache.species.set(numId, flavorText);
  }

  const moves = (await Promise.all(pokemon.moveRefs.map(fetchMoveDetails))).filter(
    (m): m is Move => m !== null,
  );

  return { ...pokemon, flavorText: cache.species.get(numId)!, moves };
}
