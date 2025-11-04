import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  picture_url?: string;
}

interface Account {
  user: User;
  token: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  accounts: Account[];
  login: (userData: User, userToken: string) => void;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: (userIdToLogout?: number) => void;
  switchAccount: (userIdToSwitchTo: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getStoredAccounts = (): Account[] => {
  const stored = localStorage.getItem('authAccounts');
  return stored ? JSON.parse(stored) : [];
};

const getActiveIndex = (): number => {
  const index = localStorage.getItem('authActiveIndex');
  return index ? parseInt(index, 10) : -1;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accounts, setAccounts] = useState<Account[]>(getStoredAccounts);
  const [activeIndex, setActiveIndex] = useState<number>(getActiveIndex);

  const activeAccount = activeIndex >= 0 && accounts[activeIndex] ? accounts[activeIndex] : null;
  const user = activeAccount?.user || null;
  const token = activeAccount?.token || null;

  useEffect(() => {
    localStorage.setItem('authAccounts', JSON.stringify(accounts));
    localStorage.setItem('authActiveIndex', activeIndex.toString());
  }, [accounts, activeIndex]);

  const login = (userData: User, userToken: string) => {
    const existingAccountIndex = accounts.findIndex((acc: Account) => acc.user.id === userData.id);
    let newAccounts = [...accounts];
    let newIndex: number;

    if (existingAccountIndex !== -1) {
      newAccounts[existingAccountIndex] = { user: userData, token: userToken };
      newIndex = existingAccountIndex;
    } else {
      newAccounts.push({ user: userData, token: userToken });
      newIndex = newAccounts.length - 1;
    }
    setAccounts(newAccounts);
    setActiveIndex(newIndex);
  };

  const logout = (userIdToLogout: number | undefined = user?.id) => {
    const newAccounts = accounts.filter((acc: Account) => acc.user.id !== userIdToLogout);
    setAccounts(newAccounts);

    if (activeIndex !== -1 && accounts[activeIndex]?.user.id === userIdToLogout) {
      setActiveIndex(newAccounts.length > 0 ? 0 : -1);
    } else {
      const currentActiveUserId = accounts[activeIndex]?.user.id;
      const newActiveIndex = newAccounts.findIndex((acc: Account) => acc.user.id === currentActiveUserId);
      setActiveIndex(newActiveIndex);
    }
  };

  const switchAccount = (userIdToSwitchTo: number) => {
    const newIndex = accounts.findIndex((acc: Account) => acc.user.id === userIdToSwitchTo);
    if (newIndex !== -1) {
      setActiveIndex(newIndex);
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    const signupResponse = await fetch('http://localhost:3000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!signupResponse.ok) {
      const errorData = await signupResponse.json();
      throw new Error(errorData.error || 'Failed to sign up');
    }

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

  const authValue: AuthContextType = {
    token,
    user,
    accounts,
    login,
    signup,
    logout,
    switchAccount
  };

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};