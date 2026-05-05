// Tipos de dominio para Strapi v5
// Las respuestas son planas (sin wrapper "attributes") y usan documentId como
// identificador estable para mutaciones y relaciones.

export interface StrapiBase {
  id: number;
  documentId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// ─── Media ───────────────────────────────────────────────────────────────────

export interface StrapiMedia {
  id: number;
  documentId: string;
  url: string;
  name: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
}

// ─── Componentes de Event ─────────────────────────────────────────────────────

export interface GiftRegistry {
  id: number;
  name: string;
  reference_number?: string | null;
  url: string;
}

export interface ScheduleItem {
  id: number;
  title: string;
  time?: string | null;
  description?: string | null;
  icon?: string | null;
}

export interface Location {
  id: number;
  name: string;
  city?: string | null;
  map_url?: string | null;
  time?: string | null;
  title?: string | null;
}

// ─── Event ───────────────────────────────────────────────────────────────────

export interface Event extends StrapiBase {
  name: string;
  slug?: string | null;
  main_title?: string | null;
  subtitle?: string | null;
  event_date: string;
  confirmation_deadline?: string | null;
  background_image?: StrapiMedia | null;
  gallery_image?: StrapiMedia | null;
  music?: StrapiMedia | null;
  message?: string | null;
  dress_code?: string | null;
  dress_code_note?: string | null;
  color_palette?: string[] | null;
  gift_message?: string | null;
  bank_account?: string | null;
  clabe?: string | null;
  gift_registry?: GiftRegistry[];
  schedule?: ScheduleItem[];
  locations?: Location[];
  is_manageable?: boolean;
  whatsapp_message?: string | null;
}

// ─── Companion ───────────────────────────────────────────────────────────────

export interface Companion extends StrapiBase {
  full_name: string;
  phone?: string | null;
  /** Relación guest — presente solo si se popula */
  guest?: Pick<Guest, "id" | "documentId" | "full_name"> | null;
  /** Relación event — presente solo si se popula */
  event?: Pick<Event, "id" | "documentId"> | null;
}

// ─── Guest ───────────────────────────────────────────────────────────────────

export interface Guest extends StrapiBase {
  full_name: string;
  unique_code: string;
  max_passes: number;
  confirmed_passes: number;
  status: "pending" | "yes" | "no";
  phone?: string | null;
  note?: string | null;
  /** Relación table — presente solo si se popula */
  table?: Pick<Table, "id" | "documentId" | "number"> | null;
  /** Relación companions — presente solo si se popula */
  companions?: Companion[];
  event?: Event | null;
}

// ─── Table ───────────────────────────────────────────────────────────────────

export interface Table extends StrapiBase {
  number: number;
  capacity: number;
  /** Capitán invitado — presente solo si se popula */
  captain_guest?: Pick<Guest, "id" | "documentId" | "full_name"> | null;
  /** Capitán acompañante — presente solo si se popula */
  captain_companion?: Pick<Companion, "id" | "documentId" | "full_name"> | null;
}

// ─── Strapi User (users-permissions) ─────────────────────────────────────────

export interface StrapiUser {
  id: number;
  documentId: string;
  username: string;
  email: string;
  /** Evento ligado al admin — presente solo si se popula */
  event?: Event | null;
}

// ─── Inputs para create / update ─────────────────────────────────────────────

export interface GuestInput {
  full_name: string;
  unique_code?: string;
  max_passes: number;
  confirmed_passes?: number;
  status?: "pending" | "yes" | "no";
  phone?: string | null;
  note?: string | null;
  /** documentId del evento (requerido en create) */
  event?: string;
  /** documentId de la mesa (null para desasignar) */
  table?: string | null;
}

export interface CompanionInput {
  full_name: string;
  phone?: string | null;
  /** documentId del invitado (requerido en create) */
  guest?: string;
}

export interface TableInput {
  number: number;
  capacity?: number;
  /** documentId del evento (requerido en create) */
  event?: string;
  captain_guest?: string | null;
  captain_companion?: string | null;
}

// ─── Respuesta de auth ────────────────────────────────────────────────────────

export interface AuthResponse {
  jwt: string;
  user: StrapiUser;
}
