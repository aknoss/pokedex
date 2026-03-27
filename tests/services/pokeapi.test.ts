import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

const mockData = [
  {
    id: 1,
    name: 'bulbasaur',
    types: ['grass', 'poison'],
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
    stats: [
      { name: 'hp', value: 45 },
      { name: 'attack', value: 49 },
    ],
    abilities: [
      { name: 'overgrow', hidden: false },
      { name: 'chlorophyll', hidden: true },
    ],
    flavorText: 'A strange seed was planted on its back at birth.',
    moves: [{ name: 'tackle', type: 'normal', pp: 35 }],
  },
  {
    id: 2,
    name: 'ivysaur',
    types: ['grass', 'poison'],
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png',
    stats: [{ name: 'hp', value: 60 }],
    abilities: [{ name: 'overgrow', hidden: false }],
    flavorText: 'The bulb on its back grows bigger.',
    moves: [{ name: 'vine-whip', type: 'grass', pp: 25 }],
  },
];

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => JSON.stringify(mockData)),
  },
}));

let pokeapi: typeof import('../../src/services/pokeapi');

beforeEach(async () => {
  vi.resetModules();
  vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));
  pokeapi = await import('../../src/services/pokeapi');
});

describe('getAllPokemon', () => {
  it('returns all pokemon from the JSON data', async () => {
    const result = await pokeapi.getAllPokemon();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('bulbasaur');
    expect(result[1].name).toBe('ivysaur');
  });

  it('returns pokemon with correct shape', async () => {
    const result = await pokeapi.getAllPokemon();
    const bulbasaur = result[0];

    expect(bulbasaur).toEqual({
      id: 1,
      name: 'bulbasaur',
      types: ['grass', 'poison'],
      sprite: expect.stringContaining('/1.png'),
      stats: [
        { name: 'hp', value: 45 },
        { name: 'attack', value: 49 },
      ],
      abilities: [
        { name: 'overgrow', hidden: false },
        { name: 'chlorophyll', hidden: true },
      ],
      flavorText: 'A strange seed was planted on its back at birth.',
      moves: [{ name: 'tackle', type: 'normal', pp: 35 }],
    });
  });
});

describe('getPokemonDetail', () => {
  it('returns pokemon detail by ID', async () => {
    const result = await pokeapi.getPokemonDetail(1);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(1);
    expect(result!.name).toBe('bulbasaur');
    expect(result!.flavorText).toBe('A strange seed was planted on its back at birth.');
    expect(result!.moves).toEqual([{ name: 'tackle', type: 'normal', pp: 35 }]);
  });

  it('accepts string IDs', async () => {
    const result = await pokeapi.getPokemonDetail('1');
    expect(result).not.toBeNull();
    expect(result!.name).toBe('bulbasaur');
  });

  it('returns null for out-of-range IDs', async () => {
    expect(await pokeapi.getPokemonDetail(0)).toBeNull();
    expect(await pokeapi.getPokemonDetail(387)).toBeNull();
    expect(await pokeapi.getPokemonDetail(-1)).toBeNull();
    expect(await pokeapi.getPokemonDetail('abc')).toBeNull();
  });

  it('returns null for pokemon not in data', async () => {
    const result = await pokeapi.getPokemonDetail(100);
    expect(result).toBeNull();
  });
});

describe('constants', () => {
  it('exports generation counts', () => {
    expect(pokeapi.GEN1_COUNT).toBe(151);
    expect(pokeapi.GEN2_COUNT).toBe(251);
    expect(pokeapi.GEN3_COUNT).toBe(386);
  });
});
