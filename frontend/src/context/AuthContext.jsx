import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

// Helper function to get accounts from localStorage
const getStoredAccounts = () => {
  const stored = localStorage.getItem('authAccounts');
  return stored ? JSON.parse(stored) : []; // Returns an array of { user, token }
};

// Helper function to get the active account index
const getActiveIndex = () => {
  const index = localStorage.getItem('authActiveIndex');
  return index ? parseInt(index, 10) : -1; // -1 means no active account
};

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(getStoredAccounts);
  const [activeIndex, setActiveIndex] = useState(getActiveIndex);

  // Derive current user/token from the active index
  const activeAccount = activeIndex >= 0 && accounts[activeIndex] ? accounts[activeIndex] : null;
  const user = activeAccount?.user || null;
  const token = activeAccount?.token || null;

  // Update localStorage whenever accounts or activeIndex change
  useEffect(() => {
    localStorage.setItem('authAccounts', JSON.stringify(accounts));
    localStorage.setItem('authActiveIndex', activeIndex.toString());
  }, [accounts, activeIndex]);

  const login = (userData, userToken) => {
    // Check if user is already logged in
    const existingAccountIndex = accounts.findIndex(acc => acc.user.id === userData.id);
    let newAccounts = [...accounts];
    let newIndex;

    if (existingAccountIndex !== -1) {
      // If user exists, update their token and make them active
      newAccounts[existingAccountIndex] = { user: userData, token: userToken };
      newIndex = existingAccountIndex;
    } else {
      // If new user, add them to the list and make them active
      newAccounts.push({ user: userData, token: userToken });
      newIndex = newAccounts.length - 1;
    }
    setAccounts(newAccounts);
    setActiveIndex(newIndex);
  };

  const logout = (userIdToLogout = user?.id) => {
    // Remove the specified account (or current active if none specified)
    const newAccounts = accounts.filter(acc => acc.user.id !== userIdToLogout);
    setAccounts(newAccounts);

    // If the logged-out account was active, set no active account (-1)
    // or switch to the first remaining account if desired.
    if (activeIndex !== -1 && accounts[activeIndex]?.user.id === userIdToLogout) {
      setActiveIndex(newAccounts.length > 0 ? 0 : -1); // Switch to first or none
    } else {
      // Adjust activeIndex if an account *before* the active one was removed
      const currentActiveUserId = accounts[activeIndex]?.user.id;
      const newActiveIndex = newAccounts.findIndex(acc => acc.user.id === currentActiveUserId);
      setActiveIndex(newActiveIndex); // Might be -1 if active user was the one logged out
    }
  };

  const switchAccount = (userIdToSwitchTo) => {
    const newIndex = accounts.findIndex(acc => acc.user.id === userIdToSwitchTo);
    if (newIndex !== -1) {
      setActiveIndex(newIndex); // *** This state update is the key ***
    }
  };

  // Signup logic remains the same (it calls login after successful signup)
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
  
  const authValue = {
    token, // Derived from activeIndex
    user,  // Derived from activeIndex
    accounts,
    login,
    signup,
    logout,
    switchAccount
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};