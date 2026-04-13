export interface User {
  sub: string;
  email: string;
  name: string;
  tenantId: string;
  roles: string[];
  avatar?: string;
  phone?: string;
  address?: string;
}
