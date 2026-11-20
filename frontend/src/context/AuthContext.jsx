import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore the customer session when the website loads.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch('/api/accounts/profile/', {
          credentials: 'include',
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Session restoration failed:', error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    const csrfResponse = await fetch('/api/accounts/csrf/', {
      credentials: 'include',
    });

    if (!csrfResponse.ok) {
      throw new Error('Unable to initialize CSRF protection.');
    }

    const csrfToken = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('csrftoken='))
      ?.split('=')[1];

    if (!csrfToken) {
      throw new Error('CSRF token was not found.');
    }

    const response = await fetch('/api/accounts/logout/', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-CSRFToken': decodeURIComponent(csrfToken),
      },
    });

    if (!response.ok) {
      throw new Error('Unable to log out.');
    }

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: null, // Temporary compatibility; remove after checkout migration.
        isAuthenticated: Boolean(user),
        authLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};