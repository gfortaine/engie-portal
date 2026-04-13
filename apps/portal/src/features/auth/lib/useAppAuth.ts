import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/providers/store';
import { selectCurrentUser, selectAuthStatus, logout } from '../model/authSlice';

export function useAppAuth() {
  const user = useAppSelector(selectCurrentUser);
  const status = useAppSelector(selectAuthStatus);
  const dispatch = useAppDispatch();

  const signOut = useCallback(() => {
    sessionStorage.removeItem('genie-auth');
    dispatch(logout());
  }, [dispatch]);

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    signOut,
  };
}
