import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, KeyboardAvoidingView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';

interface AuthProps {
  onAuthSuccess?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [animation] = useState(new Animated.Value(0));

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError('Invalid email address.');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data?.session) {
          // Store session in your app's state or secure storage
          console.log('Session:', data.session);
        }
      }

      onAuthSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    Animated.spring(animation, {
      toValue: mode === 'signin' ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
    setMode(mode === 'signin' ? 'signup' : 'signin');
  };

  const animatedStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
        }),
      },
    ],
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
        style={styles.gradient}
      >
        <Animated.View style={[styles.blurContainer, animatedStyle]}>
          <BlurView intensity={80} tint="light" style={styles.blurView}>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
            </Text>

            {error && (
              <Text style={styles.error}>{error}</Text>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={24} color="rgba(0,0,0,0.5)" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="rgba(0,0,0,0.5)" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleAuth}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Text>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '90%',
    maxWidth: 400,
  },
  blurView: {
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(0,0,0,0.8)',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: 'rgba(0,0,0,0.8)',
    fontSize: 16,
  },
  error: {
    color: 'rgba(255,0,0,0.7)',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    height: 50,
    width: '100%',
    backgroundColor: 'rgba(0,123,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleText: {
    color: 'rgba(0,123,255,0.8)',
    textAlign: 'center',
  },
});

export default Auth;

