import { useState, useEffect } from 'react';
import { LoginPage, RegisterPage } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Button } from 'antd';

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
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        已有账号? <Button type="link" onClick={() => setShowRegister(false)}>登录</Button>
      </div>
    </>
  ) : (
    <>
      <LoginPage onLogin={handleLogin} />
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        没有账号? <Button type="link" onClick={() => setShowRegister(true)}>注册</Button>
      </div>
    </>
  );
}

export default App;