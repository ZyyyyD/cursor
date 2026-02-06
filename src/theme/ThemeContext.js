import React, { createContext, useState, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightColors, darkColors } from "./index";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("appTheme");
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === "dark");
      } else {
        // Use system color scheme if no preference saved
        setIsDarkMode(systemColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      setIsDarkMode(systemColorScheme === "dark");
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem("appTheme", newValue ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const setDarkMode = async (value) => {
    try {
      setIsDarkMode(value);
      await AsyncStorage.setItem("appTheme", value ? "dark" : "light");
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        colors,
        isLoaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
