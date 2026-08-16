import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const PoliciesScreen = (): React.JSX.Element => (
  <View style={styles.container}>
    <Text>Policies</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PoliciesScreen;
