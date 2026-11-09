import React, { useEffect, useState } from 'react';
import Login from './Login';
import CatalogoPagina from './pages/CatalogoPagina.jsx';
import GestionarEventos from './pages/GestionarEventos.jsx';
import InventarioPage from './pages/InventarioPage.jsx';
import PersonalPagina from './pages/PersonalPagina.jsx';
import HomePage from './pages/HomePage.jsx';
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

    const handleLoginSuccess = (datosUsuario) => {
        setUsuario(datosUsuario);
        localStorage.setItem('usuario', JSON.stringify(datosUsuario));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
    };

    if (!usuario) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
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
                    <HomePage 
                        usuario={usuario} 
                        handleLogout={handleLogout} 
                        {...propsDeNavegacion} 
                    />
                );
            default:
                return (
                    <HomePage 
                        usuario={usuario} 
                        handleLogout={handleLogout} 
                        {...propsDeNavegacion} 
                    />
                );
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