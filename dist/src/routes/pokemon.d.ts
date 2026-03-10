import { Router } from 'express';
import * as defaultService from '../services/pokeapi';
interface PokemonService {
    getAllGen1Pokemon: typeof defaultService.getAllGen1Pokemon;
    getPokemonDetail: typeof defaultService.getPokemonDetail;
}
declare function createRouter(service?: PokemonService): Router;
export = createRouter;
