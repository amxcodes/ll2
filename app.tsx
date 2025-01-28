import React, { useEffect, useState } from 'react';
import { supabase } from './utils/supabase';
import Navigation from './navigation/Navigation';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log('Session:', data);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2F7C6E" />
      </View>
    );
  }

  return <Navigation />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
