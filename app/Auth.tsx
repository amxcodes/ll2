import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';

const Auth: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [animation] = useState(new Animated.Value(0));

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const checkProfileCompletion = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('bio, avatar, links')
        .eq('id', userId)
        .single();

      if (error) return false;
      return Boolean(data?.bio?.trim() && data?.avatar && data?.links);
    } catch {
      return false;
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    setError(null);

    if (mode === 'signup') {
      if (!username || !email || !password || !repeatPassword) {
        setError('All fields are required.');
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
      if (password !== repeatPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      try {
        const { error } = await supabase.from('users').insert({
          username,
          email,
          password_hash: password,
        });

        if (error) throw error;
        setMode('signin');
        setError('Account created successfully. Please sign in.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!username || !password) {
        setError('Username and password are required.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .eq('password_hash', password)
          .single();

        if (error || !data) throw new Error('Invalid username or password.');

        const isProfileComplete = await checkProfileCompletion(data.id);
        if (!isProfileComplete) {
          router.push('/profile');
        } else {
          router.push('/dash');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred.');
      } finally {
        setLoading(false);
      }
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.gradient}>
        <Animated.View style={[styles.blurContainer, animatedStyle]}>
          <BlurView intensity={80} tint="light" style={styles.blurView}>
            <Text style={styles.title}>{mode === 'signin' ? 'Welcome Back' : 'Create Account'}</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="rgba(0,0,0,0.5)" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="rgba(0,0,0,0.5)"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            {mode === 'signup' && (
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
            )}

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

            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={24} color="rgba(0,0,0,0.5)" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat Password"
                  placeholderTextColor="rgba(0,0,0,0.5)"
                  value={repeatPassword}
                  onChangeText={setRepeatPassword}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
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
    marginBottom: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginBottom: 15,
    width: '100%',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    color: 'rgba(0,0,0,0.8)',
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#6200ee',
    marginTop: 15,
  },
});

export default Auth;
