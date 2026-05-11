import { useState, useMemo, useRef, useCallback } from "react";
import {
  CheckSquare, Square, ChevronDown, ChevronRight,
  AlertCircle, Minus, ArrowUp,
  X, Check, Pencil, Trash2, GripVertical, Calendar,
} from "lucide-react";
import type { EventChecklistItem } from "../../lib/types";
import { eventService } from "../../lib/services";

interface Props {
  todos: EventChecklistItem[];
  onRefresh: () => void;
}

type Priority = "high" | "medium" | "low";

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; ring: string; icon: React.ReactNode }
> = {
  high:   { label: "Alta",  color: "text-red-500 dark:text-red-400",   bg: "bg-red-500/10 border-red-500/30",    ring: "ring-red-500",   icon: <ArrowUp className="w-3 h-3" /> },
  medium: { label: "Media", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", ring: "ring-amber-500", icon: <Minus className="w-3 h-3" /> },
  low:    { label: "Baja",  color: "text-blue-500 dark:text-blue-400",  bg: "bg-blue-500/10 border-blue-500/30",   ring: "ring-blue-500",  icon: <AlertCircle className="w-3 h-3" /> },
};

function priorityOf(item: EventChecklistItem): Priority {
  return (item.priority as Priority) ?? "medium";
}

function sectionKey(item: EventChecklistItem): string {
  return item.templateItem?.section?.title ?? item.category ?? "General";
}

function sectionOrder(item: EventChecklistItem): number {
  return item.templateItem?.section?.order ?? 999;
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
  item: EventChecklistItem;
  onSave: (documentId: string, fields: { title: string; dueDate: string | null; priority: Priority; notes: string | null }) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onClose: () => void;
}

function EditPanel({ item, onSave, onDelete, onClose }: EditPanelProps) {
  const [title, setTitle] = useState(item.title);
  const [dueDate, setDueDate] = useState(item.dueDate ? item.dueDate.split("T")[0] : "");
  const [priority, setPriority] = useState<Priority>(priorityOf(item));
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(item.documentId, {
      title: title.trim(),
      dueDate: dueDate || null,
      priority,
      notes: notes.trim() || null,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(item.documentId);
    setDeleting(false);
  };

  return (
    <div className="mt-2 p-3 sm:p-4 bg-linen dark:bg-gray-900 rounded-xl border border-blush-dark dark:border-gray-600 space-y-3">
      {/* Título */}
      <div>
        <label className="text-xs text-muted dark:text-gray-500 mb-1 block">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="w-full bg-white dark:bg-gray-800 text-charcoal dark:text-gray-100 text-sm rounded-lg px-3 py-2 border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fecha límite */}
        <div>
          <label className="text-xs text-muted dark:text-gray-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Fecha límite
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full bg-white dark:bg-gray-800 text-charcoal dark:text-gray-200 text-sm rounded-lg px-3 py-2 border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>

        {/* Prioridad */}
        <div>
          <label className="text-xs text-muted dark:text-gray-500 mb-1 block">Prioridad</label>
          <div className="flex gap-1.5">
            {(["high", "medium", "low"] as Priority[]).map((p) => {
              const cfg = PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-all ${
                    priority === p
                      ? `${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`
                      : "bg-white dark:bg-gray-800 text-muted dark:text-gray-500 border-blush-dark dark:border-gray-600 hover:border-muted dark:hover:border-gray-400"
                  }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="text-xs text-muted dark:text-gray-500 mb-1 block">Notas</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Añade una nota..."
          rows={2}
          className="w-full bg-white dark:bg-gray-800 text-charcoal dark:text-gray-200 text-sm rounded-lg px-3 py-2 border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none resize-none placeholder-muted/50 dark:placeholder-gray-600"
        />
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-1">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-500 dark:text-red-400">¿Eliminar?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
            >
              {deleting ? "..." : "Sí, eliminar"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-muted dark:text-gray-500 hover:text-charcoal dark:hover:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1 text-xs text-muted/70 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-muted dark:text-gray-400 hover:text-charcoal dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-3 h-3" /> Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Check className="w-3 h-3" /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Todo Item Row ─────────────────────────────────────────────────────────────

interface TodoItemRowProps {
  item: EventChecklistItem;
  draggable: boolean;
  isDragOver: boolean;
  onToggle: (item: EventChecklistItem) => Promise<void>;
  onEdit: (documentId: string, fields: { title: string; dueDate: string | null; priority: Priority; notes: string | null }) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onDragStart: (e: React.DragEvent, documentId: string) => void;
  onDragOver: (e: React.DragEvent, documentId: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function TodoItemRow({
  item, draggable, isDragOver,
  onToggle, onEdit, onDelete,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: TodoItemRowProps) {
  const [toggling, setToggling] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const p = priorityOf(item);
  const cfg = PRIORITY_CONFIG[p];

  const handleToggle = async () => {
    setToggling(true);
    await onToggle(item);
    setToggling(false);
  };

  const handleEdit = async (documentId: string, fields: { title: string; dueDate: string | null; priority: Priority; notes: string | null }) => {
    await onEdit(documentId, fields);
    setShowEdit(false);
  };

  const formattedDate = item.dueDate
    ? new Date(item.dueDate + (item.dueDate.includes("T") ? "" : "T12:00:00")).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    : null;

  return (
    <div
      onDragOver={(e) => onDragOver(e, item.documentId)}
      onDrop={onDrop}
      className={`transition-all duration-150 ${isDragOver ? "translate-y-0.5 opacity-60" : ""}`}
    >
      <div
        draggable={draggable}
        onDragStart={(e) => onDragStart(e, item.documentId)}
        onDragEnd={onDragEnd}
        className={`rounded-xl border p-3 sm:p-4 transition-all duration-200 ${
          isDragOver ? "border-blue-400/60 dark:border-blue-500/60 bg-blue-50 dark:bg-blue-500/5" :
          item.checked
            ? "bg-linen/40 dark:bg-gray-800/40 border-blush-dark/50 dark:border-gray-700/50 opacity-60"
            : `${cfg.bg} border`
        } ${draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Drag handle */}
          {draggable && (
            <span className="flex-shrink-0 mt-1 text-muted/50 dark:text-gray-600 hover:text-muted dark:hover:text-gray-400 cursor-grab touch-none">
              <GripVertical className="w-4 h-4" />
            </span>
          )}

          {/* Checkbox */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="flex-shrink-0 mt-0.5 text-muted dark:text-gray-400 hover:text-charcoal dark:hover:text-white transition-colors disabled:opacity-40"
          >
            {item.checked
              ? <CheckSquare className="w-5 h-5 text-green-500 dark:text-green-400" />
              : <Square className="w-5 h-5" />}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-sm font-medium ${item.checked ? "line-through text-muted dark:text-gray-500" : "text-charcoal dark:text-gray-100"}`}>
                {item.title}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg}`}>
                {cfg.icon} {cfg.label}
              </span>
              {formattedDate && (
                <span className={`inline-flex items-center gap-1 text-xs ${
                  !item.checked && item.dueDate && new Date(item.dueDate) < new Date()
                    ? "text-red-500 dark:text-red-400"
                    : "text-muted dark:text-gray-500"
                }`}>
                  <Calendar className="w-3 h-3" /> {formattedDate}
                </span>
              )}
            </div>

            {item.notes && !showEdit && (
              <p className="text-xs text-muted/70 dark:text-gray-500 mt-1 italic line-clamp-2">"{item.notes}"</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowEdit((v) => !v)}
              title="Editar"
              className={`p-1 rounded transition-colors ${
                showEdit ? "text-blue-500 dark:text-blue-400 bg-blue-500/10" : "text-muted/70 dark:text-gray-600 hover:text-muted dark:hover:text-gray-300"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {showEdit && (
          <EditPanel
            item={item}
            onSave={handleEdit}
            onDelete={onDelete}
            onClose={() => setShowEdit(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Section Group ─────────────────────────────────────────────────────────────

interface SectionGroupProps {
  title: string;
  items: EventChecklistItem[];
  canDrag: boolean;
  onToggle: (item: EventChecklistItem) => Promise<void>;
  onEdit: (documentId: string, fields: { title: string; dueDate: string | null; priority: Priority; notes: string | null }) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onReorder: (sectionTitle: string, newOrder: string[]) => Promise<void>;
}

function SectionGroup({ title, items, canDrag, onToggle, onEdit, onDelete, onReorder }: SectionGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const done = items.filter((i) => i.checked).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.order - b.order),
    [items],
  );

  const handleDragStart = useCallback((e: React.DragEvent, documentId: string) => {
    setDraggedId(documentId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, documentId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (documentId !== draggedId) setDragOverId(documentId);
  }, [draggedId]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || !dragOverId || draggedId === dragOverId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const ids = sorted.map((i) => i.documentId);
    const fromIdx = ids.indexOf(draggedId);
    const toIdx = ids.indexOf(dragOverId);
    if (fromIdx === -1 || toIdx === -1) return;

    const reordered = [...ids];
    reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, draggedId);

    setDraggedId(null);
    setDragOverId(null);
    await onReorder(title, reordered);
  }, [draggedId, dragOverId, sorted, title, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-3 mb-3 group"
      >
        <span className="text-muted dark:text-gray-400 group-hover:text-charcoal dark:group-hover:text-gray-200 transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
        <h3 className="text-sm font-semibold text-muted dark:text-gray-300 group-hover:text-charcoal dark:group-hover:text-white transition-colors uppercase tracking-wider">
          {title}
        </h3>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted/70 dark:text-gray-500">{done}/{items.length}</span>
          <div className="w-20 h-1.5 bg-blush-dark dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-2 pl-0 sm:pl-4">
          {sorted.map((item) => (
            <TodoItemRow
              key={item.documentId}
              item={item}
              draggable={canDrag}
              isDragOver={dragOverId === item.documentId}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TodoManagement({ todos }: Props) {
  const [localTodos, setLocalTodos] = useState<EventChecklistItem[]>(todos);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const prevTodosRef = useRef(todos);

  if (todos !== prevTodosRef.current) {
    prevTodosRef.current = todos;
    setLocalTodos(todos);
  }

  const filtered = useMemo(() => {
    if (filter === "pending") return localTodos.filter((t) => !t.checked);
    if (filter === "done") return localTodos.filter((t) => t.checked);
    return localTodos;
  }, [localTodos, filter]);

  const sections = useMemo(() => {
    const map = new Map<string, { order: number; items: EventChecklistItem[] }>();
    for (const item of filtered) {
      const key = sectionKey(item);
      if (!map.has(key)) map.set(key, { order: sectionOrder(item), items: [] });
      map.get(key)!.items.push(item);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([title, { items }]) => ({ title, items }));
  }, [filtered]);

  const totalDone = localTodos.filter((t) => t.checked).length;
  const totalPct = localTodos.length ? Math.round((totalDone / localTodos.length) * 100) : 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleToggle = async (item: EventChecklistItem) => {
    const newChecked = !item.checked;
    setLocalTodos((prev) =>
      prev.map((t) =>
        t.documentId === item.documentId
          ? { ...t, checked: newChecked, checkedAt: newChecked ? new Date().toISOString() : null }
          : t,
      ),
    );
    try {
      await eventService.updateTodo(item.documentId, { checked: newChecked });
    } catch {
      setLocalTodos((prev) =>
        prev.map((t) => (t.documentId === item.documentId ? { ...t, checked: item.checked } : t)),
      );
    }
  };

  const handleEdit = async (
    documentId: string,
    fields: { title: string; dueDate: string | null; priority: Priority; notes: string | null },
  ) => {
    const snapshot = localTodos.find((t) => t.documentId === documentId);
    setLocalTodos((prev) =>
      prev.map((t) => (t.documentId === documentId ? { ...t, ...fields } : t)),
    );
    try {
      await eventService.updateTodo(documentId, fields);
    } catch {
      if (snapshot) {
        setLocalTodos((prev) =>
          prev.map((t) => (t.documentId === documentId ? snapshot : t)),
        );
      }
    }
  };

  const handleDelete = async (documentId: string) => {
    const snapshot = localTodos.find((t) => t.documentId === documentId);
    setLocalTodos((prev) => prev.filter((t) => t.documentId !== documentId));
    try {
      await eventService.deleteTodo(documentId);
    } catch {
      if (snapshot) {
        setLocalTodos((prev) => [...prev, snapshot]);
      }
    }
  };

  const handleReorder = async (sectionTitle: string, newDocumentIdOrder: string[]) => {
    const orderMap = new Map(newDocumentIdOrder.map((id, idx) => [id, idx]));
    setLocalTodos((prev) =>
      prev.map((t) => {
        if (sectionKey(t) !== sectionTitle) return t;
        const newOrder = orderMap.get(t.documentId);
        return newOrder !== undefined ? { ...t, order: newOrder } : t;
      }),
    );
    const updates = newDocumentIdOrder.map((documentId, idx) =>
      eventService.updateTodo(documentId, { order: idx }).catch(() => null),
    );
    await Promise.all(updates);
  };

  if (localTodos.length === 0) {
    return (
      <div className="text-center py-16 text-muted dark:text-gray-500">
        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No hay tareas para este evento.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Progreso general */}
      <div className="bg-white dark:bg-gray-800 border border-blush-dark dark:border-gray-700 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted dark:text-gray-400">Progreso general</span>
              <span className="text-lg font-bold text-charcoal dark:text-white">{totalPct}%</span>
            </div>
            <div className="w-full h-2 bg-blush-dark dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${totalPct}%` }}
              />
            </div>
            <p className="text-xs text-muted/70 dark:text-gray-500 mt-1">
              {totalDone} de {localTodos.length} completadas
            </p>
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            {(["all", "pending", "done"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-linen dark:bg-gray-700 text-muted dark:text-gray-400 hover:bg-blush dark:hover:bg-gray-600 hover:text-charcoal dark:hover:text-gray-200"
                }`}
              >
                {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Completadas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda prioridades */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.color} ${cfg.bg}`}
          >
            {cfg.icon} {cfg.label}
          </span>
        ))}
        {filter === "all" && (
          <span className="inline-flex items-center gap-1 text-xs text-muted/50 dark:text-gray-600 ml-auto">
            <GripVertical className="w-3 h-3" /> Arrastra para reordenar
          </span>
        )}
      </div>

      {/* Secciones */}
      {sections.length === 0 ? (
        <p className="text-muted dark:text-gray-500 text-sm text-center py-8">No hay tareas con este filtro.</p>
      ) : (
        sections.map(({ title, items }) => (
          <SectionGroup
            key={title}
            title={title}
            items={items}
            canDrag={filter === "all"}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onReorder={handleReorder}
          />
        ))
      )}
    </div>
  );
}
