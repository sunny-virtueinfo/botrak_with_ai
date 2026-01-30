import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SHADOWS, SPACING, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import Card from '../../components/common/Card';
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
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('AuditReportDetails', {
          auditId: item.id,
          organizationId,
          auditName: item.name,
        })
      }
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.name}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.status?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={COLORS.textLight} />
            <Text style={styles.detailText}>
              {item.audit_start_date} - {item.audit_end_date}
            </Text>
          </View>

          {item.audit_spoc_name && (
            <View style={styles.detailRow}>
              <Feather name="user" size={14} color={COLORS.textLight} />
              <Text style={styles.detailText}>{item.audit_spoc_name}</Text>
            </View>
          )}

          {item.plan_name && (
            <View style={styles.detailRow}>
              <Feather name="clipboard" size={14} color={COLORS.textLight} />
              <Text style={styles.detailText}>{item.plan_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.viewReportsButton}>
            <Text style={styles.viewReportsText}>VIEW REPORTS</Text>
            <Feather name="arrow-right" size={12} color={COLORS.primary} />
          </View>
        </View>
      </Card>
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
  },
  card: { marginBottom: 15 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
    marginRight: 10,
    fontFamily: FONTS.bold,
  },
  statusBadge: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  viewReportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15', // Light primary background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewReportsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 20,
    color: COLORS.textLight,
    fontStyle: 'italic',
    fontFamily: FONTS.medium,
  },
});

export default AuditReportsScreen;
