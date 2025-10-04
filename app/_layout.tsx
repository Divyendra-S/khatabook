import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { useAuth } from '@/hooks/auth/useAuth';

function RootLayoutNav() {
  const { session, user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inEmployeeGroup = segments[0] === '(employee)';
    const inHRGroup = segments[0] === '(hr)';

    // Redirect logic
    if (!session && !inAuthGroup) {
      // Not signed in, redirect to login
      router.replace('/auth/login');
    } else if (session && inAuthGroup) {
      // Signed in but on auth screen, redirect based on role
      if (user?.role === 'hr' || user?.role === 'admin') {
        router.replace('/(hr)');
      } else {
        router.replace('/(employee)');
      }
    } else if (session && user) {
      // Ensure user is in correct role group
      const isHR = user.role === 'hr' || user.role === 'admin';
      if (isHR && inEmployeeGroup) {
        router.replace('/(hr)');
      } else if (!isHR && inHRGroup) {
        router.replace('/(employee)');
      }
    }
  }, [session, user, segments, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(employee)" options={{ headerShown: false }} />
      <Stack.Screen name="(hr)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryProvider>
  );
}
