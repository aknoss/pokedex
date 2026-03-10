"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GEN1_COUNT = void 0;
exports.getAllGen1Pokemon = getAllGen1Pokemon;
exports.getPokemonDetail = getPokemonDetail;
exports.mapPokemon = mapPokemon;
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
const GEN1_COUNT = 151;
exports.GEN1_COUNT = GEN1_COUNT;
const cache = {
    pokemon: null,
    species: new Map(),
};
const moveCache = new Map();
async function fetchMoveDetails(moveUrl) {
    if (moveCache.has(moveUrl))
        return moveCache.get(moveUrl);
    const res = await fetch(moveUrl);
    if (!res.ok)
        return null;
    const data = await res.json();
    const move = {
        name: data.name,
        type: data.type.name,
        pp: data.pp,
    };
    moveCache.set(moveUrl, move);
    return move;
}
function mapPokemon(data) {
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
            .slice(0, 8)
            .map((m) => m.move.url),
    };
}
async function getAllGen1Pokemon() {
    if (cache.pokemon)
        return cache.pokemon;
    const ids = Array.from({ length: GEN1_COUNT }, (_, i) => i + 1);
    const results = await Promise.all(ids.map(async (id) => {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!res.ok)
            throw new Error(`Failed to fetch pokemon ${id}`);
        return mapPokemon(await res.json());
    }));
    cache.pokemon = results;
    return results;
}
async function getPokemonDetail(id) {
    const numId = Number(id);
    if (isNaN(numId) || numId < 1 || numId > GEN1_COUNT)
        return null;
    const all = await getAllGen1Pokemon();
    const pokemon = all.find((p) => p.id === numId);
    if (!pokemon)
        return null;
    if (!cache.species.has(numId)) {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${numId}`);
        if (!res.ok)
            return { ...pokemon, flavorText: '', moves: [] };
        const data = await res.json();
        const entry = data.flavor_text_entries.find((e) => e.language.name === 'en');
        const flavorText = entry ? entry.flavor_text.replace(/[\n\f]/g, ' ') : '';
        cache.species.set(numId, flavorText);
    }
    const moves = (await Promise.all(pokemon.moveRefs.map(fetchMoveDetails))).filter((m) => m !== null);
    return { ...pokemon, flavorText: cache.species.get(numId), moves };
}
