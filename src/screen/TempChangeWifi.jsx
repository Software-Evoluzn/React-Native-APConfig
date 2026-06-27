import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  ScrollView,
} from 'react-native';
import Zeroconf from 'react-native-zeroconf';

// ─────────────────────────────────────────────
// CHANGE THESE TO YOUR TARGET WIFI
// ─────────────────────────────────────────────
const TARGET_SSID     = 'Airtel__Evoluzn';
const TARGET_PASSWORD = 'Evoluzn#2026';
// ─────────────────────────────────────────────

const MDNS_KEYWORD   = 'abc';          // must match MDNS.begin("abc") on ESP32
const MDNS_HOSTNAME  = 'abc.local';    // direct hostname — no IP needed
const SCAN_TIMEOUT   = 12000;          // 12 sec mDNS scan timeout
const FETCH_TIMEOUT  = 6000;           // 6 sec fetch timeout (ESP reboots fast)

export default function TempChangeWifi() {
  const [loading, setLoading]     = useState(false);
  const [status, setStatus]       = useState('');      // live log shown on screen
  const [phase, setPhase]         = useState('idle');  // idle | scanning | sending | done | error

  // ── Helpers ────────────────────────────────
  const log = (msg) => {
    console.log(msg);
    setStatus(msg);
  };

  // ── Step 1: Request location permission (Android) ──
  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      // Android 12+ needs NEARBY_WIFI_DEVICES, older needs FINE_LOCATION
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      if (Platform.Version >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES ?? 
          'android.permission.NEARBY_WIFI_DEVICES'
        );
      }

      const results = await PermissionsAndroid.requestMultiple(permissions);

      const fineGranted =
        results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
        PermissionsAndroid.RESULTS.GRANTED;

      console.log('Location permission result:', results);

      if (!fineGranted) {
        Alert.alert(
          'Permission Required',
          'Location permission is required to scan for ESP32 device via mDNS. Please grant it in app settings.',
        );
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Permission error:', err);
      return false;
    }
  };

  // ── Step 2: Scan for ESP32 via mDNS / Zeroconf ──
  const findEspIP = () =>
    new Promise((resolve, reject) => {
      const zeroconf = new Zeroconf();
      let resolved = false;

      const cleanup = () => {
        try { zeroconf.stop(); } catch (_) {}
        try { zeroconf.removeAllListeners(); } catch (_) {}
      };

      const timeoutId = setTimeout(() => {
        if (resolved) return;
        cleanup();
        reject(new Error(`ESP32 not found in ${SCAN_TIMEOUT / 1000}s. Make sure device is on and connected to WiFi.`));
      }, SCAN_TIMEOUT);

      zeroconf.on('resolved', (service) => {
        // Log EVERYTHING so you can see what names actually come in
        console.log('=== mDNS SERVICE RESOLVED ===');
        console.log('Name     :', service.name);
        console.log('Host     :', service.host);
        console.log('Addresses:', service.addresses);
        console.log('Port     :', service.port);
        console.log('Full     :', JSON.stringify(service, null, 2));

        const nameMatch = service.name?.toLowerCase().includes(MDNS_KEYWORD);
        const hostMatch = service.host?.toLowerCase().includes(MDNS_KEYWORD);

        if (nameMatch || hostMatch) {
          if (resolved) return;
          resolved = true;

          clearTimeout(timeoutId);
          cleanup();

          const ip =
            service.addresses?.find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a)) ??
            service.addresses?.[0];

          console.log('ESP32 IP resolved:', ip);

          if (ip) resolve(ip);
          else reject(new Error('ESP32 found via mDNS but no IP address returned.'));
        }
      });

      zeroconf.on('error', (err) => {
        console.log('Zeroconf error event:', err);
        // Don't reject here — errors are common during scan, timeout handles the real failure
      });

      zeroconf.on('start', () => console.log('Zeroconf scan started'));
      zeroconf.on('stop',  () => console.log('Zeroconf scan stopped'));

      // Small delay before scanning so the socket initialises properly
      setTimeout(() => {
        try {
          zeroconf.scan('http', 'tcp', 'local.');
        } catch (e) {
          clearTimeout(timeoutId);
          cleanup();
          reject(new Error('Failed to start mDNS scan: ' + e.message));
        }
      }, 300);
    });

  // ── Step 3: Send new WiFi credentials to ESP32 ──
  // Uses abc.local directly — no IP needed, avoids Android masking issue
  const sendCredentials = async (espIP) => {
    // Try abc.local first, fallback to IP if provided
    const url = `http://192.168.1.35/set_wifi`;
    console.log('POST to:', url);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `ssid=${encodeURIComponent(TARGET_SSID)}&password=${encodeURIComponent(TARGET_PASSWORD)}`,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      
      const body = await response.text().catch(() => '');
      console.log('Response status:', response.status, '| body:', body);

      return { success: true, rebooted: false };

    } catch (err) {
      clearTimeout(timeoutId);
      console.log('Fetch error (expected reboot):', err.message);

      // AbortError = timeout = ESP32 rebooted before replying = SUCCESS
      if (err.name === 'AbortError') {
        console.log('Timed out — ESP32 rebooted after receiving credentials ✓');
        return { success: true, rebooted: true };
      }

      // "Network request failed" = connection dropped = ESP32 rebooted = SUCCESS
      // This is the most common case on Android
      const msg = err.message?.toLowerCase() ?? '';
      if (
        msg.includes('network') ||
        msg.includes('failed to fetch') ||
        msg.includes('connection') ||
        msg.includes('econnrefused') ||
        msg.includes('econnreset')
      ) {
        console.log('Network dropped — ESP32 rebooted after receiving credentials ✓');
        return { success: true, rebooted: true };
      }

      if(err.name === 'Aborted'){
        throw new Error('Esp32 not reponding within 15 sec . Check IP/connection ')
      }

      // Genuine failure — rethrow
      throw err;
    }
  };

  // ── Main handler ────────────────────────────
  const changeWifi = async () => {
    console.log('====== CHANGE WIFI STARTED ======');
    setLoading(true);
    setPhase('scanning');

    try {
      // ─ 1. Location permission ───────────────
      log('Checking location permission...');
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setPhase('error');
        setLoading(false);
        return;
      }

      // ─ 2. Find ESP32 via mDNS ───────────────
      log('Scanning for ESP32 device...');
      const espIP = await findEspIP();
      log(`Device found at ${espIP}`);

      // ─ 3. Send credentials via abc.local ────
      setPhase('sending');
      log(`Sending credentials to ${espIP}...`);
      console.log(`sending credentials to {espIP}`)
      const result = await sendCredentials(espIP);

      if (result.success) {
        setPhase('done');
        log(
          result.rebooted
            ? 'Done! ESP32 rebooted to apply new WiFi settings.'
            : 'Done! Credentials accepted.',
        );
        Alert.alert(
          'Success ✓',
          `WiFi credentials sent to ESP32.\nIt will now reboot and connect to "${TARGET_SSID}".`,
        );
      }

    } catch (error) {
      console.log('====== ERROR ======');
      console.log(error);
      setPhase('error');
      log('Error: ' + error.message);
      Alert.alert('Failed', error.message);
    } finally {
      setLoading(false);
      console.log('====== CHANGE WIFI FINISHED ======');
    }
  };

  // ── UI ──────────────────────────────────────
  const phaseColor = {
    idle:     '#64748B',
    scanning: '#2563EB',
    sending:  '#D97706',
    done:     '#16A34A',
    error:    '#DC2626',
  };

  const phaseLabel = {
    idle:     'Ready',
    scanning: 'Scanning...',
    sending:  'Sending...',
    done:     'Done',
    error:    'Failed',
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>

        {/* Title */}
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#0F172A', marginBottom: 6 }}>
          Change Device WiFi
        </Text>
        <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 32, textAlign: 'center' }}>
          Sends new WiFi credentials to ESP32 via mDNS
        </Text>

        {/* Target network info */}
        <View style={{
          width: '100%', backgroundColor: '#F8FAFC',
          borderRadius: 14, padding: 16, marginBottom: 24,
          borderWidth: 1, borderColor: '#E2E8F0',
        }}>
          <Text style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>TARGET NETWORK</Text>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>{TARGET_SSID}</Text>
        </View>

        {/* Status badge */}
        {phase !== 'idle' && (
          <View style={{
            width: '100%', backgroundColor: '#F8FAFC',
            borderRadius: 14, padding: 16, marginBottom: 24,
            borderWidth: 1, borderColor: '#E2E8F0',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{
                backgroundColor: phaseColor[phase] + '20',
                paddingHorizontal: 10, paddingVertical: 4,
                borderRadius: 20,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: phaseColor[phase] }}>
                  {phaseLabel[phase]}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
              {status}
            </Text>
          </View>
        )}

        {/* Main button */}
        <TouchableOpacity
          onPress={changeWifi}
          disabled={loading}
          style={{
            width: '100%',
            backgroundColor: loading ? '#94A3B8' : '#1D9E75',
            padding: 16, borderRadius: 14,
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 10,
          }}
        >
          {loading && <ActivityIndicator color="#fff" size="small" />}
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {loading ? 'Please wait...' : 'Send WiFi Credentials'}
          </Text>
        </TouchableOpacity>

        {/* Retry button shown only on error */}
        {phase === 'error' && !loading && (
          <TouchableOpacity
            onPress={() => { setPhase('idle'); setStatus(''); }}
            style={{ marginTop: 12 }}
          >
            <Text style={{ color: '#2563EB', fontSize: 14 }}>Retry</Text>
          </TouchableOpacity>
        )}

        {/* Debug hint */}
        <Text style={{ marginTop: 32, fontSize: 11, color: '#CBD5E1', textAlign: 'center' }}>
          Check Metro logs for detailed mDNS output
        </Text>

      </View>
    </ScrollView>
  );
}