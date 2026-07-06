import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = {
    default: {
        name: 'По умолчанию',
        icon: '🌿',
        primary: '#10b981',
    },
    light: {
        name: 'Светлая',
        icon: '☀️',
        primary: '#10b981',
    },
    dark: {
        name: 'Тёмная',
        icon: '🌙',
        primary: '#10b981',
    },
    ocean: {
        name: 'Океан',
        icon: '🌊',
        primary: '#3b82f6',
    },
    purple: {
        name: 'Фиолетовая',
        icon: '💜',
        primary: '#8b5cf6',
    },
};

export const useTheme = () => {
    return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('curatio-theme');
        return themes[savedTheme] ? savedTheme : 'default';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('curatio-theme', theme);
    }, [theme]);

    const changeTheme = (newTheme) => {
        if (themes[newTheme]) {
            setTheme(newTheme);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: changeTheme, themes }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
