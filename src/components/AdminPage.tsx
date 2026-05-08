import { useEffect, useState, useCallback } from "react";
import {
  authService,
  guestService,
  companionService,
  tableService,
  eventService,
} from "../lib/services";
import { token } from "../lib/api";
import type { Guest, Table, Companion, StrapiUser, Event, EventChecklistItem } from "../lib/types";
import { Users, Table2, CheckCircle, XCircle, LogOut, ChevronDown, Calendar, ListChecks } from "lucide-react";
import AdminStats from "./admin/AdminStats";
import GuestManagement from "./admin/GuestManagement";
import TableManagement from "./admin/TableManagement";
import TodoManagement from "./admin/TodoManagement";

const MAIN_EVENT_ID = import.meta.env.VITE_EVENT_ID as string | undefined;

type TabType = "stats" | "guests" | "tables" | "todos";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [invitados, setInvitados] = useState<Guest[]>([]);
  const [mesas, setMesas] = useState<Table[]>([]);
  const [acompanantes, setAcompanantes] = useState<Companion[]>([]);
  const [todos, setTodos] = useState<EventChecklistItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<StrapiUser | null>(null);
  const [eventDocumentId, setEventDocumentId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isManageable, setIsManageable] = useState<boolean | null>(null);
  const [isSelectingEvent, setIsSelectingEvent] = useState(false);

  // Verifica is_manageable del evento principal y restaura sesión si hay token
  useEffect(() => {
    const manageableCheck = MAIN_EVENT_ID
      ? eventService.getOne(MAIN_EVENT_ID).then((ev) => ev.is_manageable !== false).catch(() => true)
      : Promise.resolve(true);

    const sessionCheck = token.get()
      ? eventService.getAll().catch(() => [] as Event[])
      : Promise.resolve([] as Event[]);

    Promise.all([manageableCheck, sessionCheck]).then(([manageable, events]) => {
      setIsManageable(manageable);
      if (manageable && events.length > 0) {
        setAllEvents(events);
        setIsLoggedIn(true);
        if (events.length === 1) {
          setEvent(events[0]);
          setEventDocumentId(events[0].documentId);
        } else {
          setIsSelectingEvent(true);
        }
      } else if (token.get()) {
        token.clear();
      }
      setIsCheckingSession(false);
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [invitadosData, mesasData, acompData, todosData] = await Promise.all([
        guestService.getAll(eventDocumentId ?? undefined),
        tableService.getAll(eventDocumentId ?? undefined),
        companionService.getAll(eventDocumentId ?? undefined),
        eventService.getTodos(eventDocumentId ?? undefined),
      ]);
      setInvitados(invitadosData);
      setMesas(mesasData);
      setAcompanantes(acompData);
      setTodos(todosData);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, [eventDocumentId]);

  useEffect(() => {
    if (isLoggedIn && eventDocumentId) {
      loadData();
    }
  }, [isLoggedIn, eventDocumentId, loadData]);

  const stats = {
    totalInvitados: invitados.length,
    totalPersonas: invitados.length + acompanantes.length,
    confirmados: invitados.filter((i) => i.status === "yes").length,
    rechazados: invitados.filter((i) => i.status === "no").length,
    noConfirmados: invitados.filter((i) => i.status === "pending").length,
    pasesConfirmados: invitados.reduce((sum, i) => sum + i.confirmed_passes, 0),
    conMesa: invitados.filter((i) => i.table != null).length,
  };

  const handleLogin = async () => {
    try {
      setIsAuthLoading(true);
      setLoginError("");
      const { user: me } = await authService.login(username, password);
      const events = await eventService.getAll();
      if (!events.length) {
        setLoginError("El usuario no tiene un evento asignado");
        token.clear();
        return;
      }
      setUser(me);
      setAllEvents(events);
      setIsLoggedIn(true);
      setUsername("");
      setPassword("");
      if (events.length === 1) {
        setEvent(events[0]);
        setEventDocumentId(events[0].documentId);
      } else {
        setIsSelectingEvent(true);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Usuario o contraseña incorrectos");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSelectEvent = (ev: Event) => {
    setEvent(ev);
    setEventDocumentId(ev.documentId);
    setInvitados([]);
    setMesas([]);
    setAcompanantes([]);
    setTodos([]);
    setIsSelectingEvent(false);
  };

  const handleSwitchEvent = (docId: string) => {
    const ev = allEvents.find((e) => e.documentId === docId);
    if (!ev || ev.documentId === eventDocumentId) return;
    setEvent(ev);
    setEventDocumentId(ev.documentId);
    setInvitados([]);
    setMesas([]);
    setAcompanantes([]);
    setTodos([]);
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
    setEventDocumentId(null);
    setEvent(null);
    setAllEvents([]);
    setIsSelectingEvent(false);
    setInvitados([]);
    setMesas([]);
    setAcompanantes([]);
    setTodos([]);
  };

  const handleRefresh = () => {
    if (eventDocumentId) loadData();
  };

  // ── Pantallas de estado ────────────────────────────────────────────────────

  if (isCheckingSession || isManageable === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (!isManageable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">Acceso no disponible</p>
          <a
            href="/"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
          <h2 className="text-3xl font-serif text-white mb-8 text-center">
            Panel Admin
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Ingresa tu usuario"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="Ingresa tu contraseña"
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>

            {loginError && (
              <div className="bg-red-600/20 border border-red-500 text-red-300 px-4 py-2 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isAuthLoading || !username || !password}
              className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-300 font-light tracking-wider"
            >
              {isAuthLoading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSelectingEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif text-white">
              Selecciona un evento
            </h2>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Salir
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {allEvents.map((ev) => (
              <button
                key={ev.documentId}
                onClick={() => handleSelectEvent(ev)}
                className="text-left bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-blue-500 rounded-xl p-6 transition-all duration-200 group"
              >
                <h3 className="text-white text-lg font-light mb-2 group-hover:text-blue-300 transition-colors">
                  {ev.name}
                </h3>
                {ev.event_date && (
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    {new Date(ev.event_date).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                {ev.locations?.[0]?.name && (
                  <p className="text-gray-500 text-sm mt-1">
                    {ev.locations[0].name}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Panel principal ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif text-white mb-1 sm:mb-2">
              Panel de Administración
            </h1>
            {allEvents.length > 1 ? (
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <div className="relative inline-flex items-center">
                  <select
                    value={eventDocumentId ?? ""}
                    onChange={(e) => handleSwitchEvent(e.target.value)}
                    className="appearance-none bg-gray-700 text-gray-200 text-sm sm:text-base pl-3 pr-8 py-1 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {allEvents.map((ev) => (
                      <option key={ev.documentId} value={ev.documentId}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {user && (
                  <span className="text-gray-500 text-sm">· {user.email}</span>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm sm:text-base">
                {event?.name} - Gestión de Evento
                {user && (
                  <span className="ml-2 text-gray-500">· {user.email}</span>
                )}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors w-full sm:w-auto"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 sm:p-6 rounded-xl text-white">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
            <div className="text-xl sm:text-3xl font-bold">
              {stats.totalPersonas}
            </div>
            <div className="text-xs sm:text-sm opacity-80">Total Personas</div>
            <div className="text-xs opacity-60 mt-1">
              {stats.totalInvitados} inv. + {acompanantes.length} acomp.
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 sm:p-6 rounded-xl text-white">
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
            <div className="text-xl sm:text-3xl font-bold">
              {stats.confirmados}
            </div>
            <div className="text-xs sm:text-sm opacity-80">Confirmados</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-4 sm:p-6 rounded-xl text-white">
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
            <div className="text-xl sm:text-3xl font-bold">
              {stats.noConfirmados}
            </div>
            <div className="text-xs sm:text-sm opacity-80">Sin Confirmar</div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 p-4 sm:p-6 rounded-xl text-white">
            <XCircle className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
            <div className="text-xl sm:text-3xl font-bold">
              {stats.rechazados}
            </div>
            <div className="text-xs sm:text-sm opacity-80">Rechazadas</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 p-4 sm:p-6 rounded-xl text-white">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
            <div className="text-xl sm:text-3xl font-bold">
              {stats.pasesConfirmados}
            </div>
            <div className="text-xs sm:text-sm opacity-80">
              Pases Confirmados
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-700 p-4 sm:p-6 rounded-xl text-white">
            <Table2 className="w-6 h-6 sm:w-8 sm:h-8 mb-2 opacity-80" />
            <div className="text-xl sm:text-3xl font-bold">{stats.conMesa}</div>
            <div className="text-xs sm:text-sm opacity-80">
              Con Mesa Asignada
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-6 sm:mb-8">
          <button
            onClick={() => setActiveTab("stats")}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-light transition-colors ${
              activeTab === "stats"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Estadísticas
          </button>

          <button
            onClick={() => setActiveTab("guests")}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-light transition-colors ${
              activeTab === "guests"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Invitados
          </button>

          <button
            onClick={() => setActiveTab("tables")}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-light transition-colors ${
              activeTab === "tables"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Mesas
          </button>

          <button
            onClick={() => setActiveTab("todos")}
            className={`w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-light transition-colors flex items-center justify-center gap-2 ${
              activeTab === "todos"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <ListChecks className="w-4 h-4" />
            Checklist
            {todos.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === "todos" ? "bg-blue-500" : "bg-gray-600"
              }`}>
                {todos.filter((t) => !t.checked).length}
              </span>
            )}
          </button>
        </div>

        {/* CONTENT */}
        {activeTab === "stats" && (
          <AdminStats
            invitados={invitados}
            mesas={mesas}
            acompanantes={acompanantes}
          />
        )}

        {activeTab === "guests" && eventDocumentId && (
          <GuestManagement
            invitados={invitados}
            mesas={mesas}
            acompanantes={acompanantes}
            eventDocumentId={eventDocumentId}
            onRefresh={handleRefresh}
            whatsappMessage={event?.whatsapp_message}
          />
        )}

        {activeTab === "tables" && eventDocumentId && (
          <TableManagement
            invitados={invitados}
            mesas={mesas}
            acompanantes={acompanantes}
            eventDocumentId={eventDocumentId}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === "todos" && (
          <TodoManagement todos={todos} onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
}
