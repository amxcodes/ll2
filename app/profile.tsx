import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';

export default function Profile() {
  const router = useRouter();
  const { user, checkProfileCompletion } = useAuth();
  const [loading, setLoading] = useState(false);
  interface AvatarData {
    uri: string;
    type: string;
    name: string;
  }
  const [avatarData, setAvatarData] = useState<AvatarData | null>(null);
  const [form, setForm] = useState({
    username: '',
    bio: '',
    links: { twitter: '', instagram: '', website: '' },
  });

  useEffect(() => {
    checkExistingProfile();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
    }
  };

  const checkExistingProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, bio, avatar, links')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      if (data) {
        setForm({ username: data.username || '', bio: data.bio || '', links: data.links || {} });
        if (data.avatar) setAvatarData(data.avatar);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled) {
        setAvatarData({ uri: result.assets[0].uri, type: 'image/jpeg', name: `avatar-${user?.id}-${Date.now()}.jpg` });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.username.trim() || !form.bio.trim()) {
      Alert.alert('Error', 'Please fill out all required fields');
      return;
    }
    setLoading(true);
    try {
      const updates = { id: user.id, username: form.username, bio: form.bio, avatar: avatarData, links: form.links, updated_at: new Date().toISOString() };
      const { error } = await supabase.from('users').update(updates).eq('id', user.id);
      if (error) {
        Alert.alert('Error', 'Failed to update profile');
        return;
      }
      if (await checkProfileCompletion(user.id)) {
        router.push('/dash');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']} style={styles.gradient}>
        <ScrollView style={styles.scrollView}>
          <BlurView intensity={80} tint="light" style={styles.blurContainer}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
              {avatarData ? <Image source={{ uri: avatarData.uri }} style={styles.avatar} /> : <Ionicons name="camera" size={40} color="rgba(0,0,0,0.4)" />}
            </TouchableOpacity>
            <View style={styles.formContainer}>
              <TextInput style={styles.input} placeholder="Username" value={form.username} onChangeText={(text) => setForm({ ...form, username: text })} />
              <TextInput style={styles.bioInput} placeholder="Bio" multiline value={form.bio} onChangeText={(text) => setForm({ ...form, bio: text })} />
              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Complete Profile'}</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  gradient: { flex: 1 },
  scrollView: { flex: 1 },
  blurContainer: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  avatarContainer: { alignSelf: 'center', marginBottom: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  formContainer: { width: '100%' },
  input: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: 10, marginBottom: 10 },
  bioInput: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top' },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});
