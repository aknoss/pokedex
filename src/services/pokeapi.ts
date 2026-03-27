import fs from 'fs';
import path from 'path';

export const GEN1_COUNT = 151;
export const GEN2_COUNT = 251;
export const GEN3_COUNT = 386;
export const GEN4_COUNT = 493;

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  stats: { name: string; value: number }[];
  abilities: { name: string; hidden: boolean }[];
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

const dataPath = path.join(process.cwd(), 'data', 'pokemon.json');
const allPokemon: PokemonDetail[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

export async function getAllPokemon(): Promise<PokemonDetail[]> {
  return allPokemon;
}

export async function getPokemonDetail(id: string | number): Promise<PokemonDetail | null> {
  const numId = Number(id);
  if (isNaN(numId) || numId < 1 || numId > GEN4_COUNT) return null;
  return allPokemon.find((p) => p.id === numId) ?? null;
}
