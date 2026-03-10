const express = require('express');
const path = require('path');
const createPokemonRoutes = require('./src/routes/pokemon');
const { getAllGen1Pokemon } = require('./src/services/pokeapi');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', createPokemonRoutes());

console.log('Warming Pokemon cache...');
getAllGen1Pokemon().then(() => {
  console.log('Cache warmed! All 151 Gen 1 Pokemon loaded.');
  app.listen(PORT, () => {
    console.log(`Pokedex running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to warm cache:', err.message);
  app.listen(PORT, () => {
    console.log(`Pokedex running at http://localhost:${PORT} (cache will load on first request)`);
  });
});
