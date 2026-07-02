// Tipos de dominio para Strapi v5
// Las respuestas son planas (sin wrapper "attributes") y usan documentId como
// identificador estable para mutaciones y relaciones.

// ─── Checklist Template ──────────────────────────────────────────────────────

export interface ChecklistTemplate extends StrapiBase {
  title: string;
  slug: string;
  description?: string | null;
  type: "wedding" | "birthday" | "corporate";
  isDefault: boolean;
  sections?: ChecklistSection[];
}

// ─── Checklist Section ───────────────────────────────────────────────────────

export interface ChecklistSection extends StrapiBase {
  title: string;
  description?: string | null;
  order: number;
  template?: Pick<ChecklistTemplate, "id" | "documentId" | "title"> | null;
  items?: ChecklistTemplateItem[];
}

// ─── Checklist Template Item ─────────────────────────────────────────────────

export interface ChecklistTemplateItem extends StrapiBase {
  title: string;
  description?: string | null;
  order: number;
  required: boolean;
  estimatedDaysBeforeEvent?: number | null;
  section?: Pick<
    ChecklistSection,
    "id" | "documentId" | "title" | "order"
  > | null;
}

// ─── Event Checklist Item ────────────────────────────────────────────────────

export interface EventChecklistItem extends StrapiBase {
  // Snapshot del template
  title: string;
  description?: string | null;
  category?: string | null;
  order: number; // Estado
  checked: boolean;
  checkedAt?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  priority?: "low" | "medium" | "high";
  isCustom?: boolean;
  hidden?: boolean; // Relaciones
  event?: Pick<Event, "id" | "documentId" | "name"> | null;
  templateItem?:
    | (Pick<ChecklistTemplateItem, "id" | "documentId" | "title" | "order"> & {
        section?: Pick<
          ChecklistSection,
          "id" | "documentId" | "title" | "order"
        > | null;
      })
    | null;
  attachments?: StrapiMedia[] | null;
}
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
  site_url: string,
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
  template?: ChecklistTemplate | null;
  checklistItems?: EventChecklistItem[];
}

// ─── Companion ───────────────────────────────────────────────────────────────

export interface Companion extends StrapiBase {
  full_name: string;
  phone?: string | null;
  self_payed?: boolean;
  invited_by?: "novio" | "novia" | null;
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
  dietary_restrictions?: string | null;
  self_payed?: boolean;
  invited_by?: "novio" | "novia" | null;
  /** Relación table — presente solo si se popula */
  table?: Pick<Table, "id" | "documentId" | "name"> | null;
  /** Relación companions — presente solo si se popula */
  companions?: Companion[];
  event?: Event | null;
}

// ─── Table ───────────────────────────────────────────────────────────────────

export interface Table extends StrapiBase {
  name: string;
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
  dietary_restrictions?: string | null;
  self_payed?: boolean;
  invited_by?: "novio" | "novia" | null;
  /** documentId del evento (requerido en create) */
  event?: string;
  /** documentId de la mesa (null para desasignar) */
  table?: string | null;
}

export interface CompanionInput {
  full_name: string;
  phone?: string | null;
  self_payed?: boolean;
  invited_by?: "novio" | "novia" | null;
  /** documentId del invitado (requerido en create) */
  guest?: string;
}

export interface TableInput {
  name: string;
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
