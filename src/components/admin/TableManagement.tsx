import { useState } from "react";
import { guestService, tableService } from "../../lib/services";
import type { Guest, Table, Companion } from "../../lib/types";
import { Plus, Trash2, X, Crown, UserPlus, Users } from "lucide-react";
import toast from "react-hot-toast";

interface TableManagementProps {
  invitados: Guest[];
  mesas: Table[];
  acompanantes: Companion[];
  eventDocumentId: string;
  onRefresh: () => void;
}

export default function TableManagement({
  invitados,
  mesas,
  acompanantes,
  eventDocumentId,
  onRefresh,
}: TableManagementProps) {
  const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [assigningGuest, setAssigningGuest] = useState<string | null>(null);
  const [modalMesaDocId, setModalMesaDocId] = useState<string | null>(null);

  const confirmadosNoAsignados = invitados.filter(
    (i) => i.status === "yes" && !i.table && i.confirmed_passes > 0,
  );

  const getPassesUsed = (mesaDocId: string) =>
    invitados
      .filter((g) => g.table?.documentId === mesaDocId)
      .reduce((s, g) => s + g.confirmed_passes, 0);

  // ── Asignación desde modal ──────────────────────────────────────────────────

  const handleAssignFromModal = async (guest: Guest, mesaDocId: string) => {
    const mesa = mesas.find((m) => m.documentId === mesaDocId);
    if (!mesa) return;

    const available = mesa.capacity - getPassesUsed(mesaDocId);
    if (guest.confirmed_passes > available) {
      toast.error(`Sin espacio. Disponibles: ${available}, Requeridos: ${guest.confirmed_passes}`);
      return;
    }

    try {
      setAssigningGuest(guest.documentId);
      await guestService.assignTable(guest.documentId, mesaDocId);
      toast.success("Invitado asignado");
      onRefresh();
    } catch (err) {
      console.error("Error asignando mesa:", err);
      toast.error("Error al asignar la mesa");
    } finally {
      setAssigningGuest(null);
    }
  };

  const handleRemoveFromModal = async (guestDocId: string) => {
    try {
      setAssigningGuest(guestDocId);
      await guestService.removeFromTable(guestDocId);
      onRefresh();
    } catch (err) {
      console.error("Error removiendo de mesa:", err);
      toast.error("Error al quitar el invitado");
    } finally {
      setAssigningGuest(null);
    }
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, guest: Guest) => {
    setDraggedGuest(guest);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnTable = async (e: React.DragEvent<HTMLDivElement>, mesaDocId: string) => {
    e.preventDefault();
    if (!draggedGuest) return;

    const mesa = mesas.find((m) => m.documentId === mesaDocId);
    if (!mesa) return;

    const available = mesa.capacity - getPassesUsed(mesaDocId);
    if (draggedGuest.confirmed_passes > available) {
      toast.error(`No hay suficientes pases. Disponibles: ${available}, Requeridos: ${draggedGuest.confirmed_passes}`);
      return;
    }

    try {
      setLoading(true);
      await guestService.assignTable(draggedGuest.documentId, mesaDocId);
      toast.success("Invitado asignado a la mesa");
      setDraggedGuest(null);
      onRefresh();
    } catch (err) {
      console.error("Error assigning table:", err);
      toast.error("Error al asignar la mesa");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromTable = async (guestDocId: string) => {
    try {
      setLoading(true);
      await guestService.removeFromTable(guestDocId);
      onRefresh();
    } catch (err) {
      console.error("Error removing from table:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetCapitan = async (
    mesaDocId: string,
    type: "invitado" | "acompanante",
    personDocId: string,
    isCurrentCapitan: boolean,
  ) => {
    try {
      setLoading(true);
      if (isCurrentCapitan) {
        await tableService.clearCapitan(mesaDocId);
      } else {
        const strapiType = type === "invitado" ? "guest" : "companion";
        await tableService.setCapitan(mesaDocId, strapiType, personDocId);
      }
      onRefresh();
    } catch (err) {
      console.error("Error al asignar capitán:", err);
      toast.error("Error al asignar el capitán de mesa");
    } finally {
      setLoading(false);
    }
  };

  const addTable = async () => {
    if (!newTableName.trim()) return;
    try {
      setLoading(true);
      await tableService.create(eventDocumentId, {
        name: newTableName.trim(),
        capacity: newTableCapacity,
      });
      toast.success("Mesa agregada correctamente");
      setNewTableName("");
      onRefresh();
    } catch (err) {
      console.error("Error adding table:", err);
      toast.error("Error al agregar la mesa");
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (mesaDocId: string) => {
    if (!window.confirm("¿Eliminar esta mesa? Los invitados serán desasignados.")) return;
    try {
      setLoading(true);
      await tableService.remove(mesaDocId);
      onRefresh();
    } catch (err) {
      console.error("Error deleting table:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Modal data ──────────────────────────────────────────────────────────────

  const modalMesa = modalMesaDocId ? mesas.find((m) => m.documentId === modalMesaDocId) : null;
  const modalMesaGuests = modalMesaDocId
    ? invitados.filter((g) => g.table?.documentId === modalMesaDocId)
    : [];
  const modalPassesUsed = modalMesaGuests.reduce((s, g) => s + g.confirmed_passes, 0);
  const modalAvailable = modalMesa ? modalMesa.capacity - modalPassesUsed : 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-blush-dark dark:border-gray-700">
          <h3 className="text-base sm:text-lg text-charcoal dark:text-white font-light mb-1">
            Invitados Sin Asignar
          </h3>
          <p className="text-xs text-muted dark:text-gray-500 mb-4">
            Arrastra a una mesa o usa el botón <Users className="inline w-3 h-3" /> en cada mesa.
          </p>

          <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
            {confirmadosNoAsignados.length === 0 ? (
              <p className="text-muted dark:text-gray-400 text-sm">Todos asignados</p>
            ) : (
              confirmadosNoAsignados.map((guest) => (
                <div
                  key={guest.documentId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, guest)}
                  className="p-3 bg-linen dark:bg-gray-700 hover:bg-blush dark:hover:bg-gray-600 rounded-lg cursor-move transition-colors"
                >
                  <div className="text-charcoal dark:text-white text-sm font-light">
                    {guest.full_name}
                  </div>
                  <div className="text-xs text-muted dark:text-gray-400">
                    {guest.confirmed_passes} pases
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-blush-dark dark:border-gray-700">
            <h4 className="text-sm text-muted dark:text-gray-400 mb-3">Agregar Mesa</h4>
            <div className="flex-1 gap-2">
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Nombre o número de mesa"
                className="px-3 py-2 bg-linen dark:bg-gray-700 text-charcoal dark:text-white rounded-lg border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 10)}
                placeholder="10"
                min={1}
                className="px-3 py-2 bg-linen dark:bg-gray-700 text-charcoal dark:text-white rounded-lg border border-blush-dark dark:border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addTable}
                disabled={loading || !newTableName || newTableCapacity < 1}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* PANEL MESAS */}
        <div className="lg:col-span-2">
          <h3 className="text-base sm:text-lg text-charcoal dark:text-white font-light mb-4">
            Mesas
          </h3>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 max-h-[600px] overflow-y-auto">
            {mesas.map((mesa) => {
              const mesaGuests = invitados.filter((g) => g.table?.documentId === mesa.documentId);
              const passesUsed = mesaGuests.reduce((sum, g) => sum + g.confirmed_passes, 0);
              const availablePasses = mesa.capacity - passesUsed;
              const isFull = availablePasses <= 0;

              const capitanNombre = mesa.captain_guest
                ? mesa.captain_guest.full_name
                : mesa.captain_companion
                  ? mesa.captain_companion.full_name
                  : null;

              return (
                <div
                  key={mesa.documentId}
                  onDragOver={!isFull ? handleDragOver : undefined}
                  onDrop={!isFull ? (e) => handleDropOnTable(e, mesa.documentId) : undefined}
                  className={`bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed p-4 transition-colors ${
                    isFull
                      ? "border-red-400 dark:border-red-600 hover:border-red-500"
                      : "border-blush-dark dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
                  }`}
                >
                  {/* Header de mesa */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-charcoal dark:text-white font-light text-base sm:text-lg">
                        Mesa {mesa.name}
                      </div>
                      <div className={`text-xs ${isFull ? "text-red-500 dark:text-red-400" : "text-muted dark:text-gray-400"}`}>
                        {passesUsed}/{mesa.capacity} pases
                        {!isFull && (
                          <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                            (+{availablePasses})
                          </span>
                        )}
                        {isFull && (
                          <span className="ml-2 text-red-500 dark:text-red-400">(Llena)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setModalMesaDocId(mesa.documentId)}
                        title="Gestionar invitados"
                        className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTable(mesa.documentId)}
                        className="p-1.5 text-red-400 hover:bg-blush dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Capitán actual */}
                  {capitanNombre && (
                    <div className="flex items-center gap-1 mb-3 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                      <Crown className="w-3 h-3 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-700 dark:text-yellow-300 text-xs truncate">
                        {capitanNombre}
                      </span>
                    </div>
                  )}

                  {/* Lista de invitados y acompañantes */}
                  <div className="space-y-2">
                    {mesaGuests.length === 0 ? (
                      <div className="text-muted/70 dark:text-gray-500 text-sm italic text-center py-6">
                        Arrastra invitados aquí
                      </div>
                    ) : (
                      mesaGuests.map((guest) => {
                        const isCapitanInvitado = mesa.captain_guest?.documentId === guest.documentId;
                        const guestAcomps = acompanantes.filter(
                          (a) => a.guest?.documentId === guest.documentId,
                        );

                        return (
                          <div key={guest.documentId}>
                            <div
                              className={`p-2 rounded border flex items-center justify-between ${
                                isCapitanInvitado
                                  ? "bg-yellow-500/15 border-yellow-500/40"
                                  : "bg-green-600/10 dark:bg-green-600/20 border-green-500/30 dark:border-green-600/30"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  onClick={() => handleSetCapitan(mesa.documentId, "invitado", guest.documentId, isCapitanInvitado)}
                                  disabled={loading}
                                  title={isCapitanInvitado ? "Quitar capitán" : "Hacer capitán de mesa"}
                                  className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-black/10 disabled:opacity-40"
                                >
                                  <Crown
                                    className={`w-3.5 h-3.5 ${
                                      isCapitanInvitado
                                        ? "text-yellow-500 fill-yellow-500 dark:text-yellow-400 dark:fill-yellow-400"
                                        : "text-muted dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400"
                                    }`}
                                  />
                                </button>
                                <div className="min-w-0">
                                  <div className="text-charcoal dark:text-white text-sm truncate">
                                    {guest.full_name}
                                  </div>
                                  <div className="text-xs text-muted dark:text-gray-400">
                                    {guest.confirmed_passes} pases
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemoveFromTable(guest.documentId)}
                                className="p-1 text-red-400 hover:bg-red-600/20 rounded transition-colors flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {guestAcomps.map((acomp) => {
                              const isCapitanAcomp = mesa.captain_companion?.documentId === acomp.documentId;
                              return (
                                <div
                                  key={acomp.documentId}
                                  className={`ml-4 mt-1 p-1.5 rounded border flex items-center justify-between ${
                                    isCapitanAcomp
                                      ? "bg-yellow-500/10 border-yellow-500/30"
                                      : "bg-green-600/5 dark:bg-green-600/10 border-green-500/20 dark:border-green-600/20"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <button
                                      onClick={() => handleSetCapitan(mesa.documentId, "acompanante", acomp.documentId, isCapitanAcomp)}
                                      disabled={loading}
                                      title={isCapitanAcomp ? "Quitar capitán" : "Hacer capitán de mesa"}
                                      className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-black/10 disabled:opacity-40"
                                    >
                                      <Crown
                                        className={`w-3 h-3 ${
                                          isCapitanAcomp
                                            ? "text-yellow-500 fill-yellow-500 dark:text-yellow-400 dark:fill-yellow-400"
                                            : "text-muted/50 dark:text-gray-600 hover:text-yellow-500 dark:hover:text-yellow-400"
                                        }`}
                                      />
                                    </button>
                                    <span className="text-charcoal/75 dark:text-gray-300 text-xs truncate">
                                      {acomp.full_name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL GESTIÓN DE MESA */}
      {modalMesa && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModalMesaDocId(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl border border-blush-dark dark:border-gray-700 w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-blush-dark dark:border-gray-700 shrink-0">
              <div>
                <h3 className="text-lg text-charcoal dark:text-white font-light">
                  Mesa {modalMesa.name}
                </h3>
                <p className={`text-xs mt-0.5 ${modalAvailable <= 0 ? "text-red-500 dark:text-red-400" : "text-muted dark:text-gray-400"}`}>
                  {modalPassesUsed}/{modalMesa.capacity} pases
                  {modalAvailable > 0 && (
                    <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                      ({modalAvailable} disponible{modalAvailable !== 1 ? "s" : ""})
                    </span>
                  )}
                  {modalAvailable <= 0 && <span className="ml-2">(Llena)</span>}
                </p>
              </div>
              <button
                onClick={() => setModalMesaDocId(null)}
                className="p-2 text-muted dark:text-gray-400 hover:text-charcoal dark:hover:text-white hover:bg-linen dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Invitados en esta mesa */}
              <div>
                <p className="text-xs text-muted dark:text-gray-500 uppercase tracking-wider mb-2">
                  En esta mesa ({modalMesaGuests.length})
                </p>
                {modalMesaGuests.length === 0 ? (
                  <p className="text-sm text-muted/70 dark:text-gray-500 italic">
                    Sin invitados asignados
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {modalMesaGuests.map((guest) => (
                      <div
                        key={guest.documentId}
                        className="flex items-center justify-between bg-green-600/10 dark:bg-green-600/20 border border-green-500/30 dark:border-green-600/30 rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm text-charcoal dark:text-white truncate">
                            {guest.full_name}
                          </div>
                          <div className="text-xs text-muted dark:text-gray-400">
                            {guest.confirmed_passes} pases
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFromModal(guest.documentId)}
                          disabled={assigningGuest === guest.documentId}
                          className="ml-2 p-1 text-red-400 hover:bg-red-600/20 rounded transition-colors flex-shrink-0 disabled:opacity-40"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invitados para agregar */}
              <div>
                <p className="text-xs text-muted dark:text-gray-500 uppercase tracking-wider mb-2">
                  Agregar invitados ({confirmadosNoAsignados.length} sin asignar)
                </p>
                {confirmadosNoAsignados.length === 0 ? (
                  <p className="text-sm text-muted/70 dark:text-gray-500 italic">
                    Todos los invitados confirmados están asignados
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {confirmadosNoAsignados.map((guest) => {
                      const canFit = guest.confirmed_passes <= modalAvailable;
                      const isAssigning = assigningGuest === guest.documentId;
                      return (
                        <div
                          key={guest.documentId}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${
                            canFit
                              ? "bg-linen dark:bg-gray-800 border-blush-dark dark:border-gray-600"
                              : "bg-linen/50 dark:bg-gray-800/50 border-blush-dark/50 dark:border-gray-700 opacity-50"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-sm text-charcoal dark:text-white truncate">
                              {guest.full_name}
                            </div>
                            <div className="text-xs text-muted dark:text-gray-400">
                              {guest.confirmed_passes} pases
                              {!canFit && (
                                <span className="ml-1 text-red-400">— sin espacio</span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAssignFromModal(guest, modalMesa.documentId)}
                            disabled={!canFit || isAssigning}
                            title={canFit ? "Agregar a esta mesa" : "Sin espacio suficiente"}
                            className="ml-2 p-1 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 rounded transition-colors flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
