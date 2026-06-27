import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';

export default function TestESP32Screen() {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState('');

    const addLog = msg => {
        console.log(msg);
        setLogs(prev => prev + '\n' + msg);
    };

    const testConnection = async () => {
        setLoading(true);
        setLogs('');

        try {
            addLog('🚀 Testing ESP32 connection...');
            addLog('📡 Calling: http://192.168.1.35');

            const response = await fetch('http://192.168.1.35');

            addLog(`✅ Status Code: ${response.status}`);

            const text = await response.text();

            addLog('📄 Response Received:');
            addLog(text);

            Alert.alert(
                'Success',
                `Connected successfully!\nStatus: ${response.status}`,
            );
        } catch (error) {
            addLog('❌ ERROR OCCURRED');
            addLog(`Message: ${error.message}`);
            addLog(JSON.stringify(error, null, 2));

            Alert.alert(
                'Connection Failed',
                error.message || 'Unknown Error',
            );
        } finally {
            setLoading(false);
        }
    };

    const testResetEndpoint = async () => {
        setLoading(true);
        setLogs('');

        try {
            addLog('🚀 Testing /reset_wifi endpoint...');
            addLog('📡 Calling: http://192.168.1.35/set_wifi');

            const response = await fetch(
                'http://192.168.1.35/set_wifi',
            );

            addLog(`✅ Status Code: ${response.status}`);

            const text = await response.text();

            addLog('📄 Response:');
            addLog(text);

            Alert.alert(
                'Success',
                `Status: ${response.status}`,
            );
        } catch (error) {
            addLog('❌ ERROR OCCURRED');
            addLog(`Message: ${error.message}`);
            addLog(JSON.stringify(error, null, 2));

            Alert.alert(
                'Connection Failed',
                error.message || 'Unknown Error',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View
                style={{
                    flex: 1,
                    padding: 20,
                    justifyContent: 'center',
                }}>
                <Text
                    style={{
                        fontSize: 24,
                        fontWeight: 'bold',
                        marginBottom: 30,
                        textAlign: 'center',
                    }}>
                    ESP32 Connection Test
                </Text>

                <TouchableOpacity
                    onPress={testConnection}
                    disabled={loading}
                    style={{
                        backgroundColor: '#2196F3',
                        padding: 15,
                        borderRadius: 10,
                        marginBottom: 15,
                    }}>
                    <Text
                        style={{
                            color: '#fff',
                            textAlign: 'center',
                            fontWeight: 'bold',
                        }}>
                        Test Root URL
                    </Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                    onPress={testResetEndpoint}
                    disabled={loading}
                    style={{
                        backgroundColor: '#4CAF50',
                        padding: 15,
                        borderRadius: 10,
                        marginBottom: 20,
                    }}>
                    <Text
                        style={{
                            color: '#fff',
                            textAlign: 'center',
                            fontWeight: 'bold',
                        }}>
                        Test /reset_wifi
                    </Text>
                </TouchableOpacity> */}

                {loading && (
                    <ActivityIndicator
                        size="large"
                        style={{ marginBottom: 20 }}
                    />
                )}

                <View
                    style={{
                        backgroundColor: '#f5f5f5',
                        padding: 15,
                        borderRadius: 10,
                        minHeight: 250,
                    }}>
                    <Text
                        style={{
                            fontWeight: 'bold',
                            marginBottom: 10,
                        }}>
                        Logs:
                    </Text>

                    <Text>{logs || 'No logs yet...'}</Text>
                </View>
            </View>
        </ScrollView>
    );
}