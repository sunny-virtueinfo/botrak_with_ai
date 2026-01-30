import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
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

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

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

  const renderItem = ({ item }) => {
    return (
      <Card variant="elevated" style={styles.card}>
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

        <View style={styles.detailsContainer}>
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
        </View>

        {item.members && item.members.length > 0 && (
          <View style={styles.membersRow}>
            <Text style={[styles.label, { width: '100%', marginBottom: 5 }]}>
              Members:
            </Text>
            <View style={styles.memberChips}>
              {(Array.isArray(item.members)
                ? item.members
                : [item.members]
              ).map((member, idx) => (
                <View key={idx} style={styles.memberChip}>
                  <Text style={styles.memberText}>{member}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Button
          title="Start Audit"
          variant="primary"
          onPress={() =>
            navigation.navigate('AuditLocations', {
              auditId: item.id,
              organizationId,
              plantId: item.plant_id,
            })
          }
          style={styles.startBtn}
        />
      </Card>
    );
  };

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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.s,
  },
  auditName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: SPACING.s,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: COLORS.textLight,
    width: 60,
    fontFamily: FONTS.medium,
  },
  value: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontStyle: FONTS.italic,
  },
  membersRow: { marginTop: 4, marginBottom: 12 },
  memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  memberChip: {
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberText: { fontSize: 12, color: COLORS.textMedium },
  startBtn: { marginTop: 4 },
});

export default AuditListScreen;
