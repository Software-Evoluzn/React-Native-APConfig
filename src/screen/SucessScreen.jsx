import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import styles from '../styles/SuccessStyles';

export default function SuccessScreen({
  route,
  navigation,
}) {
  const { ssid } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.success}>
        ✓
      </Text>

      <Text style={styles.heading}>
        Connected Successfully
      </Text>

      <Text style={styles.subtitle}>
        Connected to {ssid}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate('WiFiList')
        }
      >
        <Text style={styles.buttonText}>
          Done
        </Text>
      </TouchableOpacity>
    </View>
  );
}