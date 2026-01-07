import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import GlassCard from '../../components/premium/GlassCard';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import { COLORS, SPACING, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AuditListScreen = ({ navigation, route }) => {
  const [audits, setAudits] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { organizationId, plantId, plantName } = route.params || {
    organizationId: user?.active_organization_id,
  };
  const { showToast } = useToast();

  const api = useApiService();

  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10; // Assuming 10 for audits, adjusting based on response

  useEffect(() => {
    loadAudits(1);
  }, []);

  const loadAudits = async (pageNumber = 1) => {
    try {
      if (pageNumber === 1) {
        setRefreshing(true);
      } else {
        setLoadingMore(true);
      }

      const params = { page: pageNumber };
      if (plantId) {
        params.plant_id = plantId;
      }
      const response = await api.getAudits(organizationId, params);

      if (response.data.success) {
        const newData = response.data.audits || [];

        if (pageNumber === 1) {
          setAudits(newData);
        } else {
          setAudits(prev => [...prev, ...newData]);
        }

        // If data returned is less than PAGE_SIZE, we've reached the end
        if (newData.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
        setPage(pageNumber);
      }
    } catch (e) {
      console.error('Failed to load audits', e);
      if (e.response && e.response.status === 401) {
        showToast('Session Expired', 'error');
      } else {
        showToast('Failed to load audits', 'error');
      }
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !refreshing) {
      loadAudits(page + 1);
    }
  };

  const onRefresh = () => {
    setHasMore(true);
    loadAudits(1);
  };

  const getStatusColor = status => {
    switch (status) {
      case 'in_progress':
      case 'start':
        return COLORS.warning;
      case 'completed':
        return COLORS.success;
      default:
        return COLORS.textLight;
    }
  };

  const renderItem = ({ item }) => (
    <GlassCard style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.auditName}>{item.name}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: getStatusColor(item.status) + '20' },
          ]}
        >
          <Text
            style={[styles.badgeText, { color: getStatusColor(item.status) }]}
          >
            {item.status?.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Plan:</Text>
        <Text style={styles.value}>{item.plan_name || 'N/A'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Start:</Text>
        <Text style={styles.value}>{item.audit_start_date}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>End:</Text>
        <Text style={styles.value}>{item.audit_end_date}</Text>
      </View>

      {item.members && item.members.length > 0 && (
        <View style={styles.membersRow}>
          <Text style={[styles.label, { width: '100%', marginBottom: 5 }]}>
            Members:
          </Text>
          <View style={styles.memberChips}>
            {(Array.isArray(item.members) ? item.members : [item.members]).map(
              (member, idx) => (
                <View key={idx} style={styles.memberChip}>
                  <Text style={styles.memberText}>{member}</Text>
                </View>
              ),
            )}
          </View>
        </View>
      )}

      <GradientButton
        title="Start Audit"
        onPress={() =>
          navigation.navigate('AuditLocations', {
            auditId: item.id,
            organizationId,
            plantId: item.plant_id,
          })
        }
        style={styles.startBtn}
        colors={COLORS.gradients.primary}
      />
    </GlassCard>
  );

  return (
    <ScreenWrapper title="Audits" showMenu={true} scrollable={false}>
      <FlatList
        data={audits}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <Loader visible={true} size="small" overlay={false} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No audits found.</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  list: { padding: SPACING.m },
  card: {
    marginBottom: SPACING.m,
    padding: SPACING.m,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  auditName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    width: 60,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  membersRow: { marginTop: 8, marginBottom: 8 },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 6 },
  memberChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberText: { fontSize: 12, color: COLORS.text },
  memberText: { fontSize: 12, color: COLORS.text },
  startBtn: { marginTop: 10 },
});

export default AuditListScreen;
