import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize state from localStorage, if it exists
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('authUser')));

  // This effect runs when the component mounts to handle the initial state
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData, userToken) => {
    // 1. Save to localStorage
    localStorage.setItem('authToken', userToken);
    localStorage.setItem('authUser', JSON.stringify(userData));
    // 2. Update the state
    setToken(userToken);
    setUser(userData);
  };

  const logout = () => {
    // 1. Remove from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // 2. Clear the state
    setToken(null);
    setUser(null);
  };

  const signup = async (username, email, password) => { /* ... existing signup logic ... */ };

  const authValue = { token, user, login, signup, logout };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};