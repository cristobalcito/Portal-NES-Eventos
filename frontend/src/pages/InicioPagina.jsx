import React from 'react';

export default function InicioPagina({ alIrALogin, alIrARegistro }) {
  const servicios = [
    {
      titulo: 'Producción de Eventos',
      descripcion: 'Planificación, montaje y coordinación completa para eventos corporativos, institucionales y celebraciones de cualquier escala.'
    },
    {
      titulo: 'Equipamiento Técnico y Audiovisual',
      descripcion: 'Sistemas de sonido profesional, iluminación escénica, estructuras escenográficas y componentes de alto calibre para hacer de cada evento una experiencia memorable.'
    },
    {
      titulo: 'Logística y Flota Especializada',
      descripcion: 'Traslado puntual de equipamiento, montaje previo y desmontaje coordinado con control estricto de tiempos operativos.'
    },
    {
      titulo: 'Agenda y Disponibilidad en Línea',
      descripcion: 'Consulta directa de fechas disponibles, seguimiento de etapas y coordinación transparente con nuestro equipo. Portal disponible a toda hora.'
    }
  ];

  const indicadores = [
    { cifra: '100% humano', etiqueta: 'Coordinación directa con los organizadores' },
    { cifra: '24/7', etiqueta: 'Servicio de consultas en línea' },
    { cifra: 'Toda ocasión', etiqueta: 'Eventos de todos los tamaños y colores' }
  ];

  return (
    <div style={styles.pagina}>
      <header style={styles.navbar}>
        <div style={styles.navContenedor}>
          <div style={styles.marca}>
            <img src="NES.png" alt="NES Eventos" style={styles.logoNav} />
            <div>
              <span style={styles.nombreMarca}>NES Eventos</span>
              <span style={styles.subMarca}>Producción y Logística</span>
            </div>
          </div>

          <nav style={styles.navEnlaces}>
            <a href="#servicios" style={styles.enlaceNav}>Servicios</a>
            <a href="#nosotros" style={styles.enlaceNav}>Nosotros</a>
            <a href="#contacto" style={styles.enlaceNav}>Contacto</a>
          </nav>

          <div style={styles.accionesNav}>
            {alIrARegistro && (
              <button type="button" onClick={alIrARegistro} style={styles.btnSecundarioNav}>
                Crear Cuenta
              </button>
            )}
            <button type="button" onClick={alIrALogin} style={styles.btnPrimarioNav}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      <section style={styles.hero}>
        <div style={styles.heroContenedor}>
          <div style={styles.heroTexto}>
            <span style={styles.etiquetaHero}>Portal Corporativo y Clientes</span>
            <h1 style={styles.tituloHero}>
              Organizamos y ejecutamos eventos con precisión operativa
            </h1>
            <p style={styles.descripcionHero}>
              En NES Eventos integramos producción, equipamiento técnico, flota propia y personal especializado para garantizar jornadas impecables de principio a fin.
            </p>
            <div style={styles.heroBotones}>
              <button type="button" onClick={alIrALogin} style={styles.btnHeroPrimario}>
                Ingresar al Portal
              </button>
              {alIrARegistro && (
                <button type="button" onClick={alIrARegistro} style={styles.btnHeroSecundario}>
                  Registrarme como Cliente
                </button>
              )}
            </div>
          </div>

          <div style={styles.heroTarjeta}>
            <div style={styles.tarjetaEncabezado}>
              <span style={styles.puntoEstado} />
              <span style={styles.tarjetaTitulo}>Portal en línea de NES Eventos</span>
            </div>
            <p style={styles.tarjetaCuerpo}>
              Accede con tu cuenta de cliente para revisar disponibilidad de fechas en el horario compartido y consultar precios.
            </p>
            <div style={styles.gridIndicadores}>
              {indicadores.map((item) => (
                <div key={item.etiqueta} style={styles.cajaIndicador}>
                  <strong style={styles.cifraIndicador}>{item.cifra}</strong>
                  <span style={styles.textoIndicador}>{item.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="servicios" style={styles.seccionServicios}>
        <div style={styles.contenedorSeccion}>
          <div style={styles.encabezadoSeccion}>
            <img src="NES-LOGO-NEW-SMALLER.png" alt="NES Eventos" style={{ height: '420px', marginBottom: '8px' }} />
            <h2 style={styles.tituloSeccion}>Soluciones personalizadas</h2>
          </div>

          <div style={styles.gridServicios}>
            {servicios.map((servicio, indice) => (
              <div key={servicio.titulo} style={styles.cardServicio}>
                <div style={styles.numeroServicio}>0{indice + 1}</div>
                <h3 style={styles.tituloServicio}>{servicio.titulo}</h3>
                <p style={styles.descServicio}>{servicio.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nosotros" style={styles.seccionNosotros}>
        <div style={styles.contenedorNosotros}>
          <div style={styles.nosotrosTexto}>
            <span style={styles.subtituloSeccion}>Sobre la Empresa</span>
            <h2 style={styles.tituloSeccion}>Nuestra misión</h2>
            <p style={styles.parrafoNosotros}>
              Entregar soluciones confiables en producción y logística de eventos, ofreciendo planificación previa de tiempos de traslado, montaje y desmontaje y asegurando el uso óptimo de recursos y equipos.
            </p>
            <h2 style={styles.tituloSeccion}>Nuestra visión</h2>
            <p style={styles.parrafoNosotros}>
              Ser un referente en la industria de eventos, destacando por nuestra capacidad de adaptación, innovación y compromiso con la excelencia operativa y brindando una experiencia excepcional a nuestros clientes.
            </p>
            <h3 style={styles.tituloSeccion}>Portal en línea</h3>
            <p style={styles.parrafoNosotros}>
              A través de nuestro portal digital, tanto clientes como equipos operativos comparten una visión clara de la agenda y el estado de cada servicio.
            </p>
          </div>

          <div style={styles.nosotrosPanel}>
            <h3 style={styles.panelTitulo}>Acceso al Sistema</h3>
            <p style={styles.panelTexto}>
              Si ya tienes credenciales asignadas o deseas crear una cuenta de cliente para consultar fechas disponibles, ingresa directamente desde aquí.
            </p>
            <button type="button" onClick={alIrALogin} style={styles.btnPanel}>
              Inicia sesión o regístrate
            </button>
          </div>
        </div>
      </section>

      <footer id="contacto" style={styles.footer}>
        <div style={styles.footerContenedor}>
          <div>
            <strong style={styles.footerMarca}>NES Eventos</strong>
            <p style={styles.footerTexto}>Producción, equipamiento y logística de eventos.</p>
          </div>
          <div style={styles.footerContacto}>
            <span>Contacto: contacto@nes-eventos.cl</span>
            <span>Portal de Gestión y Horario Compartido</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  pagina: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    color: '#1e293b',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
  },
  navContenedor: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0.9rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  marca: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoNav: {
    height: '44px',
    width: 'auto',
    objectFit: 'contain',
  },
  nombreMarca: {
    display: 'block',
    fontSize: '1.15rem',
    fontWeight: '700',
    color: '#523354',
    lineHeight: 1.1,
  },
  subMarca: {
    display: 'block',
    fontSize: '0.75rem',
    color: '#64748b',
  },
  navEnlaces: {
    display: 'flex',
    gap: '1.75rem',
    alignItems: 'center',
  },
  enlaceNav: {
    textDecoration: 'none',
    color: '#475569',
    fontSize: '0.92rem',
    fontWeight: '500',
  },
  accionesNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  btnSecundarioNav: {
    backgroundColor: '#faf5ff',
    color: '#523354',
    border: '1px solid #d8b4fe',
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnPrimarioNav: {
    backgroundColor: '#523354',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(82, 51, 84, 0.25)',
  },
  hero: {
    background: 'linear-gradient(135deg, #523354 0%, #734b75 100%)',
    color: '#ffffff',
    padding: '4.5rem 2rem',
  },
  heroContenedor: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '2.5rem',
    alignItems: 'center',
  },
  heroTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  etiquetaHero: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    color: '#f3e8ff',
    padding: '0.35rem 0.9rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: '600',
    letterSpacing: '0.02em',
  },
  tituloHero: {
    margin: 0,
    fontSize: '2.45rem',
    lineHeight: 1.18,
    fontWeight: '800',
  },
  descripcionHero: {
    margin: 0,
    fontSize: '1.05rem',
    lineHeight: 1.6,
    color: '#f1f5f9',
    opacity: 0.95,
  },
  heroBotones: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '0.5rem',
  },
  btnHeroPrimario: {
    backgroundColor: '#ffffff',
    color: '#523354',
    border: 'none',
    padding: '0.85rem 1.6rem',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  btnHeroSecundario: {
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: '1.5px solid rgba(255, 255, 255, 0.7)',
    padding: '0.85rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  heroTarjeta: {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 20px 35px rgba(15, 23, 42, 0.22)',
  },
  tarjetaEncabezado: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '0.75rem',
  },
  puntoEstado: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
  tarjetaTitulo: {
    fontWeight: '700',
    color: '#523354',
    fontSize: '1.05rem',
  },
  tarjetaCuerpo: {
    margin: '0 0 1.5rem 0',
    fontSize: '0.92rem',
    lineHeight: 1.55,
    color: '#475569',
  },
  gridIndicadores: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  cajaIndicador: {
    backgroundColor: '#faf5ff',
    border: '1px solid #e9d5ff',
    borderRadius: '10px',
    padding: '0.85rem 0.6rem',
    textAlign: 'center',
  },
  cifraIndicador: {
    display: 'block',
    color: '#523354',
    fontSize: '1.1rem',
    marginBottom: '4px',
  },
  textoIndicador: {
    fontSize: '0.75rem',
    color: '#64748b',
    lineHeight: 1.3,
    display: 'block',
  },
  seccionServicios: {
    padding: '4rem 2rem',
    backgroundColor: '#f8fafc',
  },
  contenedorSeccion: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  encabezadoSeccion: {
    textAlign: 'center',
    marginBottom: '2.75rem',
  },
  subtituloSeccion: {
    display: 'inline-block',
    color: '#734b75',
    fontWeight: '700',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '0.4rem',
  },
  tituloSeccion: {
    margin: 0,
    color: '#1e293b',
    fontSize: '1.85rem',
    fontWeight: '700',
  },
  gridServicios: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },
  cardServicio: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    padding: '1.75rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
  },
  numeroServicio: {
    display: 'inline-block',
    backgroundColor: '#f3e8ff',
    color: '#523354',
    fontWeight: '800',
    fontSize: '0.85rem',
    padding: '0.35rem 0.7rem',
    borderRadius: '8px',
    marginBottom: '1rem',
  },
  tituloServicio: {
    margin: '0 0 0.6rem 0',
    fontSize: '1.1rem',
    color: '#523354',
    fontWeight: '700',
  },
  descServicio: {
    margin: 0,
    fontSize: '0.9rem',
    lineHeight: 1.55,
    color: '#475569',
  },
  seccionNosotros: {
    padding: '4rem 2rem',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  contenedorNosotros: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2.5rem',
    alignItems: 'center',
  },
  nosotrosTexto: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.9rem',
  },
  parrafoNosotros: {
    margin: 0,
    fontSize: '0.96rem',
    lineHeight: 1.65,
    color: '#475569',
  },
  nosotrosPanel: {
    backgroundColor: '#faf5ff',
    border: '1px solid #e9d5ff',
    borderRadius: '16px',
    padding: '2rem',
  },
  panelTitulo: {
    margin: '0 0 0.6rem 0',
    color: '#523354',
    fontSize: '1.25rem',
  },
  panelTexto: {
    margin: '0 0 1.4rem 0',
    color: '#475569',
    fontSize: '0.92rem',
    lineHeight: 1.55,
  },
  btnPanel: {
    backgroundColor: '#523354',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.4rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  footer: {
    marginTop: 'auto',
    backgroundColor: '#3b233d',
    color: '#e2e8f0',
    padding: '2rem',
  },
  footerContenedor: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  footerMarca: {
    color: '#ffffff',
    fontSize: '1.05rem',
  },
  footerTexto: {
    margin: '4px 0 0 0',
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  footerContacto: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    textAlign: 'right',
  },
};