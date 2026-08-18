import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Platform } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';

import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/config/queryClient';
import { setApiBaseUrl } from './src/api/client';

const App = (): React.JSX.Element => {
  useEffect(() => {
    // Configure API base URL for platform-specific development environment
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine localhost
      setApiBaseUrl('http://10.0.2.2:3000');
    } else if (Platform.OS === 'ios') {
      // iOS simulator can use localhost directly
      setApiBaseUrl('http://localhost:3000');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
};

export default App;
