import type { Guest, Table, Companion } from "../../lib/types";
import { BarChart, Users } from "lucide-react";

interface AdminStatsProps {
  invitados: Guest[];
  mesas: Table[];
  acompanantes: Companion[];
}

export default function AdminStats({ invitados, mesas, acompanantes }: AdminStatsProps) {
  const docIdsConfirmados = new Set(
    invitados.filter((i) => i.status === "yes").map((i) => i.documentId)
  );

  const acompPorInvitado = acompanantes.reduce<Record<string, number>>((acc, a) => {
    const guestDocId = a.guest?.documentId;
    if (guestDocId) acc[guestDocId] = (acc[guestDocId] ?? 0) + 1;
    return acc;
  }, {});

  const personasPorMesa = (mesaDocId: string) => {
    const invsMesa = invitados.filter((i) => i.table?.documentId === mesaDocId);
    return invsMesa.reduce((sum, i) => sum + i.confirmed_passes, 0);
  };

  const mesasOcupadas = mesas.filter((m) =>
    invitados.some((i) => i.table?.documentId === m.documentId)
  );
  const mesasLibres = mesas.length - mesasOcupadas.length;

  const invConfirmadosConMesa = invitados.filter((i) => i.status === "yes" && i.table);
  const invConfirmadosSinMesa = invitados.filter((i) => i.status === "yes" && !i.table);

  const personasConMesa = invConfirmadosConMesa.reduce(
    (sum, i) => sum + 1 + (acompPorInvitado[i.documentId] ?? 0),
    0,
  );
  const personasSinMesa = invConfirmadosSinMesa.reduce(
    (sum, i) => sum + 1 + (acompPorInvitado[i.documentId] ?? 0),
    0,
  );

  const acompConfirmados = acompanantes.filter(
    (a) => a.guest?.documentId && docIdsConfirmados.has(a.guest.documentId)
  ).length;
  const totalConfirmados = invitados.filter((i) => i.status === "yes").length;
  const totalConfirmadosPersonas = totalConfirmados + acompConfirmados;
  const totalRechazados = invitados.filter((i) => i.status === "no").length;
  const totalPendientes = invitados.filter((i) => i.status === "pending").length;

  const totalPersonas = invitados.length + acompanantes.length;

  const pasesPromedio =
    invitados.length > 0
      ? (invitados.reduce((sum, i) => sum + i.confirmed_passes, 0) / invitados.length).toFixed(2)
      : 0;

  const ocupacionPorMesa = mesas.map((mesa) => ({
    mesa: mesa.number,
    mesaDocId: mesa.documentId,
    ocupacion: personasPorMesa(mesa.documentId),
    capacidad: mesa.capacity,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* CARD 1: Ocupación de Mesas */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <BarChart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <h3 className="text-base sm:text-lg text-white font-light">
              Ocupación de Mesas
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Mesas Ocupadas</span>
              <span className="text-xl sm:text-2xl text-green-400 font-bold">
                {mesasOcupadas.length}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Mesas Libres</span>
              <span className="text-xl sm:text-2xl text-gray-400 font-bold">
                {mesasLibres}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm sm:text-base">Porcentaje</span>
              <span className="text-xl sm:text-2xl text-yellow-400 font-bold">
                {mesas.length > 0
                  ? ((mesasOcupadas.length / mesas.length) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Asignación */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            <h3 className="text-base sm:text-lg text-white font-light">
              Asignación de Mesas
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Con Mesa</span>
              <span className="text-xl sm:text-2xl text-green-400 font-bold">
                {personasConMesa}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">
                Sin Mesa (confirmados)
              </span>
              <span className="text-xl sm:text-2xl text-orange-400 font-bold">
                {personasSinMesa}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm sm:text-base">% Con Mesa</span>
              <span className="text-xl sm:text-2xl text-blue-400 font-bold">
                {totalConfirmadosPersonas > 0
                  ? ((personasConMesa / totalConfirmadosPersonas) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Info General */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <h3 className="text-base sm:text-lg text-white font-light mb-4 sm:mb-6">
            Información General
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Total Personas</span>
              <span className="text-xl sm:text-2xl text-blue-400 font-bold">
                {totalPersonas}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Confirmados</span>
              <span className="text-xl sm:text-2xl text-green-400 font-bold">
                {totalConfirmados}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Sin Confirmar</span>
              <span className="text-xl sm:text-2xl text-orange-400 font-bold">
                {totalPendientes}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Rechazadas</span>
              <span className="text-xl sm:text-2xl text-red-400 font-bold">
                {totalRechazados}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Acompañantes</span>
              <span className="text-xl sm:text-2xl text-amber-400 font-bold">
                {acompanantes.length}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Capacidad Total</span>
              <span className="text-xl sm:text-2xl text-cyan-400 font-bold">
                {mesas.reduce((sum, m) => sum + m.capacity, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm sm:text-base">Pases Promedio</span>
              <span className="text-xl sm:text-2xl text-indigo-400 font-bold">
                {pasesPromedio}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm sm:text-base">Mesas</span>
              <span className="text-xl sm:text-2xl text-pink-400 font-bold">
                {mesas.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OCUPACIÓN POR MESA */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
        <h3 className="text-base sm:text-lg text-white font-light mb-1 sm:mb-2">
          Ocupación por Mesa
        </h3>
        <p className="text-xs text-gray-500 mb-4 sm:mb-6">
          Personas = pases confirmados de invitados asignados
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto">
          {ocupacionPorMesa.map(({ mesa, mesaDocId, ocupacion, capacidad }) => {
            const porcentaje = capacidad > 0 ? (ocupacion / capacidad) * 100 : 0;
            const color =
              porcentaje === 0
                ? "bg-gray-700"
                : porcentaje > 100
                  ? "bg-red-600"
                  : porcentaje < 50
                    ? "bg-yellow-600"
                    : "bg-green-600";

            return (
              <div key={mesaDocId} className="text-center">
                <div className="text-xs sm:text-sm text-gray-400 mb-1 sm:mb-2">
                  Mesa {mesa}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg bg-gray-700 flex items-center justify-center mb-1 sm:mb-2">
                  <span className="text-white text-xs sm:text-sm font-bold">
                    {ocupacion}/{capacidad}
                  </span>
                </div>
                <div className="w-10 sm:w-12 h-2 bg-gray-600 rounded-full mx-auto overflow-hidden">
                  <div
                    className={`h-full ${color}`}
                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
