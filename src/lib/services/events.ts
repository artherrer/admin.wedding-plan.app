import {
  api,
  one,
  many,
  ALL,
  StrapiSingleResponse,
  StrapiCollectionResponse,
} from "../api";
import type { Event, EventChecklistItem } from "../types";

const POPULATE = "populate=*";

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
  const res = await api.get<StrapiCollectionResponse<Event>>("/events", {
    params: { ...ALL, populate: "*" },
  });
  return many(res);
}

export async function getTodos(
  documentId?: string,
): Promise<EventChecklistItem[]> {
  const res = await api.get<StrapiCollectionResponse<EventChecklistItem>>(
    "/event-checklist-items",
    {
      params: {
        ...ALL,
        "filters[event][documentId][$eq]": documentId,
        populate: ["templateItem.section"],
        sort: "createdAt:asc",
      },
    },
  );
  return many(res);
}

export async function updateTodo(
  documentId: string,
  data: {
    checked?: boolean;
    notes?: string | null;
    title?: string;
    dueDate?: string | null;
    priority?: "low" | "medium" | "high";
    order?: number;
  },
): Promise<EventChecklistItem> {
  const res = await api.put<StrapiSingleResponse<EventChecklistItem>>(
    `/event-checklist-items/${documentId}`,
    { data },
  );
  return one(res);
}

export async function deleteTodo(documentId: string): Promise<void> {
  await api.delete(`/event-checklist-items/${documentId}`);
}
