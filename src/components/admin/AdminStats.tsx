import type { Guest, Table, Companion } from "../../lib/types";
import { BarChart, Users, CreditCard, Heart } from "lucide-react";

interface AdminStatsProps {
  invitados: Guest[];
  mesas: Table[];
  acompanantes: Companion[];
}

export default function AdminStats({ invitados, mesas, acompanantes }: AdminStatsProps) {
  const acompPorInvitado = acompanantes.reduce<Record<string, number>>((acc, a) => {
    const guestDocId = a.guest?.documentId;
    if (guestDocId) acc[guestDocId] = (acc[guestDocId] ?? 0) + 1;
    return acc;
  }, {});

  // Número de pases por invitado = titular más sus acompañantes
  const pasesPorInvitado = (i: Guest) => 1 + (acompPorInvitado[i.documentId] ?? 0);

  // Ocupación por mesa (se mantiene como está)
  const personasPorMesa = (mesaDocId: string) => {
    const invsMesa = invitados.filter((i) => i.table?.documentId === mesaDocId);
    return invsMesa.reduce((sum, i) => sum + i.confirmed_passes, 0);
  };

  const mesasAsignadas = mesas.filter((m) =>
    invitados.some((i) => i.table?.documentId === m.documentId)
  );
  const mesasLibres = mesas.length - mesasAsignadas.length;

  const totalInvitados = invitados.length + acompanantes.length;

  const pasesConfirmados = invitados
    .filter((i) => i.status === "yes")
    .reduce((sum, i) => sum + pasesPorInvitado(i), 0);

  const pasesSinConfirmar = invitados
    .filter((i) => i.status === "pending")
    .reduce((sum, i) => sum + pasesPorInvitado(i), 0);

  const pasesRechazados = invitados
    .filter((i) => i.status === "no")
    .reduce((sum, i) => sum + pasesPorInvitado(i), 0);

  const pasesConMesa = invitados
    .filter((i) => i.table != null)
    .reduce((sum, i) => sum + pasesPorInvitado(i), 0);

  const pasesSinMesa = invitados
    .filter((i) => i.status === "yes" && !i.table)
    .reduce((sum, i) => sum + pasesPorInvitado(i), 0);

  const selfPayedGuests = invitados.filter((i) => i.self_payed).length;
  const selfPayedAcomp = acompanantes.filter((a) => a.self_payed).length;
  const totalSelfPayed = selfPayedGuests + selfPayedAcomp;

  const guestMap = new Map(invitados.map((i) => [i.documentId, i]));
  const getAcompInvitedBy = (a: Companion) => {
    if (a.invited_by) return a.invited_by;
    if (a.guest?.documentId) {
      return guestMap.get(a.guest.documentId)?.invited_by ?? null;
    }
    return null;
  };

  const invitadosPorNovio = invitados.filter((i) => i.invited_by === "novio").length;
  const invitadosPorNovia = invitados.filter((i) => i.invited_by === "novia").length;
  const acompPorNovio = acompanantes.filter((a) => getAcompInvitedBy(a) === "novio").length;
  const acompPorNovia = acompanantes.filter((a) => getAcompInvitedBy(a) === "novia").length;
  const totalPasesNovio = invitadosPorNovio + acompPorNovio;
  const totalPasesNovia = invitadosPorNovia + acompPorNovia;

  const pasesPromedio =
    invitados.length > 0
      ? (totalInvitados / invitados.length).toFixed(2)
      : 0;

  const ocupacionPorMesa = mesas.map((mesa) => ({
    mesa: mesa.name,
    mesaDocId: mesa.documentId,
    ocupacion: personasPorMesa(mesa.documentId),
    capacidad: mesa.capacity,
  }));

  const card = "bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-blush-dark dark:border-gray-700";
  const cardTitle = "text-base sm:text-lg text-charcoal dark:text-white font-light";
  const rowLabel = "text-muted dark:text-gray-400 text-sm sm:text-base";
  const divider = "pb-3 border-b border-blush-dark dark:border-gray-700";

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* CARD 1: Ocupación de Mesas */}
        <div className={card}>
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <BarChart className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <h3 className={cardTitle}>Ocupación de Mesas</h3>
          </div>

          <div className="space-y-3">
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Mesas Asignadas</span>
              <span className="text-xl sm:text-2xl text-green-500 dark:text-green-400 font-bold">
                {mesasAsignadas.length}
              </span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Mesas Libres</span>
              <span className="text-xl sm:text-2xl text-muted dark:text-gray-400 font-bold">
                {mesasLibres}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={rowLabel}>Porcentaje</span>
              <span className="text-xl sm:text-2xl text-yellow-600 dark:text-yellow-400 font-bold">
                {mesas.length > 0
                  ? ((mesasAsignadas.length / mesas.length) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Asignación */}
        <div className={card}>
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
            <h3 className={cardTitle}>Asignación de Mesas</h3>
          </div>

          <div className="space-y-3">
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Invitados con mesa</span>
              <span className="text-xl sm:text-2xl text-green-500 dark:text-green-400 font-bold">
                {pasesConMesa}
              </span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Sin Mesa (confirmados)</span>
              <span className="text-xl sm:text-2xl text-orange-500 dark:text-orange-400 font-bold">
                {pasesSinMesa}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={rowLabel}>% Con Mesa</span>
              <span className="text-xl sm:text-2xl text-blue-500 dark:text-blue-400 font-bold">
                {pasesConfirmados > 0
                  ? ((pasesConMesa / pasesConfirmados) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: Info General */}
        <div className={card}>
          <h3 className={`${cardTitle} mb-4 sm:mb-6`}>Información General</h3>

          <div className="space-y-3">
            {[
              { label: "Total de invitados", val: totalInvitados, color: "text-blue-500 dark:text-blue-400" },
              { label: "Confirmados", val: pasesConfirmados, color: "text-green-500 dark:text-green-400" },
              { label: "Sin Confirmar", val: pasesSinConfirmar, color: "text-orange-500 dark:text-orange-400" },
              { label: "Rechazadas", val: pasesRechazados, color: "text-red-500 dark:text-red-400" },
              { label: "Invitados con mesa", val: pasesConMesa, color: "text-purple-500 dark:text-purple-400" },
              { label: "Mesas asignadas", val: mesasAsignadas.length, color: "text-emerald-500 dark:text-emerald-400" },
              { label: "Acompañantes", val: acompanantes.length, color: "text-amber-600 dark:text-amber-400" },
              { label: "Capacidad Total", val: mesas.reduce((sum, m) => sum + m.capacity, 0), color: "text-cyan-600 dark:text-cyan-400" },
              { label: "Pases Promedio", val: pasesPromedio, color: "text-indigo-500 dark:text-indigo-400" },
              { label: "Mesas", val: mesas.length, color: "text-pink-500 dark:text-pink-400" },
            ].map(({ label, val, color }, i, arr) => (
              <div
                key={label}
                className={`flex justify-between items-center ${i < arr.length - 1 ? divider : ""}`}
              >
                <span className={rowLabel}>{label}</span>
                <span className={`text-xl sm:text-2xl font-bold ${color}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CARD: Self Payed + Invitado por */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className={card}>
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-500" />
            <h3 className={cardTitle}>Self Payed</h3>
          </div>
          <div className="space-y-3">
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Invitados (pases)</span>
              <span className="text-xl sm:text-2xl text-emerald-500 dark:text-emerald-400 font-bold">{selfPayedGuests}</span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Acompañantes (pases)</span>
              <span className="text-xl sm:text-2xl text-emerald-500 dark:text-emerald-400 font-bold">{selfPayedAcomp}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={rowLabel}>Total (pases)</span>
              <span className="text-xl sm:text-2xl text-emerald-600 dark:text-emerald-300 font-bold">{totalSelfPayed}</span>
            </div>
          </div>
        </div>

        <div className={card}>
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-pink-400" />
            <h3 className={cardTitle}>Invitado por</h3>
          </div>
          <div className="space-y-3">
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Novio (total pases)</span>
              <span className="text-xl sm:text-2xl text-blue-500 dark:text-blue-400 font-bold">{totalPasesNovio}</span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Novio (invitados)</span>
              <span className="text-xl sm:text-2xl text-blue-400 dark:text-blue-300 font-bold">{invitadosPorNovio}</span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Novio (acomp.)</span>
              <span className="text-xl sm:text-2xl text-blue-400 dark:text-blue-300 font-bold">{acompPorNovio}</span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Novia (total pases)</span>
              <span className="text-xl sm:text-2xl text-pink-500 dark:text-pink-400 font-bold">{totalPasesNovia}</span>
            </div>
            <div className={`flex justify-between items-center ${divider}`}>
              <span className={rowLabel}>Novia (invitados)</span>
              <span className="text-xl sm:text-2xl text-pink-400 dark:text-pink-300 font-bold">{invitadosPorNovia}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={rowLabel}>Novia (acomp.)</span>
              <span className="text-xl sm:text-2xl text-pink-400 dark:text-pink-300 font-bold">{acompPorNovia}</span>
            </div>
          </div>
        </div>
      </div>

      {/* OCUPACIÓN POR MESA */}
      <div className={card}>
        <h3 className={`${cardTitle} mb-1 sm:mb-2`}>Ocupación por Mesa</h3>
        <p className="text-xs text-muted/70 dark:text-gray-500 mb-4 sm:mb-6">
          Personas = pases confirmados de invitados asignados
        </p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3 sm:gap-4 max-h-80 sm:max-h-96 overflow-y-auto">
          {ocupacionPorMesa.map(({ mesa, mesaDocId, ocupacion, capacidad }) => {
            const porcentaje = capacidad > 0 ? (ocupacion / capacidad) * 100 : 0;
            const color =
              porcentaje === 0
                ? "bg-blush dark:bg-gray-700"
                : porcentaje > 100
                  ? "bg-red-600"
                  : porcentaje < 50
                    ? "bg-yellow-500"
                    : "bg-green-500";

            return (
              <div key={mesaDocId} className="text-center">
                <div className="text-xs sm:text-sm text-muted dark:text-gray-400 mb-1 sm:mb-2">
                  Mesa {mesa}
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-lg bg-linen dark:bg-gray-700 flex items-center justify-center mb-1 sm:mb-2">
                  <span className="text-charcoal dark:text-white text-xs sm:text-sm font-bold">
                    {ocupacion}/{capacidad}
                  </span>
                </div>
                <div className="w-10 sm:w-12 h-2 bg-blush-dark dark:bg-gray-600 rounded-full mx-auto overflow-hidden">
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
