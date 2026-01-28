import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/context/ToastContext';
import { ModalProvider } from './src/context/ModalContext';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <ModalProvider>
            <AppNavigator />
          </ModalProvider>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
