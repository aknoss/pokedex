import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';

function makePokemonResponse(id: number) {
  return {
    id,
    name: `pokemon-${id}`,
    types: [{ type: { name: 'normal' } }],
    stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
    abilities: [{ ability: { name: 'overgrow' }, is_hidden: false }],
    moves: [
      {
        move: { name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/' },
        version_group_details: [{ move_learn_method: { name: 'level-up' }, level_learned_at: 1 }],
      },
    ],
  };
}

function makeSpeciesResponse(flavorText = 'A cool Pokemon.') {
  return {
    flavor_text_entries: [{ flavor_text: flavorText, language: { name: 'en' } }],
  };
}

function mockFetch(handler: (url: string) => any) {
  global.fetch = vi.fn((url: any) => {
    const result = handler(url as string);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(result),
    });
  }) as Mock;
}

let pokeapi: typeof import('../../src/services/pokeapi');

beforeEach(async () => {
  vi.resetModules();
  pokeapi = await import('../../src/services/pokeapi');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mapPokemon', () => {
  it('maps raw API data to app shape', () => {
    const raw = {
      id: 1,
      name: 'bulbasaur',
      types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
      stats: [
        { stat: { name: 'hp' }, base_stat: 45 },
        { stat: { name: 'attack' }, base_stat: 49 },
      ],
      abilities: [
        { ability: { name: 'overgrow' }, is_hidden: false },
        { ability: { name: 'chlorophyll' }, is_hidden: true },
      ],
      moves: [
        {
          move: { name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/' },
          version_group_details: [{ move_learn_method: { name: 'level-up' }, level_learned_at: 1 }],
        },
      ],
    };

    const result = pokeapi.mapPokemon(raw);

    expect(result).toEqual({
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
      moveRefs: ['https://pokeapi.co/api/v2/move/33/'],
    });
  });
});

describe('getAllGen1Pokemon', () => {
  it('returns 151 Pokemon with correct shape', async () => {
    mockFetch((url) => {
      const id = parseInt(url.match(/pokemon\/(\d+)/)![1]);
      return makePokemonResponse(id);
    });

    const result = await pokeapi.getAllGen1Pokemon();
    expect(result).toHaveLength(151);
    expect(result[0]).toEqual({
      id: 1,
      name: 'pokemon-1',
      types: ['normal'],
      sprite: expect.stringContaining('/1.png'),
      stats: [{ name: 'hp', value: 45 }],
      abilities: [{ name: 'overgrow', hidden: false }],
      moveRefs: ['https://pokeapi.co/api/v2/move/33/'],
    });
  });

  it('calls fetch 151 times', async () => {
    mockFetch((url) => {
      const id = parseInt(url.match(/pokemon\/(\d+)/)![1]);
      return makePokemonResponse(id);
    });

    await pokeapi.getAllGen1Pokemon();
    expect(global.fetch).toHaveBeenCalledTimes(151);
  });

  it('caches results after first call', async () => {
    mockFetch((url) => {
      const id = parseInt(url.match(/pokemon\/(\d+)/)![1]);
      return makePokemonResponse(id);
    });

    await pokeapi.getAllGen1Pokemon();
    const callCount = (global.fetch as Mock).mock.calls.length;

    await pokeapi.getAllGen1Pokemon();
    expect(global.fetch).toHaveBeenCalledTimes(callCount);
  });

  it('maps types, stats, and abilities correctly', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 1,
            name: 'bulbasaur',
            types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
            stats: [
              { stat: { name: 'hp' }, base_stat: 45 },
              { stat: { name: 'attack' }, base_stat: 49 },
            ],
            abilities: [
              { ability: { name: 'overgrow' }, is_hidden: false },
              { ability: { name: 'chlorophyll' }, is_hidden: true },
            ],
            moves: [
              {
                move: { name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/' },
                version_group_details: [
                  { move_learn_method: { name: 'level-up' }, level_learned_at: 1 },
                ],
              },
            ],
          }),
      }),
    ) as Mock;

    const result = await pokeapi.getAllGen1Pokemon();
    const bulbasaur = result[0];

    expect(bulbasaur.types).toEqual(['grass', 'poison']);
    expect(bulbasaur.stats).toEqual([
      { name: 'hp', value: 45 },
      { name: 'attack', value: 49 },
    ]);
    expect(bulbasaur.abilities).toEqual([
      { name: 'overgrow', hidden: false },
      { name: 'chlorophyll', hidden: true },
    ]);
  });

  it('propagates fetch errors', async () => {
    global.fetch = vi.fn(() => Promise.resolve({ ok: false })) as Mock;

    await expect(pokeapi.getAllGen1Pokemon()).rejects.toThrow('Failed to fetch pokemon');
  });
});

describe('getPokemonDetail', () => {
  function makeMoveResponse() {
    return { name: 'tackle', type: { name: 'normal' }, pp: 35 };
  }

  function setupWithCache() {
    mockFetch((url) => {
      if (url.includes('pokemon-species')) {
        return makeSpeciesResponse();
      }
      if (url.includes('/move/')) {
        return makeMoveResponse();
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)![1]);
      return makePokemonResponse(id);
    });
  }

  it('returns null for out-of-range IDs', async () => {
    setupWithCache();
    expect(await pokeapi.getPokemonDetail(0)).toBeNull();
    expect(await pokeapi.getPokemonDetail(152)).toBeNull();
    expect(await pokeapi.getPokemonDetail(-1)).toBeNull();
    expect(await pokeapi.getPokemonDetail('abc')).toBeNull();
  });

  it('returns Pokemon with flavorText', async () => {
    setupWithCache();

    const result = await pokeapi.getPokemonDetail(1);
    expect(result!.id).toBe(1);
    expect(result!.name).toBe('pokemon-1');
    expect(result!.flavorText).toBe('A cool Pokemon.');
  });

  it('strips newlines and form feeds from flavor text', async () => {
    mockFetch((url) => {
      if (url.includes('pokemon-species')) {
        return makeSpeciesResponse('Line one\nLine two\fLine three');
      }
      if (url.includes('/move/')) {
        return { name: 'tackle', type: { name: 'normal' }, pp: 35 };
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)![1]);
      return makePokemonResponse(id);
    });

    const result = await pokeapi.getPokemonDetail(1);
    expect(result!.flavorText).toBe('Line one Line two Line three');
  });

  it('returns empty flavorText when no English entry exists', async () => {
    mockFetch((url) => {
      if (url.includes('pokemon-species')) {
        return {
          flavor_text_entries: [{ flavor_text: 'フシギダネ', language: { name: 'ja' } }],
        };
      }
      if (url.includes('/move/')) {
        return { name: 'tackle', type: { name: 'normal' }, pp: 35 };
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)![1]);
      return makePokemonResponse(id);
    });

    const result = await pokeapi.getPokemonDetail(1);
    expect(result!.flavorText).toBe('');
  });

  it('returns empty flavorText when species fetch fails', async () => {
    global.fetch = vi.fn((url: any) => {
      if ((url as string).includes('pokemon-species')) {
        return Promise.resolve({ ok: false });
      }
      if ((url as string).includes('/move/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ name: 'tackle', type: { name: 'normal' }, pp: 35 }),
        });
      }
      const id = parseInt((url as string).match(/pokemon\/(\d+)/)![1]);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makePokemonResponse(id)),
      });
    }) as Mock;

    const result = await pokeapi.getPokemonDetail(1);
    expect(result!.flavorText).toBe('');
    expect(result!.id).toBe(1);
  });

  it('filters out moves when move fetch fails', async () => {
    global.fetch = vi.fn((url: any) => {
      if ((url as string).includes('pokemon-species')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(makeSpeciesResponse()),
        });
      }
      if ((url as string).includes('/move/')) {
        return Promise.resolve({ ok: false });
      }
      const id = parseInt((url as string).match(/pokemon\/(\d+)/)![1]);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makePokemonResponse(id)),
      });
    }) as Mock;

    const result = await pokeapi.getPokemonDetail(1);
    expect(result!.moves).toEqual([]);
  });

  it('returns null when pokemon not found in cache', async () => {
    // Load cache with pokemon that has mismatched IDs
    global.fetch = vi.fn((url: any) => {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 200, // ID outside 1-151 range in the returned data
            name: 'fake',
            types: [{ type: { name: 'normal' } }],
            stats: [],
            abilities: [],
            moves: [],
          }),
      });
    }) as Mock;

    await pokeapi.getAllGen1Pokemon();
    // numId=1 is valid range but find() won't match since all cached pokemon have id=200
    const result = await pokeapi.getPokemonDetail(1);
    expect(result).toBeNull();
  });

  it('caches species data across calls', async () => {
    setupWithCache();

    await pokeapi.getPokemonDetail(1);
    const callsBefore = (global.fetch as Mock).mock.calls.filter((c: any) =>
      c[0].includes('pokemon-species'),
    ).length;

    await pokeapi.getPokemonDetail(1);
    const callsAfter = (global.fetch as Mock).mock.calls.filter((c: any) =>
      c[0].includes('pokemon-species'),
    ).length;

    expect(callsAfter).toBe(callsBefore);
  });
});
