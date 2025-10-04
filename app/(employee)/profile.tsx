import { View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ActivityIndicator, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/auth/useAuth';
import { useSignOut } from '@/hooks/mutations/useAuthMutations';
import { formatDate } from '@/lib/utils/date.utils';
import { useRef } from 'react';

export default function ProfileScreen() {
  const { user } = useAuth();
  const signOutMutation = useSignOut();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOutMutation.mutate(),
        },
      ]
    );
  };

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [320, 100],
    extrapolate: 'clamp',
  });

  const avatarScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.5],
    extrapolate: 'clamp',
  });

  const contentOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0, 0],
    extrapolate: 'clamp',
  });

  const contentHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [120, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366F1" />

      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.View style={[
          styles.avatarWrapper,
          { transform: [{ scale: avatarScale }] }
        ]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.full_name?.charAt(0).toUpperCase()}
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={[
          styles.userInfoWrapper,
          {
            height: contentHeight,
            opacity: contentOpacity
          }
        ]}>
          <Text style={styles.name}>{user?.full_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[
            styles.roleBadge,
            user?.is_active ? styles.activeRoleBadge : styles.inactiveRoleBadge
          ]}>
            <Text style={styles.roleText}>{user?.role || 'employee'}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <MaterialCommunityIcons name="badge-account" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Employee ID</Text>
              </View>
              <Text style={styles.infoValue}>{user?.employee_id}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <Ionicons name="call-outline" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{user?.phone || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <MaterialCommunityIcons name="office-building" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Department</Text>
              </View>
              <Text style={styles.infoValue}>{user?.department || 'Not assigned'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <MaterialCommunityIcons name="account-tie" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Designation</Text>
              </View>
              <Text style={styles.infoValue}>{user?.designation || 'Not assigned'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Status</Text>
              </View>
              <View style={[styles.statusBadge, user?.is_active ? styles.statusActive : styles.statusInactive]}>
                <View style={[styles.statusDot, user?.is_active ? styles.statusDotActive : styles.statusDotInactive]} />
                <Text style={styles.statusText}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <Feather name="user-plus" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Joined</Text>
              </View>
              <Text style={styles.infoValue}>
                {user?.created_at ? formatDate(new Date(user.created_at)) : '-'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <View style={styles.infoIconWrapper}>
                  <Feather name="clock" size={20} color="#6366F1" />
                </View>
                <Text style={styles.infoLabel}>Last Updated</Text>
              </View>
              <Text style={styles.infoValue}>
                {user?.updated_at ? formatDate(new Date(user.updated_at)) : '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={signOutMutation.isPending}
            activeOpacity={0.7}
          >
            {signOutMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="logout" size={20} color="#FFFFFF" />
                <Text style={styles.signOutButtonText}>Sign Out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 1.0.0</Text>
          <Text style={styles.footerSubtext}>Salary Book App</Text>
        </View>
      </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366F1',
  },
  header: {
    backgroundColor: '#6366F1',
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#6366F1',
  },
  userInfoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  email: {
    fontSize: 15,
    color: '#E0E7FF',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeRoleBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveRoleBadge: {
    backgroundColor: '#FEE2E2',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 40,
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0F172A',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: '#10B981',
  },
  statusDotInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  signOutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#CBD5E1',
  },
});
