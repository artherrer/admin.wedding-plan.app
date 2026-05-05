import { api, one, many, ALL, StrapiSingleResponse, StrapiCollectionResponse } from '../api';
import type { Guest, GuestInput } from '../types';

const POPULATE = { populate: [
  'table',
  'companions',
  'event',
] };

export async function getAll(eventDocumentId?: string): Promise<Guest[]> {
  const res = await api.get<StrapiCollectionResponse<Guest>>('/guests', {
    params: {
      ...ALL,
      ...POPULATE,
      'sort': 'full_name:asc',
      ...(eventDocumentId && { 'filters[event][documentId][$eq]': eventDocumentId }),
    },
  });
  return many(res);
}

export async function getOne(documentId: string): Promise<Guest> {
  const res = await api.get<StrapiSingleResponse<Guest>>(
    `/guests/${documentId}`,
    { params: POPULATE },
  );
  return one(res);
}

export async function getByCode(uniqueCode: string): Promise<Guest | null> {
  const eventDocumentId = import.meta.env.VITE_EVENT_ID;
  const res = await api.get<StrapiSingleResponse<Guest>>(`/guests/invitation/${eventDocumentId}/${uniqueCode}`);
  console.warn('getByCode response', res);
  return one(res) || null;
}

export async function create(
  eventDocumentId: string,
  input: Omit<GuestInput, 'event'>,
): Promise<Guest> {
  const res = await api.post<StrapiSingleResponse<Guest>>('/guests', {
    data: { ...input, event: eventDocumentId },
  });
  return one(res);
}

export async function update(
  documentId: string,
  input: Partial<GuestInput>,
): Promise<Guest> {
  const res = await api.put<StrapiSingleResponse<Guest>>(
    `/guests/${documentId}`,
    { data: input },
  );
  return one(res);
}

export async function remove(documentId: string): Promise<void> {
  await api.delete(`/guests/${documentId}`);
}

export async function assignTable(
  guestDocumentId: string,
  tableDocumentId: string,
): Promise<Guest> {
  return update(guestDocumentId, { table: tableDocumentId });
}

export async function removeFromTable(guestDocumentId: string): Promise<Guest> {
  return update(guestDocumentId, { table: null });
}
