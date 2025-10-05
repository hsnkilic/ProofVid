import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {StatusBar} from 'expo-status-bar';
import {View, Text} from 'react-native';
import CameraScreen from './screens/CameraScreen';
import RecordingsScreen from './screens/RecordingsScreen';

const Tab = createBottomTabNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#667eea',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
        }}>
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: 'ProofVid',
            tabBarIcon: ({color, size}) => (
              <Text style={{fontSize: 24}}>📹</Text>
            ),
          }}
        />
        <Tab.Screen
          name="Recordings"
          component={RecordingsScreen}
          options={{
            title: 'My Recordings',
            tabBarIcon: ({color, size}) => (
              <Text style={{fontSize: 24}}>📂</Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
