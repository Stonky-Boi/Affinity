import { createContext, useContext, useState, useEffect } from 'react';
import { Theme, ThemeContextType, ProviderProps } from '../types/index';

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: ProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem('theme') as Theme) || 'light'
    );

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === null) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};