import React, { useEffect, useState } from 'react';
import Login from './Login';
import CatalogoPagina from './pages/CatalogoPagina.jsx';
import GestionarEventos from './pages/GestionarEventos.jsx';
import InventarioPage from './pages/InventarioPage.jsx';
import PersonalPagina from './pages/PersonalPagina.jsx';
import GestionUsuarios from './pages/GestionarUsuarioPage.jsx';
import Horario from './components/Horario.jsx';
import Sidebar from './components/SidebarComponente.jsx';
import EstadoEquiposPagina from './pages/EstadoEquiposPagina.jsx';
import MantencionesPagina from './pages/MantencionesPagina.jsx';
import EquiposArrendadosPagina from './pages/EquiposArrendadosPagina.jsx';

function App() {
    const [usuario, setUsuario] = useState(null);
    const [seccionActual, setSeccionActual] = useState('/home');

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
        setUsuario(null);
        setSeccionActual('/home');
    };

    // Función para actualizar el usuario resguardando el ROL y RUT
    const handleUpdateUsuario = (nuevoUsuario) => {
        setUsuario((prevUsuario) => {
            if (!prevUsuario) return nuevoUsuario;

            const rolMantenido =
                nuevoUsuario.rol ||
                nuevoUsuario.Rol ||
                nuevoUsuario.ROL ||
                prevUsuario.rol ||
                prevUsuario.Rol ||
                'GERENTE_GENERAL';

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
        return (
            <Login 
                onLoginSuccess={(user) => {
                    setUsuario(user);
                    setSeccionActual('/home');
                }} 
            />
        );
    }

    const propsDeNavegacion = {
        rutaActiva: seccionActual,
        alSeleccionar: setSeccionActual,
        onUpdateUsuario: handleUpdateUsuario,
    };

    // Determinar ROL y RUT con resguardos de nombres de propiedad
    const rolDetectado = 
        usuario.rol || 
        usuario.Rol || 
        usuario.ROL || 
        'GERENTE_GENERAL';

    const rutDetectado = 
        usuario.rut || 
        usuario.Rut || 
        usuario.RUT || 
        usuario.rutPersona || 
        usuario.run || 
        usuario.Run || 
        'No especificado';

    const renderVistaCentral = () => {
        switch (seccionActual) {
            case '/eventos':
                return <GestionarEventos {...propsDeNavegacion} />;
            case '/horario':
            case '/horario-compartido':
                return (
                    <div style={{ padding: '2rem' }}>
                        <Horario {...propsDeNavegacion} />
                    </div>
                );
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
                        {/* Tarjeta de bienvenida de usuario */}
                        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem 2rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ color: '#523354', margin: '0 0 0.5rem 0', fontSize: '1.8rem' }}>Portal NES Eventos</h1>
                                <p style={{ margin: '0 0 6px 0', color: '#334155', fontSize: '1.05rem' }}>
                                    Hola, <strong>{usuario.nombre || usuario.Nombre || 'Usuario'}</strong>
                                </p>
                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                                    <span><strong>RUT:</strong> {rutDetectado}</span>
                                    <span><strong>Email:</strong> {usuario.email || 'No especificado'}</span>
                                    <span><strong>Rol:</strong> {rolDetectado}</span>
                                </div>
                            </div>
                            <button 
                                onClick={handleLogout}
                                style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Cerrar Sesión
                            </button>
                        </div>

                        {/* Componente Horario incrustado */}
                        <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                            <Horario />
                        </div>
                    </div>
                );
            case '/estado-equipos':
                return <EstadoEquiposPagina {...propsDeNavegacion} />;
            case '/mantenciones':
                return <MantencionesPagina {...propsDeNavegacion} />;
            case '/arrendados':
                return <EquiposArrendadosPagina {...propsDeNavegacion} />;
            default:
                return <CatalogoPagina {...propsDeNavegacion} />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e2e8f0' }}>
            <Sidebar {...propsDeNavegacion} usuario={{ ...usuario, rol: rolDetectado, rut: rutDetectado }} />
            <main style={{ flex: 1 }}>
                {renderVistaCentral()}
            </main>
        </div>
    );
}

export default App;