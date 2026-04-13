import { describe, it, expect } from 'vitest';
import { authSlice, setUser, logout, selectCurrentUser, selectAuthStatus } from './authSlice';

const mockUser = {
  sub: 'usr_001',
  email: 'test@engie.com',
  name: 'Test User',
  tenantId: 'tenant_test',
  roles: ['customer'],
};

describe('authSlice', () => {
  it('should handle initial state', () => {
    const state = authSlice.reducer(undefined, { type: 'unknown' });
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
    expect(state.error).toBeNull();
  });

  it('should handle setUser', () => {
    const state = authSlice.reducer(undefined, setUser(mockUser));
    expect(state.user).toEqual(mockUser);
    expect(state.status).toBe('authenticated');
    expect(state.error).toBeNull();
  });

  it('should handle logout', () => {
    const loggedInState = authSlice.reducer(undefined, setUser(mockUser));
    const state = authSlice.reducer(loggedInState, logout());
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('should select current user', () => {
    const rootState = { auth: authSlice.reducer(undefined, setUser(mockUser)) };
    expect(selectCurrentUser(rootState as any)).toEqual(mockUser);
  });

  it('should select auth status', () => {
    const rootState = { auth: authSlice.reducer(undefined, setUser(mockUser)) };
    expect(selectAuthStatus(rootState as any)).toBe('authenticated');
  });
});
