import React, { useEffect, useState } from 'react';
import Login from './Login';
import InicioPagina from './pages/InicioPagina.jsx';
import CatalogoPagina from './pages/CatalogoPagina.jsx';
import GestionarEventos from './pages/GestionarEventos.jsx';
import InventarioPage from './pages/InventarioPage.jsx';
import PersonalPagina from './pages/PersonalPagina.jsx';
import GestionUsuarios from './pages/GestionarUsuarioPage.jsx';
import HorarioCompartidoPagina from './pages/HorarioCompartidoPagina.jsx';
import Sidebar from './components/SidebarComponente.jsx';
import EstadoEquiposPagina from './pages/EstadoEquiposPagina.jsx';
import MantencionesPagina from './pages/MantencionesPagina.jsx';
import EquiposArrendadosPagina from './pages/EquiposArrendadosPagina.jsx';
import CampanaAlertas from './components/CampanaAlertas.jsx';

const normalizarRolUsuario = (datosUsuario, rolRespaldo = '') => {
    const extraerDeObjeto = (obj) => {
        if (!obj || typeof obj !== 'object') return '';
        const rolTexto = (
            obj.rol ||
            obj.Rol ||
            obj.ROL ||
            obj.tipo ||
            ''
        ).toString().toUpperCase().trim();

        if (rolTexto) return rolTexto;
        if (obj.gerenteGeneral) return 'GERENTE_GENERAL';
        if (obj.personalOperaciones) return 'PERSONAL_OPERACIONES';
        if (obj.personalEventual) return 'PERSONAL_EVENTUAL';
        if (obj.cliente) return 'CLIENTE';
        return '';
    };

    const desdeUsuario = extraerDeObjeto(datosUsuario);
    if (desdeUsuario) return desdeUsuario;

    const rolGuardado = (localStorage.getItem('rol') || '').toUpperCase().trim();
    if (rolGuardado) return rolGuardado;

    try {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const desdeToken = extraerDeObjeto(payload);
            if (desdeToken) return desdeToken;
        }
    } catch {
        return rolRespaldo || 'GERENTE_GENERAL';
    }

    return rolRespaldo || 'GERENTE_GENERAL';
};

function App() {
    const [usuario, setUsuario] = useState(null);
    const [seccionActual, setSeccionActual] = useState('/home');
    const [vistaPublica, setVistaPublica] = useState('inicio');

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');

        if (usuarioGuardado && token) {
            try {
                setUsuario(JSON.parse(usuarioGuardado));
            } catch (e) {
                localStorage.removeItem('usuario');
                localStorage.removeItem('token');
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('rol');
        setUsuario(null);
        setSeccionActual('/home');
        setVistaPublica('inicio');
    };

    const handleUpdateUsuario = (nuevoUsuario) => {
        setUsuario((prevUsuario) => {
            if (!prevUsuario) return nuevoUsuario;

            const rolPrevio = normalizarRolUsuario(prevUsuario);
            const rolMantenido = normalizarRolUsuario(nuevoUsuario, rolPrevio);

            const rutMantenido =
                nuevoUsuario.rut ||
                nuevoUsuario.Rut ||
                nuevoUsuario.RUT ||
                nuevoUsuario.rutPersona ||
                prevUsuario.rut ||
                prevUsuario.Rut ||
                'No especificado';

            const usuarioActualizado = {
                ...prevUsuario,
                ...nuevoUsuario,
                rol: rolMantenido,
                rut: rutMantenido,
            };

            localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
            return usuarioActualizado;
        });
    };

    if (!usuario) {
        if (vistaPublica === 'inicio') {
            return (
                <InicioPagina
                    alIrALogin={() => setVistaPublica('login')}
                    alIrARegistro={() => setVistaPublica('registro')}
                />
            );
        }

        return (
            <Login
                modoInicial={vistaPublica}
                alVolverInicio={() => setVistaPublica('inicio')}
                onLoginSuccess={(user) => {
                    setUsuario(user);
                    setSeccionActual('/home');
                }}
            />
        );
    }

    const rolDetectado = normalizarRolUsuario(usuario);
    const esCliente = rolDetectado === 'CLIENTE';

    const rutDetectado = 
        usuario.rut || 
        usuario.Rut || 
        usuario.RUT || 
        usuario.rutPersona || 
        usuario.run || 
        usuario.Run || 
        'No especificado';

    const usuarioNormalizado = {
        ...usuario,
        rol: rolDetectado,
        rut: rutDetectado,
    };

    const propsDeNavegacion = {
        rutaActiva: seccionActual,
        alSeleccionar: setSeccionActual,
        onUpdateUsuario: handleUpdateUsuario,
        usuario: usuarioNormalizado,
        rol: rolDetectado,
        soloLectura: esCliente,
    };

    const rutasPermitidasCliente = ['/home', '/horario', '/horario-compartido', '/catalogo'];
    const rutaEfectiva = esCliente && !rutasPermitidasCliente.includes(seccionActual)
        ? '/home'
        : seccionActual;

    const renderVistaCentral = () => {
        switch (rutaEfectiva) {
            case '/eventos':
                return <GestionarEventos {...propsDeNavegacion} />;
            case '/horario':
            case '/horario-compartido':
                return <HorarioCompartidoPagina {...propsDeNavegacion} />;
            case '/personal':
                return <PersonalPagina {...propsDeNavegacion} />;
            case '/inventario':
                return <InventarioPage {...propsDeNavegacion} />;
            case '/usuarios':
                if (rolDetectado !== 'GERENTE_GENERAL') {
                    return (
                        <div style={{ padding: '2rem', color: '#721c24', backgroundColor: '#f8d7da', margin: '2rem', borderRadius: '8px' }}>
                            <h2>Acceso Denegado</h2>
                            <p>Esta sección está reservada exclusivamente para el Gerente General.</p>
                        </div>
                    );
                }
                return <GestionUsuarios {...propsDeNavegacion} />;
            case '/home':
                return (
                    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)', border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.4rem' }}>
                                    <h1 style={{ color: '#523354', margin: 0, fontSize: '1.75rem' }}>Portal NES Eventos</h1>
                                    <span style={{ backgroundColor: '#f3e8ff', color: '#523354', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }}>
                                        {rolDetectado}
                                    </span>
                                </div>
                                <p style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '1.05rem' }}>
                                    Bienvenido, <strong>{usuario.nombre || usuario.Nombre || 'Usuario'}</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap' }}>
                                    <span><strong>RUT:</strong> {rutDetectado}</span>
                                    <span><strong>Email:</strong> {usuario.email || 'No especificado'}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleLogout}
                                style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.2)' }}
                            >
                                Cerrar Sesión
                            </button>
                        </div>

                        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)', border: '1px solid #e2e8f0' }}>
                            <HorarioCompartidoPagina {...propsDeNavegacion} />
                        </div>
                    </div>
                );
            case '/estado-equipos':
                return <EstadoEquiposPagina {...propsDeNavegacion} />;
            case '/mantenciones':
                return <MantencionesPagina {...propsDeNavegacion} />;
            case '/arrendados':
                return <EquiposArrendadosPagina {...propsDeNavegacion} />;
            case '/catalogo':
            default:
                return <CatalogoPagina {...propsDeNavegacion} />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
            <Sidebar {...propsDeNavegacion} usuario={usuarioNormalizado} />
            <main style={{ flex: 1, minWidth: 0 }}>
                {['GERENTE_GENERAL', 'PERSONAL_OPERACIONES'].includes(rolDetectado) && (
                    <CampanaAlertas />
                )}

                {renderVistaCentral()}
            </main>
        </div>
    );
}

export default App;