'use client';

import {createContext, ReactNode, useContext, useEffect, useMemo, useState} from 'react';

type Theme = 'light' | 'dark';

interface DarkModeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);
const isTheme = (value: string | null): value is Theme => value === 'light' || value === 'dark';

const getStoredTheme = (): Theme => {
    try {
        const savedTheme = localStorage.getItem('theme');
        return isTheme(savedTheme) ? savedTheme : 'light';
    } catch {
        return 'light';
    }
};

const storeTheme = (theme: Theme) => {
    try {
        localStorage.setItem('theme', theme);
    } catch {
        // Ignore unavailable storage so the in-memory theme still changes.
    }
};

export function DarkModeProvider({children}: { readonly children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') {
            return 'light';
        }

        return getStoredTheme();
    });
    const isDark = theme === 'dark';

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        storeTheme(newTheme);
    };

    const value = useMemo(() => ({theme, setTheme: handleSetTheme, isDark}), [theme, isDark]);

    return (
        <DarkModeContext.Provider value={value}>
            {children}
        </DarkModeContext.Provider>
    );
}

export function useDarkMode() {
    const context = useContext(DarkModeContext);
    if (context === undefined) {
        throw new Error('useDarkMode must be used within a DarkModeProvider');
    }
    return context;
}
