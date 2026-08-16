import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';

import RootNavigator from './src/navigation/RootNavigator';
import { queryClient } from './src/config/queryClient';

const App = (): React.JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  </QueryClientProvider>
);

export default App;
