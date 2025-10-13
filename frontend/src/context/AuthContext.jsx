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

  const signup = async (username, email, password) => {
    // This function will first register the user, then log them in
    const signupResponse = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      throw new Error(errorData.error || 'Failed to sign up');
    }
    
    // After successful signup, log the user in to get a token
    const loginResponse = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(loginData.error || 'Failed to login after signup');
    }
    
    login(loginData.user, loginData.token);
  };

  const authValue = { token, user, login, signup, logout };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
