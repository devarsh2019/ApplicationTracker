export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  acceptTerms: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string>;
}
