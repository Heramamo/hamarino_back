export interface AppRequestUser {
  sub: number;
  email: string;
  role: 'ADMIN' | 'PERSONAL';
  status: 'VALIDATE' | 'PENDING' | 'REFUSED';
}
