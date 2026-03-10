import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import createRouter from '../../src/routes/pokemon';

function mockRes() {
  const res: any = {
    render: vi.fn(),
    status: vi.fn(() => res),
    send: vi.fn(),
  };
  return res;
}

function getHandler(router: any, method: string, path: string) {
  const layer = router.stack.find(
    (l: any) => l.route && l.route.path === path && l.route.methods[method],
  );
  return layer.route.stack[0].handle;
}

let mockGetAll: Mock, mockGetDetail: Mock, router: any;

beforeEach(() => {
  mockGetAll = vi.fn();
  mockGetDetail = vi.fn();
  router = createRouter({
    getAllGen1Pokemon: mockGetAll,
    getPokemonDetail: mockGetDetail,
  });
});

describe('GET /', () => {
  it('renders index with pokemon array on success', async () => {
    const fakePokemon = [{ id: 1, name: 'bulbasaur' }];
    mockGetAll.mockResolvedValue(fakePokemon);

    const handler = getHandler(router, 'get', '/');
    const res = mockRes();
    await handler({}, res);

    expect(res.render).toHaveBeenCalledWith('index', { pokemon: fakePokemon });
  });

  it('renders index with empty array and 500 on error', async () => {
    mockGetAll.mockRejectedValue(new Error('API down'));

    const handler = getHandler(router, 'get', '/');
    const res = mockRes();
    await handler({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith('index', { pokemon: [] });
  });
});

describe('GET /pokemon/:id', () => {
  it('renders detail view with Pokemon data', async () => {
    const fakePokemon = { id: 25, name: 'pikachu' };
    mockGetDetail.mockResolvedValue(fakePokemon);

    const handler = getHandler(router, 'get', '/pokemon/:id');
    const req = { params: { id: '25' } };
    const res = mockRes();
    await handler(req, res);

    expect(mockGetDetail).toHaveBeenCalledWith('25');
    expect(res.render).toHaveBeenCalledWith('detail', { pokemon: fakePokemon });
  });

  it('returns 404 when Pokemon is null', async () => {
    mockGetDetail.mockResolvedValue(null);

    const handler = getHandler(router, 'get', '/pokemon/:id');
    const req = { params: { id: '999' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith('Pokemon not found');
  });

  it('returns 500 on service error', async () => {
    mockGetDetail.mockRejectedValue(new Error('fail'));

    const handler = getHandler(router, 'get', '/pokemon/:id');
    const req = { params: { id: '1' } };
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Error loading Pokemon');
  });
});
