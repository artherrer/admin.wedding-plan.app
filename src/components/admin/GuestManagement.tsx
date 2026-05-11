import { useState } from "react";
import { guestService, companionService } from "../../lib/services";
import type { Guest, Table, Companion } from "../../lib/types";
import {
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  MessageCircle,
  Search,
  Download,
  Upload,
} from "lucide-react";
import { useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

interface GuestManagementProps {
  invitados: Guest[];
  mesas: Table[];
  acompanantes: Companion[];
  eventDocumentId: string;
  onRefresh: () => void;
  whatsappMessage?: string | null;
}

function sendWhatsApp(
  phone: string,
  code: string,
  nombre: string,
  whatsappMessage?: string | null,
) {
  try {
    console.warn("sendWhatsApp called with", {
      phone,
      code,
      nombre,
      whatsappMessage,
    });
    if (!whatsappMessage) {
      toast.error("No hay mensaje de WhatsApp configurado");
      return;
    }

    const DETAILS_LINK = import.meta.env.VITE_EVENT_URL
    if (!DETAILS_LINK) {
      toast.error("No hay URL del evento configurada");
    }
    const RSVP_LINK = DETAILS_LINK + "/invitacion/" + code;
    const clean = phone.replace(/[^\d]/g, "");
    if (!clean) {
      toast.error("No hay número telefónico registrado");
      return;
    }

    const firstName = nombre.trim().split(" ")[0];

    const message = whatsappMessage
      .replace("{{name}}", firstName)
      .replace("{{code}}", code)
      .replace("{{rsvp_link}}", RSVP_LINK)
      .replace("{{details_link}}", DETAILS_LINK);

    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  } catch (err) {
    console.error("Error in sendWhatsApp:", err);
  }
}

const STATUS_LABEL: Record<string, string> = {
  yes: "Sí",
  no: "No",
  pending: "Sin confirmar",
};

function exportCSV(
  invitados: Guest[],
  mesas: Table[],
  acompanantes: Companion[],
) {
  const mesaMap = new Map(mesas.map((m) => [m.documentId, m.name]));
  const acompPorInvitado = acompanantes.reduce<Record<string, Companion[]>>(
    (acc, a) => {
      const guestDocId = a.guest?.documentId;
      if (guestDocId) (acc[guestDocId] ??= []).push(a);
      return acc;
    },
    {},
  );

  const rows: string[][] = [
    ["Nombre", "Tipo", "Teléfono", "Confirmación", "Mesa"],
  ];

  for (const inv of invitados) {
    const mesa = inv.table
      ? String(mesaMap.get(inv.table.documentId) ?? "")
      : "";
    rows.push([
      inv.full_name,
      "Invitado",
      inv.phone ?? "",
      STATUS_LABEL[inv.status] ?? inv.status,
      mesa,
    ]);
    for (const a of acompPorInvitado[inv.documentId] ?? []) {
      rows.push([
        a.full_name,
        "Acompañante",
        a.phone ?? "",
        STATUS_LABEL[inv.status] ?? inv.status,
        mesa,
      ]);
    }
  }

  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invitados_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type GrupoImport = {
  nombre: string;
  phone: string;
  acomps: { nombre: string; phone: string }[];
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let i = 0;
    while (i < line.length) {
      if (line[i] === '"') {
        let val = "";
        i++;
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            val += '"';
            i += 2;
          } else if (line[i] === '"') {
            i++;
            break;
          } else {
            val += line[i++];
          }
        }
        fields.push(val);
        if (line[i] === ",") i++;
      } else {
        let val = "";
        while (i < line.length && line[i] !== ",") val += line[i++];
        fields.push(val);
        if (line[i] === ",") i++;
      }
    }
    rows.push(fields);
  }
  return rows;
}

const inputCls = "w-full px-4 py-2 bg-linen dark:bg-gray-700 text-charcoal dark:text-white rounded-lg border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none";

export default function GuestManagement({
  invitados,
  mesas,
  acompanantes: acompanantesGlobales,
  eventDocumentId,
  onRefresh,
  whatsappMessage,
}: GuestManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<GrupoImport[] | null>(
    null,
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Guest>>({});
  const [newGuest, setNewGuest] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [acompanantes, setAcompanantes] = useState<Record<string, Companion[]>>(
    {},
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingAcomp, setLoadingAcomp] = useState<string | null>(null);
  const [showAcompForm, setShowAcompForm] = useState<string | null>(null);
  const [acompForm, setAcompForm] = useState({ full_name: "", phone: "" });
  const [savingAcomp, setSavingAcomp] = useState(false);

  const [editingAcompId, setEditingAcompId] = useState<string | null>(null);
  const [acompEditForm, setAcompEditForm] = useState({
    full_name: "",
    phone: "",
  });
  const [savingAcompEdit, setSavingAcompEdit] = useState(false);

  const q = search.trim().toLowerCase();
  const invitadosFiltrados = q
    ? invitados.filter((inv) => {
        const matchInvitado = inv.full_name.toLowerCase().includes(q);
        const matchAcomp = (acompanantes[inv.documentId] ?? []).some((a) =>
          a.full_name.toLowerCase().includes(q),
        );
        return matchInvitado || matchAcomp;
      })
    : invitados
        .slice()
        .sort((a, b) =>
          a.full_name.toLowerCase().localeCompare(b.full_name.toLowerCase()),
        );

  const startEdit = (invitado: Guest) => {
    setEditingId(invitado.documentId);
    setFormData(invitado);
    setShowForm(true);
  };

  const startNew = () => {
    setNewGuest(true);
    setFormData({
      full_name: "",
      unique_code: "",
      max_passes: 1,
      confirmed_passes: 0,
      status: "pending",
      phone: "",
      note: "",
    });
    setShowForm(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewGuest(false);
    setShowForm(false);
    setFormData({});
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast.error("CSV vacío o sin datos");
        return;
      }

      const header = rows[0].map((h) => h.toLowerCase().trim());
      const nameIdx = header.indexOf("nombre");
      const tipoIdx = header.indexOf("tipo");
      const phoneIdx = header.indexOf("teléfono");

      if (nameIdx === -1 || tipoIdx === -1) {
        toast.error("Formato inválido: se requieren columnas Nombre y Tipo");
        return;
      }

      const grupos: GrupoImport[] = [];
      let current: GrupoImport | null = null;

      for (const row of rows.slice(1)) {
        const nombre = row[nameIdx]?.trim();
        const tipo = row[tipoIdx]?.trim().toLowerCase();
        const phone = phoneIdx >= 0 ? (row[phoneIdx]?.trim() ?? "") : "";
        if (!nombre) continue;

        if (tipo === "invitado") {
          current = { nombre, phone, acomps: [] };
          grupos.push(current);
        } else if (tipo === "acompañante" && current) {
          current.acomps.push({ nombre, phone });
        }
      }

      if (grupos.length === 0) {
        toast.error("No se encontraron invitados en el archivo");
        return;
      }

      setImportPreview(grupos);
      setSelectedGroups(new Set(grupos.map((_, i) => i)));
    } catch (err) {
      console.error("Error parsing CSV:", err);
      toast.error("Error al leer el archivo");
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    const grupos = importPreview.filter((_, i) => selectedGroups.has(i));
    if (grupos.length === 0) {
      toast.error("Selecciona al menos un invitado");
      return;
    }

    try {
      setImporting(true);
      let insertados = 0;
      let errores = 0;

      for (const grupo of grupos) {
        try {
          const guest = await guestService.create(eventDocumentId, {
            full_name: grupo.nombre,
            max_passes: 1 + grupo.acomps.length,
            confirmed_passes: 0,
            status: "pending",
            phone: grupo.phone || null,
          });
          insertados++;
          for (const a of grupo.acomps) {
            await companionService.create(guest.documentId, {
              full_name: a.nombre,
              phone: a.phone || null,
            });
          }
        } catch {
          errores++;
        }
      }

      toast.success(
        `Importación completa: ${insertados} invitados${errores > 0 ? `, ${errores} con error` : ""}`,
      );
      setImportPreview(null);
      setSelectedGroups(new Set());
      onRefresh();
    } catch (err) {
      console.error("Error importing CSV:", err);
      toast.error("Error al importar el archivo");
    } finally {
      setImporting(false);
    }
  };

  const saveGuest = async () => {
    try {
      setLoading(true);
      if (newGuest) {
        await guestService.create(eventDocumentId, {
          full_name: formData.full_name || "",
          max_passes: formData.max_passes || 1,
          confirmed_passes: formData.confirmed_passes || 0,
          status: formData.status || "pending",
          phone: formData.phone || null,
          note: formData.note || null,
        });
      } else if (editingId) {
        const noAsiste =
          formData.status === "no" || formData.status === "pending";
        await guestService.update(editingId, {
          full_name: formData.full_name,
          max_passes: formData.max_passes,
          confirmed_passes: noAsiste
            ? 0
            : Math.min(
                formData.confirmed_passes || 0,
                formData.max_passes || 1,
              ),
          status: formData.status,
          phone: formData.phone || null,
          note: formData.note || null,
          ...(noAsiste ? { table: null } : {}),
        });
      }
      toast.success("Invitado guardado correctamente");
      cancelEdit();
      onRefresh();
    } catch (err) {
      console.error("Error saving guest:", err);
      toast.error("Error al guardar el invitado");
    } finally {
      setLoading(false);
    }
  };

  const deleteGuest = async (documentId: string) => {
    if (
      !window.confirm(
        "¿Eliminar este invitado? Se eliminarán también sus acompañantes.",
      )
    )
      return;
    try {
      setLoading(true);
      await guestService.remove(documentId);
      toast.success("Invitado eliminado correctamente");
      onRefresh();
    } catch (err) {
      console.error("Error deleting guest:", err);
      toast.error("Error al eliminar el invitado");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (invitadoDocId: string) => {
    if (expandedId === invitadoDocId) {
      setExpandedId(null);
      setShowAcompForm(null);
      setEditingAcompId(null);
      return;
    }
    setExpandedId(invitadoDocId);
    setShowAcompForm(null);
    setEditingAcompId(null);
    if (!acompanantes[invitadoDocId]) {
      await loadAcompanantes(invitadoDocId);
    }
  };

  const loadAcompanantes = async (invitadoDocId: string) => {
    try {
      setLoadingAcomp(invitadoDocId);
      const data = await companionService.getByGuest(invitadoDocId);
      setAcompanantes((prev) => ({ ...prev, [invitadoDocId]: data }));
    } catch (err) {
      console.error("Error loading acompañantes:", err);
      toast.error("Error al cargar acompañantes");
    } finally {
      setLoadingAcomp(null);
    }
  };

  const acompCount = (invitadoDocId: string) =>
    acompanantes[invitadoDocId]?.length ?? 0;

  const pasesDisponiblesParaAcomp = (invitado: Guest) =>
    invitado.max_passes - 1 - acompCount(invitado.documentId);

  const openAcompForm = (invitadoDocId: string) => {
    setShowAcompForm(invitadoDocId);
    setEditingAcompId(null);
    setAcompForm({ full_name: "", phone: "" });
  };

  const saveAcompanante = async (invitado: Guest) => {
    if (!acompForm.full_name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    if (pasesDisponiblesParaAcomp(invitado) <= 0) {
      toast.error("No hay pases disponibles para este invitado");
      return;
    }
    try {
      setSavingAcomp(true);
      await companionService.create(invitado.documentId, {
        full_name: acompForm.full_name.trim(),
        phone: acompForm.phone.trim() || null,
      });
      toast.success("Acompañante añadido");
      setShowAcompForm(null);
      setAcompForm({ full_name: "", phone: "" });
      await loadAcompanantes(invitado.documentId);
    } catch (err) {
      console.error("Error saving acompañante:", err);
      toast.error("Error al guardar acompañante");
    } finally {
      setSavingAcomp(false);
    }
  };

  const deleteAcompanante = async (
    acompDocId: string,
    invitadoDocId: string,
  ) => {
    if (!window.confirm("¿Eliminar este acompañante?")) return;
    try {
      await companionService.remove(acompDocId);
      toast.success("Acompañante eliminado");
      await loadAcompanantes(invitadoDocId);
    } catch (err) {
      console.error("Error deleting acompañante:", err);
      toast.error("Error al eliminar acompañante");
    }
  };

  const startEditAcomp = (a: Companion) => {
    setEditingAcompId(a.documentId);
    setShowAcompForm(null);
    setAcompEditForm({
      full_name: a.full_name,
      phone: a.phone ?? "",
    });
  };

  const cancelEditAcomp = () => {
    setEditingAcompId(null);
    setAcompEditForm({ full_name: "", phone: "" });
  };

  const saveEditAcomp = async (acompDocId: string, invitadoDocId: string) => {
    if (!acompEditForm.full_name.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    try {
      setSavingAcompEdit(true);
      await companionService.update(acompDocId, {
        full_name: acompEditForm.full_name.trim(),
        phone: acompEditForm.phone.trim() || null,
      });
      toast.success("Acompañante actualizado");
      setEditingAcompId(null);
      await loadAcompanantes(invitadoDocId);
    } catch (err) {
      console.error("Error updating acompañante:", err);
      toast.error("Error al actualizar acompañante");
    } finally {
      setSavingAcompEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl text-charcoal dark:text-white font-light">
          Gestión de Invitados
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => exportCSV(invitados, mesas, acompanantesGlobales)}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCSV}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            <Upload className="w-5 h-5" />
            {importing ? "Importando..." : "Importar CSV"}
          </button>
          <button
            onClick={startNew}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Agregar Invitado
          </button>
        </div>
      </div>

      {/* BÚSQUEDA */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted dark:text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar invitado o acompañante..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-charcoal dark:text-white rounded-lg border border-blush-dark dark:border-gray-700 focus:border-blue-500 focus:outline-none text-sm placeholder-muted/50 dark:placeholder-gray-500"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted dark:text-gray-400 hover:text-charcoal dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* FORM INVITADO */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-blush-dark dark:border-gray-700 mb-6">
          <h3 className="text-base sm:text-lg text-charcoal dark:text-white font-light mb-4">
            {newGuest ? "Nuevo Invitado" : "Editar Invitado"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-muted dark:text-gray-400 block mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.full_name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm text-muted dark:text-gray-400 block mb-2">
                Número Telefónico
              </label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+52 123456789"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm text-muted dark:text-gray-400 block mb-2">
                Pases Máximos
              </label>
              <input
                type="number"
                value={formData.max_passes || 1}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_passes: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-sm text-muted dark:text-gray-400 block mb-2">
                Pases Confirmados
              </label>
              <input
                type="number"
                value={formData.confirmed_passes || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    confirmed_passes: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
                max={formData.max_passes || 1}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-muted dark:text-gray-400 block mb-2">
                Confirmado
              </label>
              <select
                value={formData.status ?? "pending"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "pending" | "yes" | "no",
                  })
                }
                className={inputCls}
              >
                <option value="pending">Sin confirmar</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-muted dark:text-gray-400 block mb-2">Nota</label>
              <textarea
                value={formData.note || ""}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={saveGuest}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors w-full sm:w-auto"
            >
              <Save className="w-5 h-5" />
              Guardar
            </button>
            <button
              onClick={cancelEdit}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-linen dark:bg-gray-700 hover:bg-blush dark:hover:bg-gray-600 text-charcoal dark:text-white rounded-lg transition-colors w-full sm:w-auto"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blush-dark dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-linen dark:bg-gray-700 border-b border-blush-dark dark:border-gray-600">
              <tr>
                {["Nombre", "Teléfono", "Código", "Pases", "Confirmado", "Acciones"].map((h) => (
                  <th key={h} className="px-4 sm:px-6 py-3 sm:py-4 text-charcoal/75 dark:text-gray-300 font-light">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invitadosFiltrados.map((invitado) => (
                <>
                  <tr
                    key={invitado.documentId}
                    className="border-b border-blush-dark/50 dark:border-gray-700 hover:bg-linen/50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-charcoal dark:text-white">
                      {invitado.full_name}
                    </td>

                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {invitado.phone ? (
                        <span className="text-blue-500 dark:text-blue-400 break-all">
                          {invitado.phone}
                        </span>
                      ) : (
                        <span className="text-muted/70 dark:text-gray-500 italic">
                          No registrado
                        </span>
                      )}
                    </td>

                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-muted dark:text-gray-400 font-mono text-xs sm:text-sm break-all">
                      {invitado.unique_code}
                    </td>

                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-muted dark:text-gray-400">
                      {invitado.confirmed_passes}/{invitado.max_passes}
                    </td>

                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      {invitado.status === "yes" ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-light bg-green-600/20 text-green-700 dark:text-green-300">
                          Sí
                        </span>
                      ) : invitado.status === "no" ? (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-light bg-red-600/20 text-red-600 dark:text-red-400">
                          No
                        </span>
                      ) : (
                        <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-light bg-linen dark:bg-gray-600/30 text-muted dark:text-gray-400">
                          Sin confirmar
                        </span>
                      )}
                    </td>

                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => toggleExpand(invitado.documentId)}
                          title="Acompañantes"
                          className="p-2 text-amber-500 dark:text-amber-400 hover:bg-linen dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          {expandedId === invitado.documentId ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={() =>
                            sendWhatsApp(
                              invitado.phone ?? "",
                              invitado.unique_code,
                              invitado.full_name,
                              whatsappMessage,
                            )
                          }
                          title="Enviar WhatsApp"
                          className="p-2 text-green-500 dark:text-green-400 hover:bg-linen dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => startEdit(invitado)}
                          className="p-2 text-blue-500 dark:text-blue-400 hover:bg-linen dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteGuest(invitado.documentId)}
                          className="p-2 text-red-400 hover:bg-linen dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* FILA EXPANDIDA: ACOMPAÑANTES */}
                  {expandedId === invitado.documentId && (
                    <tr
                      key={`${invitado.documentId}-acomp`}
                      className="bg-cream/60 dark:bg-gray-900/60"
                    >
                      <td colSpan={6} className="px-4 sm:px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-charcoal/75 dark:text-gray-300 font-light">
                              Detalles
                            </span>
                          </div>
                          <div className="bg-linen dark:bg-gray-800 rounded-lg p-4 border border-blush-dark dark:border-gray-600 space-y-2">
                            {invitado.note ? (
                              <p className="text-sm text-muted dark:text-gray-400 italic">
                                Nota: {invitado.note}
                              </p>
                            ) : (
                              <p className="text-sm text-muted/70 dark:text-gray-500 italic">
                                Sin nota adicional
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-charcoal/75 dark:text-gray-300 font-light">
                              Acompañantes{" "}
                              <span className="text-muted dark:text-gray-500">
                                ({acompCount(invitado.documentId)} /{" "}
                                {invitado.max_passes - 1} posibles)
                              </span>
                            </span>
                            {pasesDisponiblesParaAcomp(invitado) > 0 &&
                              showAcompForm !== invitado.documentId && (
                                <button
                                  onClick={() =>
                                    openAcompForm(invitado.documentId)
                                  }
                                  className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Añadir
                                </button>
                              )}
                          </div>

                          {/* FORMULARIO NUEVO ACOMPAÑANTE */}
                          {showAcompForm === invitado.documentId && (
                            <div className="bg-linen dark:bg-gray-800 rounded-lg p-4 border border-blush-dark dark:border-gray-600 space-y-3">
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Pases disponibles:{" "}
                                {pasesDisponiblesParaAcomp(invitado)}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-muted dark:text-gray-400 block mb-1">
                                    Nombre *
                                  </label>
                                  <input
                                    type="text"
                                    value={acompForm.full_name}
                                    onChange={(e) =>
                                      setAcompForm({
                                        ...acompForm,
                                        full_name: e.target.value,
                                      })
                                    }
                                    placeholder="Nombre completo"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-charcoal dark:text-white text-sm rounded-lg border border-blush-dark dark:border-gray-600 focus:border-amber-500 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted dark:text-gray-400 block mb-1">
                                    Teléfono
                                  </label>
                                  <input
                                    type="tel"
                                    value={acompForm.phone}
                                    onChange={(e) =>
                                      setAcompForm({
                                        ...acompForm,
                                        phone: e.target.value,
                                      })
                                    }
                                    placeholder="+52 123456789"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 text-charcoal dark:text-white text-sm rounded-lg border border-blush-dark dark:border-gray-600 focus:border-amber-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveAcompanante(invitado)}
                                  disabled={savingAcomp}
                                  className="flex items-center gap-1 px-4 py-1.5 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                                >
                                  <Save className="w-3 h-3" />
                                  Guardar
                                </button>
                                <button
                                  onClick={() => setShowAcompForm(null)}
                                  className="flex items-center gap-1 px-4 py-1.5 text-xs bg-linen dark:bg-gray-700 hover:bg-blush dark:hover:bg-gray-600 text-charcoal dark:text-white rounded-lg transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* LISTA ACOMPAÑANTES */}
                          {loadingAcomp === invitado.documentId ? (
                            <p className="text-xs text-muted/70 dark:text-gray-500">Cargando...</p>
                          ) : acompanantes[invitado.documentId]?.length ===
                            0 ? (
                            <p className="text-xs text-muted/70 dark:text-gray-500 italic">
                              Sin acompañantes registrados
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {acompanantes[invitado.documentId]?.map((a) => (
                                <div key={a.documentId}>
                                  {editingAcompId === a.documentId ? (
                                    <div className="bg-linen dark:bg-gray-800 rounded-lg p-3 border border-blue-400/50 dark:border-blue-600/50 space-y-2">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-xs text-muted dark:text-gray-400 block mb-1">
                                            Nombre *
                                          </label>
                                          <input
                                            type="text"
                                            value={acompEditForm.full_name}
                                            onChange={(e) =>
                                              setAcompEditForm({
                                                ...acompEditForm,
                                                full_name: e.target.value,
                                              })
                                            }
                                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 text-charcoal dark:text-white text-sm rounded-lg border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs text-muted dark:text-gray-400 block mb-1">
                                            Teléfono
                                          </label>
                                          <input
                                            type="tel"
                                            value={acompEditForm.phone}
                                            onChange={(e) =>
                                              setAcompEditForm({
                                                ...acompEditForm,
                                                phone: e.target.value,
                                              })
                                            }
                                            placeholder="+52 123456789"
                                            className="w-full px-3 py-1.5 bg-white dark:bg-gray-700 text-charcoal dark:text-white text-sm rounded-lg border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() =>
                                            saveEditAcomp(
                                              a.documentId,
                                              invitado.documentId,
                                            )
                                          }
                                          disabled={savingAcompEdit}
                                          className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                                        >
                                          <Save className="w-3 h-3" />
                                          Guardar
                                        </button>
                                        <button
                                          onClick={cancelEditAcomp}
                                          className="flex items-center gap-1 px-3 py-1 text-xs bg-linen dark:bg-gray-700 hover:bg-blush dark:hover:bg-gray-600 text-charcoal dark:text-white rounded-lg transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between bg-linen/50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                                      <div className="min-w-0">
                                        <span className="text-sm text-charcoal dark:text-white">
                                          {a.full_name}
                                        </span>
                                        {a.phone && (
                                          <span className="ml-3 text-xs text-muted/70 dark:text-gray-500">
                                            {a.phone}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex gap-1 shrink-0 ml-2">
                                        <button
                                          onClick={() =>
                                            sendWhatsApp(
                                              a.phone ?? "",
                                              invitado.unique_code,
                                              a.full_name,
                                              whatsappMessage,
                                            )
                                          }
                                          title="Enviar WhatsApp"
                                          className="p-1 text-green-500 dark:text-green-400 hover:bg-linen dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                          <MessageCircle className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => startEditAcomp(a)}
                                          title="Editar acompañante"
                                          className="p-1 text-blue-500 dark:text-blue-400 hover:bg-linen dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            deleteAcompanante(
                                              a.documentId,
                                              invitado.documentId,
                                            )
                                          }
                                          className="p-1 text-red-400 hover:bg-linen dark:hover:bg-gray-700 rounded transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {invitadosFiltrados.length === 0 && (
          <div className="py-8 text-center text-muted/70 dark:text-gray-500 text-sm">
            Sin resultados para "{search}"
          </div>
        )}
      </div>

      {/* MODAL VISTA PREVIA IMPORTACIÓN */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-blush-dark dark:border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-blush-dark dark:border-gray-700 shrink-0">
              <div>
                <h3 className="text-lg text-charcoal dark:text-white font-light">
                  Vista previa de importación
                </h3>
                <p className="text-xs text-muted dark:text-gray-400 mt-0.5">
                  {selectedGroups.size} de {importPreview.length} invitados
                  seleccionados
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setSelectedGroups(
                      selectedGroups.size === importPreview.length
                        ? new Set()
                        : new Set(importPreview.map((_, i) => i)),
                    )
                  }
                  className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                >
                  {selectedGroups.size === importPreview.length
                    ? "Deseleccionar todo"
                    : "Seleccionar todo"}
                </button>
                <button
                  onClick={() => {
                    setImportPreview(null);
                    setSelectedGroups(new Set());
                  }}
                  className="p-1.5 text-muted dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-linen dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {importPreview.map((grupo, idx) => {
                const checked = selectedGroups.has(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const next = new Set(selectedGroups);
                      if (checked) next.delete(idx);
                      else next.add(idx);
                      setSelectedGroups(next);
                    }}
                    className={`rounded-xl border cursor-pointer transition-all duration-150 ${
                      checked
                        ? "border-indigo-400/60 dark:border-indigo-500/60 bg-indigo-50 dark:bg-indigo-950/40"
                        : "border-blush-dark dark:border-gray-700 bg-linen/50 dark:bg-gray-800/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-indigo-500 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-charcoal dark:text-white font-medium truncate">
                          {grupo.nombre}
                        </p>
                        {grupo.phone && (
                          <p className="text-xs text-muted dark:text-gray-400">{grupo.phone}</p>
                        )}
                      </div>
                      <span className="text-xs text-indigo-500 dark:text-indigo-400 shrink-0">
                        {1 + grupo.acomps.length}{" "}
                        {grupo.acomps.length === 0 ? "pase" : "pases"}
                      </span>
                    </div>

                    {grupo.acomps.length > 0 && (
                      <div className="border-t border-blush-dark/60 dark:border-gray-700/60 mx-4 mb-3 pt-2 space-y-1.5">
                        {grupo.acomps.map((a, ai) => (
                          <div
                            key={ai}
                            className="flex items-center gap-2 pl-7"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0" />
                            <p className="text-sm text-charcoal/75 dark:text-gray-300 truncate">
                              {a.nombre}
                            </p>
                            {a.phone && (
                              <p className="text-xs text-muted/70 dark:text-gray-500 ml-auto shrink-0">
                                {a.phone}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-t border-blush-dark dark:border-gray-700 shrink-0">
              <button
                onClick={confirmImport}
                disabled={importing || selectedGroups.size === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-light"
              >
                <Upload className="w-4 h-4" />
                {importing
                  ? "Importando..."
                  : `Importar ${selectedGroups.size} invitado${selectedGroups.size !== 1 ? "s" : ""}`}
              </button>
              <button
                onClick={() => {
                  setImportPreview(null);
                  setSelectedGroups(new Set());
                }}
                disabled={importing}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-linen dark:bg-gray-700 hover:bg-blush dark:hover:bg-gray-600 disabled:opacity-50 text-charcoal dark:text-white rounded-lg transition-colors font-light"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}
