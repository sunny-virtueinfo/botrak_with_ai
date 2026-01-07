import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { COLORS, SHADOWS, SPACING } from '../../theme';
import { useApiService } from '../../services/ApiService';
import GlassCard from '../../components/premium/GlassCard';
import { useToast } from '../../context/ToastContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const AuditReportsScreen = ({ navigation, route }) => {
  const [audits, setAudits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { organizationId } = route.params || {};
  const { showToast } = useToast();
  const api = useApiService();

  useEffect(() => {
    loadAudits();
  }, []);

  const loadAudits = async () => {
    setLoading(true);
    try {
      if (!organizationId) return;
      const response = await api.getAudits(organizationId, {
        skip_audit_filter: true,
      });
      if (response.data.success) {
        setAudits(response.data.audits || []);
      }
      setLoading(false);
    } catch (e) {
      console.error('Failed to load audits', e);
      showToast('Failed to load audits', 'error');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAudits();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate('AuditReportDetails', {
          auditId: item.id,
          organizationId,
          auditName: item.name,
        })
      }
    >
      <GlassCard style={styles.card}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.status}>
          Status: {item.status?.replace('_', ' ').toUpperCase()}
        </Text>
        <Text style={styles.date}>
          Date: {item.audit_start_date} - {item.audit_end_date}
        </Text>
        <View style={styles.reportBadge}>
          <Text style={styles.reportText}>VIEW REPORTS</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper title="Reports" showMenu={true} scrollable={false}>
      {loading && (
        <View style={styles.loaderContainer}>
          <Loader visible={true} size="small" />
        </View>
      )}
      {!loading && (
        <FlatList
          data={audits}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ padding: SPACING.m }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No audits available.</Text>
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    ...SHADOWS.soft,
  },
  card: { marginBottom: 10, padding: 15 },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  status: { fontSize: 14, color: COLORS.textLight, marginTop: 4 },
  date: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  reportBadge: {
    marginTop: 10,
    backgroundColor: '#E0E7FF',
    alignSelf: 'flex-start',
    padding: 4,
    borderRadius: 4,
  },
  reportText: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 20, color: COLORS.textLight },
});

export default AuditReportsScreen;
