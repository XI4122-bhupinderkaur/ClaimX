import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const NotificationsScreen = (): React.JSX.Element => (
  <View style={styles.container}>
    <Text>Notifications</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationsScreen;
