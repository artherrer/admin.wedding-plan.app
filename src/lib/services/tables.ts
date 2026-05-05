import { api, one, many, ALL, StrapiSingleResponse, StrapiCollectionResponse } from '../api';
import type { Table, TableInput } from '../types';

const POPULATE = { populate: [
  'captain_guest',
  'captain_companion',
] };

export async function getAll(eventDocumentId?: string): Promise<Table[]> {
  const res = await api.get<StrapiCollectionResponse<Table>>('/tables', {
    params: {
      ...ALL,
      ...POPULATE,
      'sort': 'number:asc',
      ...(eventDocumentId && { 'filters[event][documentId][$eq]': eventDocumentId }),
    },
  });
  return many(res);
}

export async function getOne(documentId: string): Promise<Table> {
  const res = await api.get<StrapiSingleResponse<Table>>(
    `/tables/${documentId}`,
    { params: POPULATE },
  );
  return one(res);
}

export async function create(
  eventDocumentId: string,
  input: Omit<TableInput, 'event'>,
): Promise<Table> {
  const res = await api.post<StrapiSingleResponse<Table>>('/tables', {
    data: { capacity: 10, ...input, event: eventDocumentId },
  });
  return one(res);
}

export async function update(
  documentId: string,
  input: Partial<TableInput>,
): Promise<Table> {
  const res = await api.put<StrapiSingleResponse<Table>>(
    `/tables/${documentId}`,
    { data: input },
  );
  return one(res);
}

export async function remove(documentId: string): Promise<void> {
  await api.delete(`/tables/${documentId}`);
}

export async function setCapitan(
  tableDocumentId: string,
  type: 'guest' | 'companion',
  personDocumentId: string,
): Promise<Table> {
  const data: Partial<TableInput> =
    type === 'guest'
      ? { captain_guest: personDocumentId, captain_companion: null }
      : { captain_guest: null, captain_companion: personDocumentId };

  return update(tableDocumentId, data);
}

export async function clearCapitan(tableDocumentId: string): Promise<Table> {
  return update(tableDocumentId, { captain_guest: null, captain_companion: null });
}
