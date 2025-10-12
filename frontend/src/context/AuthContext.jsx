import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const login = (userData, userToken) => {
    setToken(userToken);
    setUser(userData);
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

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const authValue = { token, user, login, signup, logout };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};