import { QueryClient } from '@tanstack/react-query';

jest.mock('../src/services/authStorage', () => ({
  getSession: jest.fn(),
  clearSession: jest.fn(),
}));

import { apiClient } from '../src/api/client';
import * as authStorage from '../src/services/authStorage';
import { queryClient } from '../src/config/queryClient';

describe('apiClient interceptors', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('does not add Authorization when no session exists', async () => {
    (authStorage.getSession as jest.Mock).mockResolvedValue(null);

    const handlers = (apiClient as any).interceptors.request.handlers;
    const handler = handlers[handlers.length - 1].fulfilled;

    const config = { headers: {} } as any;
    const out = await handler(config);

    expect(out.headers.Authorization).toBeUndefined();
  });

  it('adds Authorization header when session token exists', async () => {
    (authStorage.getSession as jest.Mock).mockResolvedValue({ token: 'token-abc' });

    const handlers = (apiClient as any).interceptors.request.handlers;
    const handler = handlers[handlers.length - 1].fulfilled;

    const config = { headers: {} } as any;
    const out = await handler(config);

    expect(out.headers.Authorization).toBe('Bearer token-abc');
  });

  it('clears session and invalidates auth queries on 401', async () => {
    (authStorage.clearSession as jest.Mock).mockResolvedValue(undefined);
    const removeSpy = jest.spyOn(queryClient, 'removeQueries');

    const handlers = (apiClient as any).interceptors.response.handlers;
    const rejected = handlers[handlers.length - 1].rejected;

    const error = { response: { status: 401 } } as any;

    await expect(rejected(error)).rejects.toBeDefined();

    expect(authStorage.clearSession).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['auth'] });
  });
});
