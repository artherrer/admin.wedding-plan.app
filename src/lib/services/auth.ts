import { api, token } from '../api';
import type { AuthResponse, StrapiUser } from '../types';

/**
 * Login con identifier (username o email) y password.
 * Guarda el JWT en localStorage y devuelve la respuesta completa.
 */
export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>('/auth/local', { identifier, password });
  token.set(res.data.jwt);
  return res.data;
}

/**
 * Devuelve el usuario autenticado con su evento ligado.
 * Requiere que el content type User tenga una relación "event" con Event.
 */
export async function getMe(): Promise<StrapiUser> {
  const res = await api.get<StrapiUser>('/users/me', {
    params: { populate: '*' },
  });
  return res.data;
}

/** Limpia el token. No hay endpoint de logout en Strapi (JWT stateless). */
export function logout(): void {
  token.clear();
}
