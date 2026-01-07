import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import GlassCard from '../../components/premium/GlassCard';
import Feather from 'react-native-vector-icons/Feather';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const RemindersScreen = ({ route, navigation }) => {
  const { organizationId } = route.params || {};
  const [reminders, setReminders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFabOptions, setShowFabOptions] = useState(false);
  const api = useApiService();

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      if (!organizationId) {
        setLoading(false);
        return;
      }
      const response = await api.getReminders(organizationId);
      if (response.data && response.data.success) {
        setReminders(response.data.organization_reminders || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleManual = () => {
    setShowFabOptions(false);
    // Navigate to StackAssetList for selecting asset for reminder
    navigation.navigate('PlantSelection', {
      nextScreen: 'StackAssetList',
      isForReminder: true,
      organizationId,
    });
  };

  const handleQRScan = () => {
    setShowFabOptions(false);
    navigation.navigate('QRScanner', { organizationId, mode: 'reminder' });
  };

  const renderItem = ({ item }) => (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                item.reminder_type === 'maintenance'
                  ? COLORS.error
                  : COLORS.secondary,
            },
          ]}
        >
          <Text style={styles.badgeText}>{item.reminder_type}</Text>
        </View>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>
        Due:{' '}
        {item.reminder_date
          ? new Date(item.reminder_date).toDateString()
          : 'N/A'}
      </Text>
    </GlassCard>
  );

  return (
    <ScreenWrapper title="Reminders" showMenu={true} scrollable={false}>
      {/* Use Loader for initial load if needed, but here we just have refreshing on list.
           However, let's add a global loader if we were fetching on mount without refreshing prop.
           For now, the user requested 'proper loader', so let's check if we have a robust loading state.
           The code has `useEffect` calling `loadReminders`. `loadReminders` does not set a loading state other than relying on `refreshing`?
           Actually `refreshing` is only for pull-to-refresh.
           Let's add `isLoading` state.
       */}
      <Loader visible={loading} />
      <FlatList
        data={reminders}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No reminders found.</Text>
        }
      />

      {/* FAB Options Overlay */}
      {showFabOptions && (
        <View style={styles.fabOptionsContainer}>
          <TouchableOpacity style={styles.fabOption} onPress={handleManual}>
            <Text style={styles.fabOptionText}>Manual</Text>
            <View style={styles.miniFab}>
              <Feather name="edit-3" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabOption} onPress={handleQRScan}>
            <Text style={styles.fabOptionText}>QR Scan</Text>
            <View style={styles.miniFab}>
              <Feather name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowFabOptions(!showFabOptions)}
      >
        <LinearGradient
          colors={COLORS.gradients.primary}
          style={styles.fabGradient}
        >
          <Feather
            name={showFabOptions ? 'x' : 'plus'}
            size={28}
            color="white"
          />
        </LinearGradient>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m },
  card: { marginBottom: SPACING.m, padding: SPACING.m, borderRadius: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  message: { fontSize: 14, color: COLORS.textLight, marginBottom: SPACING.s },
  date: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.textLight },

  // FAB Styles
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    ...SHADOWS.medium,
    elevation: 5,
    zIndex: 99,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOptionsContainer: {
    position: 'absolute',
    bottom: 100,
    right: 30,
    alignItems: 'flex-end',
    zIndex: 99,
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  fabOptionText: {
    marginRight: SPACING.m,
    fontWeight: '600',
    color: COLORS.text,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
  },
  miniFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
});

export default RemindersScreen;
