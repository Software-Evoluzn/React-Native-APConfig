import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

export default function StartScreen({ navigation }) {

  useEffect(() => {

    console.log('🚀 Start Screen Loaded');

    const timer = setTimeout(() => {

      console.log(
        '➡️ Navigating to WifiListScreen'
      );

      navigation.replace('WiFiList');

    }, 3000);

    return () => clearTimeout(timer);

  }, []);

  return (
    <View style={styles.container}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#0F172A"
      />

      <View style={styles.logoContainer}>
        <Text style={styles.logo}>
          EVOLUZN
        </Text>

        <Text style={styles.subtitle}>
          Smart Device Configuration
        </Text>
      </View>

      <ActivityIndicator
        size="small"
        color="#FFFFFF"
      />

      <Text style={styles.footer}>
        Initializing Device Setup...
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 15,
    color: '#94A3B8',
    letterSpacing: 1,
  },

  footer: {
    marginTop: 20,
    fontSize: 13,
    color: '#CBD5E1',
  },

});