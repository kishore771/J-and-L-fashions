
import { createContext, useState } from 'react';
import { adminLogin, adminLogout } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [username, setUsername] = useState(
    localStorage.getItem('adminUsername') || ''
  );

  const isAuthenticated = Boolean(token);

  const login = async (username, password) => {
    const newToken = await adminLogin(username, password);

    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUsername', username);

    setToken(newToken);
    setUsername(username);
  };

  const logout = async () => {
    try {
      await adminLogout(token);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUsername');

      setToken(null);
      setUsername('');
    }
  };

  return (
    <AuthContext.Provider
      value={{ token, username, setToken, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
