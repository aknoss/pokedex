declare const GEN1_COUNT = 151;
interface RawPokemonType {
    type: {
        name: string;
    };
}
interface RawPokemonStat {
    stat: {
        name: string;
    };
    base_stat: number;
}
interface RawPokemonAbility {
    ability: {
        name: string;
    };
    is_hidden: boolean;
}
interface RawMoveVersionDetail {
    move_learn_method: {
        name: string;
    };
    level_learned_at: number;
}
interface RawPokemonMove {
    move: {
        name: string;
        url: string;
    };
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
interface Pokemon {
    id: number;
    name: string;
    types: string[];
    sprite: string;
    stats: {
        name: string;
        value: number;
    }[];
    abilities: {
        name: string;
        hidden: boolean;
    }[];
    moveRefs: string[];
}
interface Move {
    name: string;
    type: string;
    pp: number;
}
interface PokemonDetail extends Pokemon {
    flavorText: string;
    moves: Move[];
}
declare function mapPokemon(data: RawPokemonData): Pokemon;
declare function getAllGen1Pokemon(): Promise<Pokemon[]>;
declare function getPokemonDetail(id: string | number): Promise<PokemonDetail | null>;
export { getAllGen1Pokemon, getPokemonDetail, mapPokemon, GEN1_COUNT };
export type { Pokemon, PokemonDetail, Move };
