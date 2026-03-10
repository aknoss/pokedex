"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const pokemon_1 = __importDefault(require("./src/routes/pokemon"));
const pokeapi_1 = require("./src/services/pokeapi");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(process.cwd(), 'views'));
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'public')));
app.use('/', (0, pokemon_1.default)());
console.log('Warming Pokemon cache...');
(0, pokeapi_1.getAllGen1Pokemon)()
    .then(() => {
    console.log('Cache warmed! All 151 Gen 1 Pokemon loaded.');
    app.listen(PORT, () => {
        console.log(`Pokedex running at http://localhost:${PORT}`);
    });
})
    .catch((err) => {
    console.error('Failed to warm cache:', err.message);
    app.listen(PORT, () => {
        console.log(`Pokedex running at http://localhost:${PORT} (cache will load on first request)`);
    });
});
