import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import createPokemonRoutes from './routes/pokemon';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/', createPokemonRoutes());

app.listen(PORT, () => {
  console.log(`Pokedex running at http://localhost:${PORT}`);
});
