import fs from 'fs';
import path from 'path';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const SPRITE_BASE =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
const TOTAL_POKEMON = 649;
const BATCH_SIZE = 20;

interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  stats: { name: string; value: number }[];
  abilities: { name: string; hidden: boolean }[];
  flavorText: string;
  moves: { name: string; type: string; pp: number }[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchInBatches<T>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(fn));
  }
}

async function fetchPokemon(id: number): Promise<Pokemon> {
  const [pokemonData, speciesData] = await Promise.all([
    fetchJson<any>(`${POKEAPI_BASE}/pokemon/${id}`),
    fetchJson<any>(`${POKEAPI_BASE}/pokemon-species/${id}`),
  ]);

  const levelUpMoves = pokemonData.moves.filter((m: any) =>
    m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up'),
  );

  const moveDetails = await Promise.all(
    levelUpMoves.map(async (m: any) => {
      const data = await fetchJson<any>(m.move.url);
      return { name: data.name, type: data.type.name, pp: data.pp };
    }),
  );

  const entry = speciesData.flavor_text_entries.find(
    (e: any) => e.language.name === 'en',
  );
  const flavorText = entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : '';

  return {
    id: pokemonData.id,
    name: pokemonData.name,
    types: pokemonData.types.map((t: any) => t.type.name),
    sprite: `${SPRITE_BASE}/${pokemonData.id}.png`,
    stats: pokemonData.stats.map((s: any) => ({
      name: s.stat.name,
      value: s.base_stat,
    })),
    abilities: pokemonData.abilities.map((a: any) => ({
      name: a.ability.name,
      hidden: a.is_hidden,
    })),
    flavorText,
    moves: moveDetails,
  };
}

async function main() {
  console.log(`Fetching ${TOTAL_POKEMON} Pokemon from PokeAPI...`);

  const pokemon: Pokemon[] = new Array(TOTAL_POKEMON);
  const ids = Array.from({ length: TOTAL_POKEMON }, (_, i) => i + 1);

  await fetchInBatches(ids, BATCH_SIZE, async (id) => {
    pokemon[id - 1] = await fetchPokemon(id);
    if (id % 50 === 0 || id === TOTAL_POKEMON) {
      console.log(`  ${id}/${TOTAL_POKEMON} done`);
    }
  });

  const outPath = path.join(process.cwd(), 'data', 'pokemon.json');
  fs.writeFileSync(outPath, JSON.stringify(pokemon, null, 2));
  console.log(`Wrote ${pokemon.length} Pokemon to ${outPath}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
