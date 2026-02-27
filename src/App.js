import { useState, useEffect } from 'react';
import { LoginPage, RegisterPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return showRegister ? (
    <>
      <RegisterPage onRegister={handleRegister} />
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        已有账号?{' '}
        <button
          onClick={() => setShowRegister(false)}
          style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer' }}
        >
          登录
        </button>
      </div>
    </>
  ) : (
    <>
      <LoginPage onLogin={handleLogin} />
      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        没有账号?{' '}
        <button
          onClick={() => setShowRegister(true)}
          style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer' }}
        >
          注册
        </button>
      </div>
    </>
  );
}

export default App;
