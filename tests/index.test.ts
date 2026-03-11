import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockListen = vi.fn((_port: any, cb?: () => void) => { cb?.(); });
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
  getAllGen1Pokemon: vi.fn(),
}));

import { getAllGen1Pokemon } from '../src/services/pokeapi';

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  // Re-apply mocks after resetModules
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('server startup', () => {
  it('starts server after successful cache warming', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(getAllGen1Pokemon).mockResolvedValue([]);

    await import('../src/index');

    // Wait for the .then() chain to resolve
    await vi.waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cache warmed'));
    });

    expect(mockSet).toHaveBeenCalledWith('view engine', 'ejs');
    expect(mockSet).toHaveBeenCalledWith('views', expect.stringContaining('views'));
    expect(mockUse).toHaveBeenCalledWith('static-middleware');
    expect(mockUse).toHaveBeenCalledWith('/', mockRouter);
    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith('Warming Pokemon cache...');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Pokedex running'));

    consoleSpy.mockRestore();
  });

  it('starts server with fallback message when cache warming fails', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getAllGen1Pokemon).mockRejectedValue(new Error('network error'));

    await import('../src/index');

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to warm cache:', 'network error');
    });

    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('cache will load on first request'));

    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
