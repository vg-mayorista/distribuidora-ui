
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  zone?: string;
  latitude?: string;
  longitude?: string;
}

export interface AuthResponse {
  token: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  address?: string;
  phone?: string;
  zone?: string;
  latitude?: string;
  longitude?: string;
}


export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  address?: string;
  phone?: string;
  zone?: string;
  latitude?: string;
  longitude?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  address?: string;
  phone?: string;
  zone?: string;
  latitude?: string;
  longitude?: string;
}
