import express, { Request, Response, Router } from 'express';
import * as defaultService from '../services/pokeapi';
import { GEN1_COUNT, GEN2_COUNT, GEN3_COUNT, GEN4_COUNT, GEN5_COUNT, GEN6_COUNT, GEN7_COUNT, GEN8_COUNT } from '../services/pokeapi';

interface PokemonService {
  getAllPokemon: typeof defaultService.getAllPokemon;
  getPokemonDetail: typeof defaultService.getPokemonDetail;
}

function createRouter(service?: PokemonService): Router {
  const { getAllPokemon, getPokemonDetail } = service || defaultService;
  const router = express.Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const pokemon = await getAllPokemon();
      const gen = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(req.query.gen as string) ? req.query.gen : 'all';
      res.render('index', { pokemon, GEN1_COUNT, GEN2_COUNT, GEN3_COUNT, GEN4_COUNT, GEN5_COUNT, GEN6_COUNT, GEN7_COUNT, GEN8_COUNT, gen });
    } catch {
      res.status(500).render('index', { pokemon: [], GEN1_COUNT, GEN2_COUNT, GEN3_COUNT, GEN4_COUNT, GEN5_COUNT, GEN6_COUNT, GEN7_COUNT, GEN8_COUNT, gen: 'all' });
    }
  });

  router.get('/pokemon/:id', async (req: Request, res: Response) => {
    try {
      const pokemon = await getPokemonDetail(req.params.id as string);
      if (!pokemon) {
        return res.status(404).send('Pokemon not found');
      }
      res.render('detail', { pokemon });
    } catch {
      res.status(500).send('Error loading Pokemon');
    }
  });

  return router;
}

export = createRouter;
