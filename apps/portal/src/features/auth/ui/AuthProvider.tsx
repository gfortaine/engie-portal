import { type ReactNode, useEffect } from 'react';
import { useAppDispatch } from '@/app/providers/store';
import { setUser, logout } from '../model/authSlice';

const MOCK_USER = {
  sub: 'usr_001',
  email: 'marie.dupont@engie.com',
  name: 'Marie Dupont',
  tenantId: 'tenant_engie_fr',
  roles: ['customer', 'b2c'],
  avatar: undefined,
};

const AUTH_KEY = 'genie-auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (sessionStorage.getItem(AUTH_KEY) === 'true') {
      dispatch(setUser(MOCK_USER));
    } else {
      dispatch(logout());
    }
  }, [dispatch]);

  return <>{children}</>;
}
