import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';

interface ImageData {
  url: string;
  thumbnail_url: string;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

const ProfileCompletionScreen: React.FC = () => {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [bio, setBio] = useState('');
  const [links, setLinks] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.replace('/auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (!session) {
        router.replace('/auth');
        return;
      }

      setSession(session);
      await loadProfileData(session.user.id);
    } catch (err) {
      console.error('Session error:', err);
      router.replace('/auth');
    }
  };

  const loadProfileData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('bio, links, avatar')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setBio(data.bio || '');
        setLinks(data.links || '');
        if (data.avatar?.url) {
          setAvatar(data.avatar.url);
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const compressImage = async (uri: string) => {
    try {
      // Compress the image
      const compressedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Create thumbnail
      const thumbnail = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 200 } }],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return {
        main: compressedImage,
        thumbnail: thumbnail,
      };
    } catch (err) {
      throw new Error('Failed to compress image');
    }
  };

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) {
      router.replace('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    if (!bio.trim() || !avatar || !links.trim()) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      let avatarData: ImageData | null = null;
      if (avatar) {
        // Compress images
        const compressed = await compressImage(avatar);
        
        // Upload main image
        const mainFileName = `${session.user.id}-${Date.now()}.jpg`;
        const mainResponse = await fetch(compressed.main.uri);
        const mainBlob = await mainResponse.blob();
        
        // Upload thumbnail
        const thumbFileName = `${session.user.id}-${Date.now()}-thumb.jpg`;
        const thumbResponse = await fetch(compressed.thumbnail.uri);
        const thumbBlob = await thumbResponse.blob();

        // Upload both files to Supabase storage
        const [mainUpload, thumbUpload] = await Promise.all([
          supabase.storage.from('avatars').upload(mainFileName, mainBlob),
          supabase.storage.from('avatars').upload(thumbFileName, thumbBlob)
        ]);

        if (mainUpload.error) throw mainUpload.error;
        if (thumbUpload.error) throw thumbUpload.error;

        // Get public URLs
        const mainUrl = supabase.storage.from('avatars').getPublicUrl(mainFileName).data.publicUrl;
        const thumbUrl = supabase.storage.from('avatars').getPublicUrl(thumbFileName).data.publicUrl;

        // Create JSONB data structure
        avatarData = {
          url: mainUrl,
          thumbnail_url: thumbUrl,
          metadata: {
            width: compressed.main.width,
            height: compressed.main.height,
            format: 'jpeg',
            size: mainBlob.size
          }
        };
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          bio,
          avatar: avatarData,
          links
        })
        .eq('id', session.user.id);

      if (updateError) throw updateError;

      router.push('/dash');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null; // Or a loading spinner
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#ffffff', '#eeeeee']} style={styles.gradient}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Complete Your Profile</Text>

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarPlaceholder}>Pick Avatar</Text>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Bio"
            placeholderTextColor="rgba(0,0,0,0.5)"
            value={bio}
            onChangeText={setBio}
            multiline
          />

          <TextInput
            style={styles.input}
            placeholder="Links (e.g., your website or social profile)"
            placeholderTextColor="rgba(0,0,0,0.5)"
            value={links}
            onChangeText={setLinks}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSubmit} 
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save & Continue'}</Text>
          </TouchableOpacity>
        </View>
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
  formContainer: {
    width: '90%',
    maxWidth: 400,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    lineHeight: 100,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: 'rgba(0,0,0,0.8)',
  },
  button: {
    backgroundColor: '#6200ee',
    borderRadius: 5,
    paddingVertical: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9b7bce',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProfileCompletionScreen;