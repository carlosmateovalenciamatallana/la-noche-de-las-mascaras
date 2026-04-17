import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Welcome from './pages/welcome';
import RegisterMask from './pages/RegisterMask';
import Feed from './pages/Feed';
import RegisterReal from './pages/RegisterReal';
import WelcomeReal from './pages/WelcomeReal';

// Componente auxiliar para manejar la redirección automática
function SessionCheck({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasMask = localStorage.getItem('hasMask');
    const isReal = localStorage.getItem('isReal');

    // Si el usuario ya tiene máscara y está en la raíz o en el registro, mandarlo al Feed
    if (hasMask && (location.pathname === '/' || location.pathname === '/register-mask')) {
      if (isReal) {
        navigate('/feed'); // O podrías mandarlo a /welcome-real si prefieres
      } else {
        navigate('/feed');
      }
    }
  }, [navigate, location]);

  return children;
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark text-white font-sans selection:bg-gold selection:text-dark">
        <div className="max-w-md mx-auto min-h-screen border-x border-darker shadow-2xl bg-darker relative">
          {/* Envolvemos las rutas con nuestro comprobador de sesión */}
          <SessionCheck>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/register-mask" element={<RegisterMask />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/register-real" element={<RegisterReal />} />
              <Route path="/welcome-real" element={<WelcomeReal />} />
            </Routes>
          </SessionCheck>
        </div>
      </div>
    </Router>
  );
}

export default App;