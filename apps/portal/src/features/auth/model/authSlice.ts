import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  sub: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  avatar?: string;
}

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = 'authenticated';
      state.error = null;
    },
    setLoading(state) {
      state.status = 'loading';
    },
    setError(state, action: PayloadAction<string>) {
      state.status = 'error';
      state.error = action.payload;
      state.user = null;
    },
    logout(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  selectors: {
    selectCurrentUser: (state) => state.user,
    selectAuthStatus: (state) => state.status,
    selectIsAuthenticated: (state) => state.status === 'authenticated',
  },
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export const { selectCurrentUser, selectAuthStatus, selectIsAuthenticated } = authSlice.selectors;
