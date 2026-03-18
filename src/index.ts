import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import createPokemonRoutes from './routes/pokemon';
import { getAllPokemon } from './services/pokeapi';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/', createPokemonRoutes());

console.log('Warming Pokemon cache...');
getAllPokemon()
  .then(() => {
    console.log('Cache warmed! All 251 Gen 1 & 2 Pokemon loaded.');
    app.listen(PORT, () => {
      console.log(`Pokedex running at http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('Failed to warm cache:', err.message);
    app.listen(PORT, () => {
      console.log(`Pokedex running at http://localhost:${PORT} (cache will load on first request)`);
    });
  });
