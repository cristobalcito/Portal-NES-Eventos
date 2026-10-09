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
    const [seccionActual, setSeccionActual] = useState('/home'); // Iniciar por defecto en /home

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
    };

    const renderVistaCentral = () => {
        switch (seccionActual) {
            case '/eventos':
                return <GestionarEventos {...propsDeNavegacion} />;
            case '/personal':
                return <PersonalPagina {...propsDeNavegacion} />;
            case '/inventario':
                return <InventarioPage {...propsDeNavegacion} />;
            case '/usuarios':
                if (usuario?.rol !== 'GERENTE_GENERAL') {
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
                        <p>Hola, <strong>{usuario.nombre}</strong></p>
                        <p>RUT: {usuario.rut || 'No especificado'}</p>
                        <p>Email: {usuario.email || 'No especificado'}</p>
                        <p>Rol: {usuario.rol || 'No asignado'}</p>
                        <button onClick={handleLogout}>Cerrar Sesión</button>
                    </div>
                );
            default:
                return <CatalogoPagina {...propsDeNavegacion} />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e2e8f0' }}>
            <Sidebar {...propsDeNavegacion} usuario={usuario} />
            <main style={{ flex: 1 }}>
                {renderVistaCentral()}
            </main>
        </div>
    );
}

export default App;