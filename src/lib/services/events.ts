import { api, one, many, ALL, StrapiSingleResponse, StrapiCollectionResponse } from '../api';
import type { Event } from '../types';

const POPULATE = 'populate=*';

/**
 * Devuelve el evento ligado al usuario autenticado.
 * Asume que el User tiene una relación "event" ya resuelta en getMe().
 * Si se pasa el documentId del evento directamente, lo obtiene con toda su info.
 */
export async function getOne(documentId: string): Promise<Event> {
  const res = await api.get<StrapiSingleResponse<Event>>(
    `/events/${documentId}?${POPULATE}`,
  );
  return one(res);
}

/**
 * Lista todos los eventos (útil para un super-admin).
 */
export async function getAll(): Promise<Event[]> {
  const res = await api.get<StrapiCollectionResponse<Event>>('/events', {
    params: { ...ALL, populate: '*' },
  });
  return many(res);
}
