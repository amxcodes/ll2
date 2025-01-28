import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../utils/supabase';
import { User } from '@supabase/supabase-js';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Task {
  id: string;
  name: string;
  status: string;
  deadline: string;
}

interface Notification {
  id: string;
  message: string;
}

const Dash = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch user, projects, tasks, and notifications
  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Get the logged-in user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData) throw new Error('User not logged in.');
      setUser(userData.user);

      const userId = userData.user.id;

      // Fetch user's projects
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('created_by', userId);
      if (projectError) throw projectError;
      setProjects(projectData);

      // Fetch user's tasks
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
      if (taskError) throw taskError;
      setTasks(taskData);

      // Fetch user's notifications
      const { data: notificationData, error: notificationError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false);
      if (notificationError) throw notificationError;
      setNotifications(notificationData);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Welcome, {user?.email}</Text>

          {/* Projects Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Projects</Text>
            <FlatList
              data={projects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text>{item.description || 'No description provided'}</Text>
                </View>
              )}
              ListEmptyComponent={<Text>No projects found.</Text>}
            />
          </View>

          {/* Tasks Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Tasks</Text>
            <FlatList
              data={tasks}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text>Status: {item.status}</Text>
                  <Text>Deadline: {new Date(item.deadline).toLocaleDateString()}</Text>
                </View>
              )}
              ListEmptyComponent={<Text>No tasks assigned or created by you.</Text>}
            />
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.notificationCard}>
                  <Text>{item.message}</Text>
                </View>
              )}
              ListEmptyComponent={<Text>No notifications.</Text>}
            />
          </View>
        </>
      }
      data={[]}
      renderItem={null}
      ListFooterComponent={
        <Button
          title="Logout"
          onPress={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } else {
              router.push('/Auth');
            }
          }}
        />
      }
    />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationCard: {
    padding: 10,
    backgroundColor: '#e7f4ff',
    borderRadius: 8,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Dash;
