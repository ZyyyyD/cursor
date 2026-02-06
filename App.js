import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDarkMode } = useTheme();

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
