import express, { Request, Response, Router } from 'express';
import * as defaultService from '../services/pokeapi';
import { GEN1_COUNT, GEN2_COUNT } from '../services/pokeapi';

interface PokemonService {
  getAllPokemon: typeof defaultService.getAllPokemon;
  getPokemonDetail: typeof defaultService.getPokemonDetail;
}

function createRouter(service?: PokemonService): Router {
  const { getAllPokemon, getPokemonDetail } = service || defaultService;
  const router = express.Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const pokemon = await getAllPokemon();
      res.render('index', { pokemon, GEN1_COUNT, GEN2_COUNT });
    } catch {
      res.status(500).render('index', { pokemon: [], GEN1_COUNT, GEN2_COUNT });
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
