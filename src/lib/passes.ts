import type { Companion, Guest } from './types';

// Pases por invitado: confirmados si asiste, totales si no; nunca menos que
// las personas registradas (titular + acompañantes con nombre)
export function makePasesPorInvitado(acompanantes: Companion[]) {
  const acompPorInvitado = acompanantes.reduce<Record<string, number>>((acc, a) => {
    const guestDocId = a.guest?.documentId;
    if (guestDocId) acc[guestDocId] = (acc[guestDocId] ?? 0) + 1;
    return acc;
  }, {});

  return (i: Guest) =>
    Math.max(
      i.status === 'yes' ? i.confirmed_passes : i.max_passes,
      1 + (acompPorInvitado[i.documentId] ?? 0),
    );
}
