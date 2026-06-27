import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
} from 'react-native';

import styles from '../styles/LoadingStyles';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color="#185FA5"
      />

      <Text style={styles.text}>
        Sending credentials...
      </Text>
    </View>
  );
}