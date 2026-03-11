import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const THEME_COLORS = [
  '#FFD500', '#2979FF', '#FF006E', '#00E676',
  '#FF9100', '#AA00FF', '#00E5FF', '#FF3333',
];

export function ThemeProvider({ children }) {
  const { user } = useAuth();
  const [accent, setAccent] = useState('#FFD500');

  useEffect(() => {
    if (user?.theme_color) {
      setAccent(user.theme_color);
      document.documentElement.style.setProperty('--accent', user.theme_color);
    }
  }, [user]);

  const changeAccent = (color) => {
    setAccent(color);
    document.documentElement.style.setProperty('--accent', color);
  };

  return (
    <ThemeContext.Provider value={{ accent, changeAccent, THEME_COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
