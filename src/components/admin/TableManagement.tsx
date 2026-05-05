import { useState } from "react";
import { guestService, tableService } from "../../lib/services";
import type { Guest, Table, Companion } from "../../lib/types";
import { Plus, Trash2, X, Crown } from "lucide-react";
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
  const [newTableNumber, setNewTableNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const confirmadosNoAsignados = invitados.filter(
    (i) => i.status === "yes" && !i.table && i.confirmed_passes > 0,
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, guest: Guest) => {
    setDraggedGuest(guest);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnTable = async (
    e: React.DragEvent<HTMLDivElement>,
    mesaDocId: string,
  ) => {
    e.preventDefault();
    if (!draggedGuest) return;

    const mesa = mesas.find((m) => m.documentId === mesaDocId);
    if (!mesa) return;

    const mesaGuests = invitados.filter((g) => g.table?.documentId === mesaDocId);
    const currentPassesUsed = mesaGuests.reduce(
      (sum, g) => sum + g.confirmed_passes,
      0,
    );
    const availablePasses = mesa.capacity - currentPassesUsed;

    if (draggedGuest.confirmed_passes > availablePasses) {
      toast.error(
        `No hay suficientes pases. Disponibles: ${availablePasses}, Requeridos: ${draggedGuest.confirmed_passes}`,
      );
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
    if (!newTableNumber.trim()) return;

    try {
      setLoading(true);
      await tableService.create(eventDocumentId, {
        number: parseInt(newTableNumber),
      });
      toast.success("Mesa agregada correctamente");
      setNewTableNumber("");
      onRefresh();
    } catch (err) {
      console.error("Error adding table:", err);
      toast.error("Error al agregar la mesa");
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (mesaDocId: string) => {
    if (!window.confirm("¿Eliminar esta mesa? Los invitados serán desasignados."))
      return;

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <h3 className="text-base sm:text-lg text-white font-light mb-4">
            Invitados Sin Asignar
          </h3>

          <div className="space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
            {confirmadosNoAsignados.length === 0 ? (
              <p className="text-gray-400 text-sm">Todos asignados</p>
            ) : (
              confirmadosNoAsignados.map((guest) => (
                <div
                  key={guest.documentId}
                  draggable
                  onDragStart={(e) => handleDragStart(e, guest)}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-move transition-colors"
                >
                  <div className="text-white text-sm sm:text-base font-light">
                    {guest.full_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {guest.confirmed_passes} pases
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-sm text-gray-400 mb-3">Agregar Mesa</h4>

            <div className="flex gap-2">
              <input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(e.target.value)}
                placeholder="Nro."
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              />

              <button
                onClick={addTable}
                disabled={loading || !newTableNumber}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* PANEL MESAS */}
        <div className="lg:col-span-2">
          <h3 className="text-base sm:text-lg text-white font-light mb-4">
            Mesas
          </h3>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 max-h-[600px] overflow-y-auto">
            {mesas.map((mesa) => {
              const mesaGuests = invitados.filter(
                (g) => g.table?.documentId === mesa.documentId,
              );
              const passesUsed = mesaGuests.reduce(
                (sum, g) => sum + g.confirmed_passes,
                0,
              );
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
                  onDrop={
                    !isFull
                      ? (e) => handleDropOnTable(e, mesa.documentId)
                      : undefined
                  }
                  className={`bg-gray-800 rounded-lg border-2 border-dashed p-4 transition-colors ${
                    isFull
                      ? "border-red-600 hover:border-red-500"
                      : "border-gray-600 hover:border-blue-500"
                  }`}
                >
                  {/* Header de mesa */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-white font-light text-base sm:text-lg">
                        Mesa {mesa.number}
                      </div>
                      <div
                        className={`text-xs ${isFull ? "text-red-400" : "text-gray-400"}`}
                      >
                        {passesUsed}/{mesa.capacity} pases
                        {!isFull && (
                          <span className="ml-2 text-yellow-400">
                            (+{availablePasses})
                          </span>
                        )}
                        {isFull && (
                          <span className="ml-2 text-red-400">(Llena)</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTable(mesa.documentId)}
                      className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Capitán actual */}
                  {capitanNombre && (
                    <div className="flex items-center gap-1 mb-3 px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                      <Crown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                      <span className="text-yellow-300 text-xs truncate">
                        {capitanNombre}
                      </span>
                    </div>
                  )}

                  {/* Lista de invitados y acompañantes */}
                  <div className="space-y-2">
                    {mesaGuests.length === 0 ? (
                      <div className="text-gray-500 text-sm italic text-center py-6">
                        Arrastra invitados aquí
                      </div>
                    ) : (
                      mesaGuests.map((guest) => {
                        const isCapitanInvitado =
                          mesa.captain_guest?.documentId === guest.documentId;
                        const guestAcomps = acompanantes.filter(
                          (a) => a.guest?.documentId === guest.documentId,
                        );

                        return (
                          <div key={guest.documentId}>
                            {/* Fila del invitado */}
                            <div
                              className={`p-2 rounded border flex items-center justify-between ${
                                isCapitanInvitado
                                  ? "bg-yellow-500/15 border-yellow-500/40"
                                  : "bg-green-600/20 border-green-600/30"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <button
                                  onClick={() =>
                                    handleSetCapitan(
                                      mesa.documentId,
                                      "invitado",
                                      guest.documentId,
                                      isCapitanInvitado,
                                    )
                                  }
                                  disabled={loading}
                                  title={
                                    isCapitanInvitado
                                      ? "Quitar capitán"
                                      : "Hacer capitán de mesa"
                                  }
                                  className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-white/10 disabled:opacity-40"
                                >
                                  <Crown
                                    className={`w-3.5 h-3.5 ${
                                      isCapitanInvitado
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-500 hover:text-yellow-400"
                                    }`}
                                  />
                                </button>
                                <div className="min-w-0">
                                  <div className="text-white text-sm truncate">
                                    {guest.full_name}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {guest.confirmed_passes} pases
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() =>
                                  handleRemoveFromTable(guest.documentId)
                                }
                                className="p-1 text-red-400 hover:bg-red-600/20 rounded transition-colors flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Acompañantes del invitado */}
                            {guestAcomps.map((acomp) => {
                              const isCapitanAcomp =
                                mesa.captain_companion?.documentId ===
                                acomp.documentId;
                              return (
                                <div
                                  key={acomp.documentId}
                                  className={`ml-4 mt-1 p-1.5 rounded border flex items-center justify-between ${
                                    isCapitanAcomp
                                      ? "bg-yellow-500/10 border-yellow-500/30"
                                      : "bg-green-600/10 border-green-600/20"
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <button
                                      onClick={() =>
                                        handleSetCapitan(
                                          mesa.documentId,
                                          "acompanante",
                                          acomp.documentId,
                                          isCapitanAcomp,
                                        )
                                      }
                                      disabled={loading}
                                      title={
                                        isCapitanAcomp
                                          ? "Quitar capitán"
                                          : "Hacer capitán de mesa"
                                      }
                                      className="flex-shrink-0 p-0.5 rounded transition-colors hover:bg-white/10 disabled:opacity-40"
                                    >
                                      <Crown
                                        className={`w-3 h-3 ${
                                          isCapitanAcomp
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-600 hover:text-yellow-400"
                                        }`}
                                      />
                                    </button>
                                    <span className="text-gray-300 text-xs truncate">
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
    </div>
  );
}
