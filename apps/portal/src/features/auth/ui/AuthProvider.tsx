import { type ReactNode, useEffect } from 'react';
import { useAppDispatch } from '@/app/providers/store';
import { setUser } from '../model/authSlice';

const MOCK_USER = {
  sub: 'usr_001',
  email: 'marie.dupont@engie.com',
  name: 'Marie Dupont',
  tenantId: 'tenant_engie_fr',
  roles: ['customer', 'b2c'],
  avatar: undefined,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Mock: auto-login for demo — replace with oidc-client-ts in production
    dispatch(setUser(MOCK_USER));
  }, [dispatch]);

  return <>{children}</>;
}
