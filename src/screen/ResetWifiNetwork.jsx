import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import WifiManager from 'react-native-wifi-reborn';
import Zeroconf from 'react-native-zeroconf';

import { resolveEspIp } from '../utils/EspDiscovery';

export default function ResetwifiNetwork({ navigation }) {
  const [modal, setModal] = useState('');
  const [wifiList, setWifiList] = useState([]);
  const [selSSID, setSelSSID] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  // const [espIP, setEspIP] = useState(null);

  // // Screen open → Zeroconf se IP cache karo (ek baar)
  // useEffect(() => {
  //   const zc = new Zeroconf();
  //   let found = false;

  //   zc.on('resolved', (service) => {
  //     if (!found && service.name?.toLowerCase().includes('abc')) {
  //       found = true;
  //       const ip = service.addresses?.find(a => /^\d+\.\d+\.\d+\.\d+$/.test(a));
  //       if (ip) {
  //         console.log('ESP32 IP cached:', ip);
  //         setEspIP(ip);
  //       }
  //       zc.stop();
  //     }
  //   });
  //   zc.on('error', () => { });

  //   setTimeout(() => zc.scan('http', 'tcp', 'local.'), 300);
  //   const timeout = setTimeout(() => { if (!found) zc.stop(); }, 12000);

  //   return () => { clearTimeout(timeout); zc.stop(); zc.removeAllListeners(); };
  // }, []);

  const scanWifi = async () => {
    setBusy(true); setModal('wifi'); setWifiList([]);
    try {
      const list = await WifiManager.reScanAndLoadWifiList();
      setWifiList(list.filter(i =>
        i.SSID && i.SSID.length > 0 &&
        i.frequency >= 2400 && i.frequency <= 2500 &&
        !i.SSID.startsWith('ESP')
      ));
    } catch (e) { Alert.alert('Error', 'WiFi scan failed.'); setModal(''); }
    finally { setBusy(false); }
  };

  const pickWifi = (ssid) => {
    setSelSSID(ssid); setNewPw(''); setShowPw(false); setModal('password');
  };

  const changeWifi = async () => {
    if (newPw.length < 8) {
      Alert.alert("Error", "Minimum 8 characters");
      return;
    }

    setBusy(true);
    setModal("loading");
    setStatusMsg("Finding device...");

    try {
      console.log("1. Starting resolveEspIp");

      const ip = await resolveEspIp();

      console.log("2. IP Found:", ip);

      setStatusMsg("Changing WiFi...");

      console.log("3. Sending request");
      console.log("Sending to:", `http://${ip}/set_wifi`);

      const res = await fetch(`http://${ip}/set_wifi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `ssid=${encodeURIComponent(selSSID)}&password=${encodeURIComponent(newPw)}`,
      });

      setBusy(false);
      setModal("");

      if (res.ok) {
        Alert.alert(
          "Success",
          "WiFi changed successfully.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("WiFiList"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Failed",
          `Failed to change WiFi. (${res.status})`
        );
      }
    } catch (e) {
      setBusy(false);
      setModal("");

      console.log("ERROR NAME:", e.name);
      console.log("ERROR MESSAGE:", e.message);
      console.log("FULL ERROR:", e);

      Alert.alert(
        "Error",
        e.message || "Unable to communicate with ESP32."
      );
    }
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <TouchableOpacity onPress={() => navigation.goBack()}
        style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 16, color: '#1D9E75', fontWeight: '500' }}>‹ Back</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, elevation: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#0F172A' }}>Change WiFi</Text>
          <Text style={{ marginTop: 12, textAlign: 'center', color: '#64748B' }}>
            Select a new 2.4GHz network for your ESP32 device.
          </Text>

          {/* <View style={{
            marginTop: 20, padding: 12, borderRadius: 10,
            backgroundColor: espIP ? '#E1F5EE' : '#FEF2F2',
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Text>{espIP ? '🟢' : '🔴'}</Text>
            <Text style={{ fontSize: 13, color: espIP ? '#0F6E56' : '#B91C1C' }}>
              {espIP ? `ESP32 found (${espIP})` : 'Searching for ESP32...'}
            </Text>
          </View> */}

          <TouchableOpacity onPress={scanWifi} disabled={busy}
            style={{
              marginTop: 20, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
              backgroundColor: busy ? '#CBD5E1' : '#1D9E75',
            }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Select WiFi Network</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modal === 'loading'} transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', marginHorizontal: 40 }}>
            <ActivityIndicator size="large" color="#1D9E75" />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '600' }}>{statusMsg}</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={modal === 'wifi'} animationType="slide" transparent onRequestClose={() => setModal('')}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Select 2.4GHz WiFi</Text>
              <TouchableOpacity onPress={() => setModal('')}><Text style={{ fontSize: 16, color: '#999', padding: 8 }}>✕</Text></TouchableOpacity>
            </View>
            {busy ? (
              <View style={{ alignItems: 'center', paddingVertical: 50 }}>
                <ActivityIndicator size="large" color="#1D9E75" /><Text style={{ marginTop: 12, color: '#666' }}>Scanning...</Text>
              </View>
            ) : (
              <FlatList data={wifiList} keyExtractor={(_, i) => i.toString()} style={{ maxHeight: 400 }}
                ListEmptyComponent={<View style={{ alignItems: 'center', paddingVertical: 50 }}>
                  <Text style={{ color: '#666' }}>No 2.4GHz networks</Text>
                  <TouchableOpacity onPress={scanWifi} style={{ marginTop: 16, backgroundColor: '#1D9E75', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Scan Again</Text></TouchableOpacity></View>}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => pickWifi(item.SSID)}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1D9E75' }} />
                    <View style={{ flex: 1 }}><Text style={{ fontSize: 15, fontWeight: '500' }}>{item.SSID}</Text>
                      <Text style={{ fontSize: 12, color: '#999' }}>2.4 GHz</Text></View>
                    <Text style={{ color: '#ccc', fontSize: 20 }}>›</Text>
                  </TouchableOpacity>)} />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={modal === 'password'} animationType="slide" transparent onRequestClose={() => setModal('')}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#ddd', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>Enter Password</Text>
              <TouchableOpacity onPress={() => setModal('')}><Text style={{ fontSize: 16, color: '#999', padding: 8 }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ paddingHorizontal: 16, paddingBottom: 30 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6 }}>SSID</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#f5f5f5', color: '#999', marginBottom: 16 }}
                value={selSSID} editable={false} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 6 }}>PASSWORD</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <TextInput style={{ flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15 }}
                  placeholder="Enter password" placeholderTextColor="#bbb" secureTextEntry={!showPw} value={newPw} onChangeText={setNewPw} autoFocus />
                <TouchableOpacity style={{ padding: 10 }} onPress={() => setShowPw(!showPw)}>
                  <Text style={{ fontSize: 18 }}>{showPw ? '🙈' : '👁️'}</Text></TouchableOpacity>
              </View>
              <TouchableOpacity onPress={changeWifi} disabled={busy}
                style={{ backgroundColor: '#1D9E75', paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Change WiFi</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModal('')}
                style={{ paddingVertical: 14, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', marginTop: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}