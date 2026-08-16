import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const ForgotPasswordScreen = (): React.JSX.Element => (
  <View style={styles.container}>
    <Text>ForgotPassword</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ForgotPasswordScreen;
