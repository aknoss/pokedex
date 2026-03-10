import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makePokemonResponse(id) {
  return {
    id,
    name: `pokemon-${id}`,
    types: [{ type: { name: 'normal' } }],
    stats: [{ stat: { name: 'hp' }, base_stat: 45 }],
    abilities: [{ ability: { name: 'overgrow' }, is_hidden: false }],
  };
}

function makeSpeciesResponse(flavorText = 'A cool Pokemon.') {
  return {
    flavor_text_entries: [
      { flavor_text: flavorText, language: { name: 'en' } },
    ],
  };
}

function mockFetch(handler) {
  global.fetch = vi.fn((url) => {
    const result = handler(url);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(result),
    });
  });
}

let pokeapi;

beforeEach(async () => {
  vi.resetModules();
  pokeapi = await import('../../src/services/pokeapi.js');
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
    });
  });
});

describe('getAllGen1Pokemon', () => {
  it('returns 151 Pokemon with correct shape', async () => {
    mockFetch((url) => {
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
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
    });
  });

  it('calls fetch 151 times (batches of 20)', async () => {
    mockFetch((url) => {
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
      return makePokemonResponse(id);
    });

    await pokeapi.getAllGen1Pokemon();
    expect(global.fetch).toHaveBeenCalledTimes(151);
  });

  it('caches results after first call', async () => {
    mockFetch((url) => {
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
      return makePokemonResponse(id);
    });

    await pokeapi.getAllGen1Pokemon();
    const callCount = global.fetch.mock.calls.length;

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
            types: [
              { type: { name: 'grass' } },
              { type: { name: 'poison' } },
            ],
            stats: [
              { stat: { name: 'hp' }, base_stat: 45 },
              { stat: { name: 'attack' }, base_stat: 49 },
            ],
            abilities: [
              { ability: { name: 'overgrow' }, is_hidden: false },
              { ability: { name: 'chlorophyll' }, is_hidden: true },
            ],
          }),
      })
    );

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
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false })
    );

    await expect(pokeapi.getAllGen1Pokemon()).rejects.toThrow('Failed to fetch pokemon');
  });
});

describe('getPokemonDetail', () => {
  function setupWithCache() {
    mockFetch((url) => {
      if (url.includes('pokemon-species')) {
        return makeSpeciesResponse();
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
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
    expect(result.id).toBe(1);
    expect(result.name).toBe('pokemon-1');
    expect(result.flavorText).toBe('A cool Pokemon.');
  });

  it('strips newlines and form feeds from flavor text', async () => {
    mockFetch((url) => {
      if (url.includes('pokemon-species')) {
        return makeSpeciesResponse('Line one\nLine two\fLine three');
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
      return makePokemonResponse(id);
    });

    const result = await pokeapi.getPokemonDetail(1);
    expect(result.flavorText).toBe('Line one Line two Line three');
  });

  it('returns empty flavorText when no English entry exists', async () => {
    mockFetch((url) => {
      if (url.includes('pokemon-species')) {
        return {
          flavor_text_entries: [
            { flavor_text: 'フシギダネ', language: { name: 'ja' } },
          ],
        };
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
      return makePokemonResponse(id);
    });

    const result = await pokeapi.getPokemonDetail(1);
    expect(result.flavorText).toBe('');
  });

  it('returns empty flavorText when species fetch fails', async () => {
    let pokemonFetchDone = false;
    global.fetch = vi.fn((url) => {
      if (url.includes('pokemon-species')) {
        return Promise.resolve({ ok: false });
      }
      const id = parseInt(url.match(/pokemon\/(\d+)/)[1]);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(makePokemonResponse(id)),
      });
    });

    const result = await pokeapi.getPokemonDetail(1);
    expect(result.flavorText).toBe('');
    expect(result.id).toBe(1);
  });

  it('caches species data across calls', async () => {
    setupWithCache();

    await pokeapi.getPokemonDetail(1);
    const callsBefore = global.fetch.mock.calls.filter(c =>
      c[0].includes('pokemon-species')
    ).length;

    await pokeapi.getPokemonDetail(1);
    const callsAfter = global.fetch.mock.calls.filter(c =>
      c[0].includes('pokemon-species')
    ).length;

    expect(callsAfter).toBe(callsBefore);
  });
});
