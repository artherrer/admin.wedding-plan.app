import {
  Users,
  LayoutGrid,
  BarChart3,
  MessageCircle,
  CheckCircle,
  Star,
  Heart,
  Shield,
  Smartphone,
  Mail,
  Phone,
  ChevronRight,
  ListChecks,
  Infinity,
} from 'lucide-react';

const WHATSAPP = '524421204333';
const EMAIL = 'arturo.aoh.26@gmail.com';

const features = [
  {
    icon: Users,
    title: 'Gestión de Invitados',
    desc: 'Administra tu lista completa con estados de confirmación: pendiente, confirmado o rechazado. Control total de pases por invitado.',
  },
  {
    icon: Heart,
    title: 'Acompañantes',
    desc: 'Cada invitado puede traer acompañantes registrados. Lleva el conteo exacto de asistentes para una planeación sin sorpresas.',
  },
  {
    icon: LayoutGrid,
    title: 'Distribución de Mesas',
    desc: 'Asigna invitados a mesas, designa capitanes de mesa y visualiza la distribución completa de tu salón al instante.',
  },
  {
    icon: BarChart3,
    title: 'Estadísticas en Tiempo Real',
    desc: 'Dashboard con confirmaciones, rechazos, pendientes y total de asistentes. Toma decisiones con datos actualizados.',
  },
  {
    icon: MessageCircle,
    title: 'Links de WhatsApp',
    desc: 'Genera enlaces de WhatsApp directamente para cada invitado. Comunícate rápido sin buscar números.',
  },
  {
    icon: ListChecks,
    title: 'Checklist de Tareas',
    desc: 'Lista organizada por secciones con prioridades, fechas límite y notas. Arrastra para reordenar. Todo bajo control.',
  },
  {
    icon: Shield,
    title: 'Multi-evento',
    desc: 'Administra varios eventos desde una sola cuenta. Ideal para organizadores y coordinadores de bodas.',
  },
  {
    icon: Smartphone,
    title: '100% Responsivo',
    desc: 'Funciona perfectamente en móvil, tablet y escritorio. Administra desde donde estés, el día del evento.',
  },
];

const steps = [
  { number: '01', title: 'Recibe tu acceso', desc: 'Configuramos tu cuenta y evento en menos de 24 horas.' },
  { number: '02', title: 'Carga tu lista', desc: 'Importa o agrega invitados uno a uno con sus datos.' },
  { number: '03', title: 'Comparte el link', desc: 'Cada invitado confirma asistencia desde su celular.' },
  { number: '04', title: 'Administra en vivo', desc: 'Ve confirmaciones en tiempo real y ajusta la distribución.' },
];

function Divider() {
  return (
    <div className="flex items-center justify-center gap-4 my-2">
      <div className="w-16 h-px bg-gold opacity-60" />
      <Heart size={14} className="text-gold opacity-80" fill="currentColor" />
      <div className="w-16 h-px bg-gold opacity-60" />
    </div>
  );
}

export default function LandingPage() {
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hola, me interesa Wedding Plan MX para mi boda.')}`;
  const mailLink = `mailto:${EMAIL}?subject=${encodeURIComponent('Información sobre Wedding Plan MX')}`;

  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-gold/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-serif text-xl text-charcoal tracking-widest">
            Wedding Plan <span className="text-gold">MX</span>
          </span>
          <div className="flex gap-3">
            <a
              href={mailLink}
              className="hidden sm:flex items-center gap-2 text-sm text-muted hover:text-charcoal transition-colors"
            >
              <Mail size={15} />
              Contacto
            </a>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gold text-white text-sm px-4 py-2 rounded-full hover:bg-gold-dark transition-colors"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-cream via-linen to-blush pt-20">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a96e' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative text-center px-6 max-w-4xl mx-auto">
          <p className="text-gold tracking-[0.4em] text-xs uppercase mb-6 font-light">
            Sistema de Administración
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl text-charcoal leading-tight mb-6">
            Tu boda, perfectamente
            <br />
            <span className="text-gold">organizada</span>
          </h1>
          <Divider />
          <p className="mt-6 text-muted text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Panel de administración elegante para gestionar invitados, mesas y confirmaciones.
            Todo lo que necesitas para el día más importante.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gold text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/20"
            >
              <MessageCircle size={18} />
              Solicitar Demo
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 border border-gold/40 text-charcoal px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:border-gold hover:bg-blush transition-all duration-300"
            >
              Ver características
              <ChevronRight size={16} />
            </a>
          </div>
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-muted">
            {[['500+', 'Invitados gestionados'], ['10+', 'Bodas administradas'], ['100%', 'En la nube']].map(
              ([val, label]) => (
                <div key={label} className="text-center">
                  <div className="font-serif text-3xl text-gold">{val}</div>
                  <div className="mt-1 text-xs tracking-widest uppercase">{label}</div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Proceso</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Empieza en 4 pasos</h2>
            <Divider />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="font-serif text-5xl text-gold/30 mb-3">{step.number}</div>
                <h3 className="font-serif text-xl text-charcoal mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed font-light">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 bg-linen/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Funcionalidades</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">
              Todo incluido, sin complicaciones
            </h2>
            <Divider />
            <p className="mt-4 text-muted max-w-xl mx-auto text-sm leading-relaxed font-light">
              Un sistema pensado para el ritmo real de una boda: rápido, claro y accesible desde cualquier dispositivo.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-6 border border-blush-dark/30 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/10 transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-full bg-blush flex items-center justify-center mb-4 group-hover:bg-gold/10 transition-colors">
                  <Icon size={20} className="text-gold" />
                </div>
                <h3 className="font-serif text-lg text-charcoal mb-2">{title}</h3>
                <p className="text-muted text-xs leading-relaxed font-light">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DETALLE VISUAL */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Panel de control</p>
              <h2 className="font-serif text-4xl text-charcoal mb-4 leading-snug">
                Claridad cuando más la necesitas
              </h2>
              <Divider />
              <p className="mt-4 text-muted leading-relaxed font-light text-sm">
                El día de tu boda no hay tiempo para confusión. Con Wedding Plan MX tienes en una
                pantalla todo lo que importa: quién confirmó, en qué mesa va, cuántos pases tiene.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Dashboard con métricas clave en tiempo real',
                  'Filtros por estado: confirmado, pendiente, no asiste',
                  'Búsqueda instantánea de invitados',
                  'Asignación de mesas con un clic',
                  'Capitán de mesa para coordinación en salón',
                  'Conteo automático de asistentes totales',
                  'Checklist de tareas con prioridades y fechas',
                  'Reordenamiento de tareas por arrastre',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-charcoal font-light">
                    <CheckCircle size={16} className="text-gold mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* Mock UI */}
            <div className="relative">
              <div className="bg-cream rounded-3xl p-6 border border-blush-dark/30 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-blush-dark" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gold/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-gold/20" />
                  <span className="ml-2 text-xs text-muted font-light">Wedding Plan MX — Dashboard</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Confirmados', val: '84', color: 'bg-green-50 border-green-200 text-green-700' },
                    { label: 'Pendientes', val: '23', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                    { label: 'No asisten', val: '8', color: 'bg-rose-50 border-rose-200 text-rose-700' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
                      <div className="text-2xl font-serif font-light">{val}</div>
                      <div className="text-xs mt-0.5 font-light">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'García Rodríguez', mesa: '3', status: 'yes' },
                    { name: 'López Martínez', mesa: '7', status: 'yes' },
                    { name: 'Ramírez Vega', mesa: '—', status: 'pending' },
                    { name: 'Torres Núñez', mesa: '2', status: 'yes' },
                  ].map(({ name, mesa, status }) => (
                    <div
                      key={name}
                      className="flex items-center justify-between bg-white rounded-xl px-4 py-2.5 border border-blush-dark/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-blush flex items-center justify-center text-xs text-gold font-serif">
                          {name[0]}
                        </div>
                        <span className="text-xs text-charcoal font-light">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">Mesa {mesa}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            status === 'yes' ? 'bg-green-400' : 'bg-amber-400'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-blush opacity-60 blur-2xl" />
              <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full bg-gold/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL / QUOTE */}
      <section className="py-20 bg-charcoal text-center">
        <div className="max-w-3xl mx-auto px-6">
          <Star size={20} className="text-gold mx-auto mb-6 opacity-60" fill="currentColor" />
          <blockquote className="font-serif text-2xl sm:text-3xl text-cream leading-relaxed italic">
            "El día de mi boda supe exactamente quién estaba sentado en cada mesa, quién faltó y quién llegó de sorpresa. Sin estrés."
          </blockquote>
          <p className="mt-6 text-muted text-sm tracking-widest uppercase font-light">— Novia feliz, CDMX 2024</p>
        </div>
      </section>

      {/* PRICING CTA */}
      <section className="py-24 bg-linen/40">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Inversión</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">
              Un solo pago. Todo incluido.
            </h2>
            <Divider />
            <p className="mt-4 text-muted max-w-xl mx-auto text-sm leading-relaxed font-light">
              Sin niveles, sin límites, sin mensualidades. Pagas una vez y tienes acceso
              completo a todas las funcionalidades para tu evento.
            </p>
          </div>

          <div className="bg-charcoal rounded-3xl p-8 sm:p-12 border border-gold/30 shadow-2xl text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Infinity size={32} className="text-gold" />
              <span className="font-serif text-3xl text-cream">Sin límites</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left max-w-lg mx-auto">
              {[
                'Invitados ilimitados',
                'Acompañantes ilimitados',
                'Mesas ilimitadas',
                'Tareas ilimitadas',
                'Estadísticas completas',
                'Links de WhatsApp',
                'Checklist por secciones',
                'Soporte incluido',
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-2 text-sm font-light">
                  <CheckCircle size={15} className="text-gold shrink-0" />
                  <span className="text-cream/80">{feat}</span>
                </div>
              ))}
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-gold text-white px-10 py-4 rounded-full text-sm tracking-widest uppercase hover:bg-gold-dark transition-all duration-300 shadow-lg shadow-gold/20"
            >
              <MessageCircle size={16} />
              Solicitar cotización
            </a>
            <p className="mt-4 text-muted text-xs font-light">
              Precio único por evento · Sin sorpresas
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Contacto</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-charcoal">Hablemos de tu boda</h2>
          <Divider />
          <p className="mt-4 text-muted text-sm leading-relaxed font-light max-w-lg mx-auto">
            Cuéntanos la fecha, cuántos invitados esperan y cualquier detalle especial.
            Te respondemos en menos de 24 horas.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] text-white px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:opacity-90 transition-opacity shadow-lg shadow-green-200"
            >
              <MessageCircle size={18} />
              WhatsApp: 442 120 4333
            </a>
            <a
              href={mailLink}
              className="inline-flex items-center justify-center gap-3 border border-gold/40 text-charcoal px-8 py-4 rounded-full text-sm tracking-widest uppercase hover:border-gold hover:bg-blush transition-all"
            >
              <Mail size={18} />
              Enviar correo
            </a>
          </div>
          <p className="mt-6 text-muted text-xs font-light">{EMAIL}</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-charcoal text-cream/50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <span className="font-serif text-xl text-cream tracking-widest">
                Wedding Plan <span className="text-gold">MX</span>
              </span>
              <p className="text-xs mt-1 font-light">Sistema de administración para bodas</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold transition-colors">
                <Phone size={13} />
                442 120 4333
              </a>
              <span className="hidden sm:block opacity-30">|</span>
              <a href={mailLink} className="flex items-center gap-2 hover:text-gold transition-colors">
                <Mail size={13} />
                {EMAIL}
              </a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-cream/10 text-center text-xs font-light">
            © {new Date().getFullYear()} Wedding Plan MX · Hecho con{' '}
            <Heart size={11} className="inline text-gold" fill="currentColor" /> en México
          </div>
        </div>
      </footer>
    </div>
  );
}
