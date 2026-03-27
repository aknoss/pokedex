import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockListen = vi.fn((_port: any, cb?: () => void) => {
  cb?.();
});
const mockSet = vi.fn();
const mockUse = vi.fn();
const mockApp = { set: mockSet, use: mockUse, listen: mockListen };

vi.mock('express', () => ({
  default: Object.assign(() => mockApp, { static: vi.fn(() => 'static-middleware') }),
}));

vi.mock('dotenv', () => ({
  default: { config: vi.fn() },
}));

const mockRouter = 'mock-router';
vi.mock('../src/routes/pokemon', () => ({
  default: vi.fn(() => mockRouter),
}));

vi.mock('../src/services/pokeapi', () => ({
  getAllPokemon: vi.fn(() => []),
  getPokemonDetail: vi.fn(),
  GEN1_COUNT: 151,
  GEN2_COUNT: 251,
  GEN3_COUNT: 386,
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('server startup', () => {
  it('starts server immediately', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await import('../src/index');

    expect(mockSet).toHaveBeenCalledWith('view engine', 'ejs');
    expect(mockSet).toHaveBeenCalledWith('views', expect.stringContaining('views'));
    expect(mockUse).toHaveBeenCalledWith('static-middleware');
    expect(mockUse).toHaveBeenCalledWith('/', mockRouter);
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Pokedex running'));

    consoleSpy.mockRestore();
  });
});
