import React, { useEffect, useState } from 'react';
import Login from './Login';
import CatalogoPagina from './pages/CatalogoPagina.jsx';
import GestionarEventos from './pages/GestionarEventos.jsx';
import InventarioPage from './pages/InventarioPage.jsx';
import PersonalPagina from './pages/PersonalPagina.jsx';
import GestionUsuarios from './pages/GestionarUsuarioPage.jsx';
import Sidebar from './components/SidebarComponente.jsx';

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

    // Función para actualizar el usuario resguardando el ROL y RUT sin depender exclusivamente del correo antiguo
    const handleUpdateUsuario = (nuevoUsuario) => {
        setUsuario((prevUsuario) => {
            if (!prevUsuario) return nuevoUsuario;

            // 1. Mantener el ROL previo si la actualización no devuelve uno explícito
            const rolMantenido =
                nuevoUsuario.rol ||
                nuevoUsuario.Rol ||
                nuevoUsuario.ROL ||
                prevUsuario.rol ||
                prevUsuario.Rol ||
                'GERENTE_GENERAL'; // Rol por defecto/resguardo

            // 2. Mantener el RUT previo si la respuesta no lo incluye
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

            // Guardar inmediatamente en localStorage
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

    // Determinar ROL priorizando las propiedades explícitas antes de cualquier fallback
    const rolDetectado = 
        usuario.rol || 
        usuario.Rol || 
        usuario.ROL || 
        'GERENTE_GENERAL';

    // Determinar RUT revisando variantes
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
                    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
                        <h1>Portal NES Eventos</h1>
                        <p>Hola, <strong>{usuario.nombre || usuario.Nombre || 'Usuario'}</strong></p>
                        <p>RUT: {rutDetectado}</p>
                        <p>Email: {usuario.email || 'No especificado'}</p>
                        <p>Rol: {rolDetectado}</p>
                        <button onClick={handleLogout}>Cerrar Sesión</button>
                    </div>
                );
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