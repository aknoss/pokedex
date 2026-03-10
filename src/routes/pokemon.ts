import express, { Request, Response, Router } from 'express';
import * as defaultService from '../services/pokeapi';

interface PokemonService {
  getAllGen1Pokemon: typeof defaultService.getAllGen1Pokemon;
  getPokemonDetail: typeof defaultService.getPokemonDetail;
}

function createRouter(service?: PokemonService): Router {
  const { getAllGen1Pokemon, getPokemonDetail } = service || defaultService;
  const router = express.Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      const pokemon = await getAllGen1Pokemon();
      res.render('index', { pokemon });
    } catch {
      res.status(500).render('index', { pokemon: [] });
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
