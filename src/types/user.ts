export type UserRole = 'CUSTOMER' | 'ADJUSTER' | 'ADMIN';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
}
