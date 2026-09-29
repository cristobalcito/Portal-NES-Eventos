import React, { useEffect, useState } from 'react';
import Login from './Login';
import CatalogoPagina from './pages/CatalogoPagina.jsx';
import GestionarEventos from './pages/GestionarEventos.jsx';
import InventarioPage from './pages/InventarioPage.jsx';
import PersonalPagina from './pages/PersonalPagina.jsx';
import Sidebar from './components/SidebarComponente.jsx';

function App() {
    const [usuario, setUsuario] = useState(null);
    const [seccionActual, setSeccionActual] = useState('/catalogo');

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
    };

    if (!usuario) {
        return <Login onLoginSuccess={(user) => setUsuario(user)} />;
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
            case '/home':
                return (
                    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
                        <h1>Portal NES Eventos</h1>
                        <p>Hola, <strong>{usuario.nombre}</strong></p>
                        <p>RUT: {usuario.rut}</p>
                        <p>Email: {usuario.email}</p>
                        <button onClick={handleLogout}>Cerrar Sesión</button>
                    </div>
                );
            default:
                return <CatalogoPagina {...propsDeNavegacion} />;
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#e2e8f0' }}>
            <Sidebar {...propsDeNavegacion} />
            <main style={{ flex: 1 }}>
                {renderVistaCentral()}
            </main>
        </div>
    );
}

export default App;