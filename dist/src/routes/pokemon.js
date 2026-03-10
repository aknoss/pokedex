"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const express_1 = __importDefault(require("express"));
const defaultService = __importStar(require("../services/pokeapi"));
function createRouter(service) {
    const { getAllGen1Pokemon, getPokemonDetail } = service || defaultService;
    const router = express_1.default.Router();
    router.get('/', async (_req, res) => {
        try {
            const pokemon = await getAllGen1Pokemon();
            res.render('index', { pokemon });
        }
        catch {
            res.status(500).render('index', { pokemon: [] });
        }
    });
    router.get('/pokemon/:id', async (req, res) => {
        try {
            const pokemon = await getPokemonDetail(req.params.id);
            if (!pokemon) {
                return res.status(404).send('Pokemon not found');
            }
            res.render('detail', { pokemon });
        }
        catch {
            res.status(500).send('Error loading Pokemon');
        }
    });
    return router;
}
module.exports = createRouter;
