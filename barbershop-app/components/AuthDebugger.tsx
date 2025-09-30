import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';

export function AuthDebugger() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const testLogin = async () => {
    try {
      console.log('Testing Firebase connection...');
      console.log('Current user:', auth.currentUser);
      console.log('Auth state:', isAuthenticated);
      console.log('User data:', user);
    } catch (error) {
      console.error('Auth test error:', error);
    }
  };

  if (__DEV__) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Auth Debug Info</Text>
        <Text style={styles.text}>Loading: {isLoading ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</Text>
        <Text style={styles.text}>User: {user ? `${user.firstName} ${user.lastName}` : 'None'}</Text>
        <Text style={styles.text}>Email: {user?.email || 'None'}</Text>
        <Text style={styles.text}>Role: {user?.role || 'None'}</Text>
        <TouchableOpacity style={styles.button} onPress={testLogin}>
          <Text style={styles.buttonText}>Test Auth</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    marginBottom: 2,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 12,
  },
});
