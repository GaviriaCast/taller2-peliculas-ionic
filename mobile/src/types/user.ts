export interface User {
  id: number;
  nombre: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  nombre: string;
}
