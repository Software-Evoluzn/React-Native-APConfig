import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StartScreen from '../screen/StartScreen.jsx'
import WiFiListScreen from '../screen/WiFiListScreen.jsx';
import PasswordScreen from '../screen/PasswordScreen.jsx';
import LoadingScreen from '../screen/LoadingScreen.jsx';
import SuccessScreen from '../screen/SucessScreen.jsx';
import HomeWifiListScreen from '../screen/HomeWifiListScreen.jsx'
import ResetwifiNetwork from '../screen/ResetWifiNetwork.jsx'
import TempChangeWifi from '../screen/TempChangeWifi.jsx'
import Test from '../screen/Test.jsx';


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StartScreen" component={StartScreen}/>
      <Stack.Screen name="WiFiList" component={WiFiListScreen} />
      <Stack.Screen name="HomeWifiListScreen" component={HomeWifiListScreen}/>
      <Stack.Screen name="Password" component={PasswordScreen} />
      <Stack.Screen name="Loading" component={LoadingScreen} />
      <Stack.Screen name= "ResetwifiNetwork" component={ResetwifiNetwork}/>
      <Stack.Screen name="Success" component={SuccessScreen} />
      <Stack.Screen name="TempChangeWifi" component={TempChangeWifi}/>
      <Stack.Screen name="Test" component={Test}/>
    </Stack.Navigator>
  );
}