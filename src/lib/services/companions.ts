import { api, one, many, ALL, StrapiSingleResponse, StrapiCollectionResponse } from '../api';
import type { Companion, CompanionInput } from '../types';

const POPULATE = { populate: '*' };

export async function getByGuest(guestDocumentId: string): Promise<Companion[]> {
  const res = await api.get<StrapiCollectionResponse<Companion>>('/companions', {
    params: {
      ...ALL,
      'filters[guest][documentId][$eq]': guestDocumentId,
      'sort': 'createdAt:asc',
    },
  });
  return many(res);
}

export async function getAll(eventDocumentId?: string): Promise<Companion[]> {
  const res = await api.get<StrapiCollectionResponse<Companion>>('/companions', {
    params: {
      ...ALL,
      ...POPULATE,
      'sort': 'full_name:asc',
      ...(eventDocumentId && { 'filters[event][documentId][$eq]': eventDocumentId }),
    },
  });
  return many(res);
}

export async function getOne(documentId: string): Promise<Companion> {
  const res = await api.get<StrapiSingleResponse<Companion>>(
    `/companions/${documentId}`,
    { params: POPULATE },
  );
  return one(res);
}

export async function create(
  guestDocumentId: string,
  input: Omit<CompanionInput, 'guest'>,
): Promise<Companion> {
  const res = await api.post<StrapiSingleResponse<Companion>>('/companions', {
    data: { ...input, guest: guestDocumentId },
  });
  return one(res);
}

export async function update(
  documentId: string,
  input: Partial<Omit<CompanionInput, 'guest'>>,
): Promise<Companion> {
  const res = await api.put<StrapiSingleResponse<Companion>>(
    `/companions/${documentId}`,
    { data: input },
  );
  return one(res);
}

export async function remove(documentId: string): Promise<void> {
  await api.delete(`/companions/${documentId}`);
}
