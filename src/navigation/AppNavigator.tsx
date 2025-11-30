import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import HistoryScreen from "../screens/HistoryScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RecordDetailsScreen from "../screens/RecordDetailsScreen";
import RecordScreen from "../screens/RecordScreen";
import RegisterScreen from "../screens/RegisterScreen";

export type RootStackParamList = {
  LoginScreen: undefined;
  RegisterScreen: undefined;
  HomeScreen: undefined;
  RecordScreen: undefined;
  HistoryScreen: undefined;
  RecordDetails: { 
    id: string;
    pacienteNome?: string;
    cpfPaciente?: string;
    dataRegistro?: string;
    transcricao?: string;
    audioPath?: string;
    latitude?: number;
    longitude?: number;
    endereco?: string;
  };    
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RecordScreen" component={RecordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HistoryScreen" component={HistoryScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RecordDetails" component={RecordDetailsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
