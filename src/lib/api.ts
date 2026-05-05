import axios, { AxiosError, AxiosResponse } from 'axios';

const BASE_URL = import.meta.env.VITE_STRAPI_API_URL;

if (!BASE_URL) {
  throw new Error('Missing env variable: VITE_STRAPI_API_URL');
}

// ─── Token ───────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'strapi_jwt';

export const token = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (jwt: string): void => { localStorage.setItem(TOKEN_KEY, jwt); },
  clear: (): void => { localStorage.removeItem(TOKEN_KEY); },
};

// ─── Instancia axios ──────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Agrega Authorization si hay token
api.interceptors.request.use((config) => {
  const jwt = token.get();
  if (jwt) {
    config.headers.Authorization = `Bearer ${jwt}`;
  }
  return config;
});

// Extrae el mensaje de error de Strapi
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (err: AxiosError<{ error?: { message?: string } }>) => {
    const msg =
      err.response?.data?.error?.message ??
      err.message ??
      'Error de red';
    return Promise.reject(new Error(msg));
  },
);

// ─── Normalización de respuestas Strapi v5 ────────────────────────────────────
// En v5 los datos son planos: { data: { id, documentId, ...fields } }
// Se reexportan como están — no hay wrapper "attributes".

export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}

export interface StrapiCollectionResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export function one<T>(res: AxiosResponse<StrapiSingleResponse<T>>): T {
  return res.data.data;
}

export function many<T>(res: AxiosResponse<StrapiCollectionResponse<T>>): T[] {
  return res.data.data;
}

// Params reutilizables para obtener todos los registros sin paginación corta.
// pageSize máximo configurable en Strapi; 1000 es suficiente para una boda.
export const ALL: Record<string, string | number> = {
  'pagination[pageSize]': 1000,
};
