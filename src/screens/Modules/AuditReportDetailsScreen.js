import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import GlassCard from '../../components/premium/GlassCard';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';

const TABS = [
  { id: 'case1', label: 'Found' },
  { id: 'case5', label: 'Not Found' },
  { id: 'case2', label: 'Condition' },
  { id: 'case3', label: 'Usage' },
  { id: 'case4', label: 'New' },
];

const AuditReportDetailsScreen = ({ route, navigation }) => {
  const { organizationId, auditId, auditName } = route.params || {};
  const [activeTab, setActiveTab] = useState('case1');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filterValue, setFilterValue] = useState('');
  const [hasMore, setHasMore] = useState(true);

  const api = useApiService();

  const getTabName = type => {
    switch (type) {
      case 'case1':
        return 'found_by_filter';
      case 'case2':
        return 'condition_by_filter';
      case 'case3':
        return 'usage_by_filter';
      case 'case4':
        return 'new_assets';
      case 'case5':
        return 'not_found_assets';
      default:
        return 'found_by_filter';
    }
  };

  const fetchPage = useCallback(
    async pageNo => {
      if (loading) return;
      setLoading(true);
      try {
        const body = {
          tab_name: getTabName(activeTab),
          page: pageNo,
          from_mobile: true,
        };

        if (filterValue) {
          const keyMap = {
            case1: 'found_status',
            case2: 'condition',
            case3: 'usage',
            case4: 'asset_type',
            case5: 'not_found_status',
          };
          if (keyMap[activeTab]) {
            body[keyMap[activeTab]] = filterValue;
          }
        }

        const apiMap = {
          case1: 'found_by_filter',
          case2: 'condition_by_filter',
          case3: 'usage_by_filter',
          case4: 'new_assets',
          case5: 'not_found_assets',
        };

        const responseKey = apiMap[activeTab];
        const res = await api.getAuditReports(organizationId, auditId, body);

        if (res.data && res.data.success) {
          const resultData = res.data[responseKey] || [];
          if (resultData.length === 0) {
            setHasMore(false);
          } else {
            setHasMore(true);
            if (pageNo === 1) {
              setData(resultData);
            } else {
              setData(prev => [...prev, ...resultData]);
            }
          }
        } else {
          setHasMore(false);
        }
      } catch (e) {
        console.error('Fetch error:', e);
        setHasMore(false); // Stop fetching on error
      } finally {
        setLoading(false);
      }
    },
    [activeTab, filterValue, auditId, organizationId],
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setData([]);
    fetchPage(1);
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setHasMore(true);
      fetchPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filterValue]);

  const renderItem = ({ item }) => (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>
            {item.asset_code || item.name || 'Unknown Asset'}
          </Text>
          {item.location_name && (
            <Text style={styles.subText}>Loc: {item.location_name}</Text>
          )}
          {item.user_name && (
            <Text style={styles.subText}>User: {item.user_name}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  item.found === 'Found'
                    ? COLORS.success + '20'
                    : COLORS.error + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: item.found === 'Found' ? COLORS.success : COLORS.error,
                },
              ]}
            >
              {item.found || (item.count !== undefined ? item.count : 'N/A')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsRow}>
        {item.condition && (
          <View style={styles.detailItem}>
            <Feather name="activity" size={12} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.condition}</Text>
          </View>
        )}
        {item.usage && (
          <View style={styles.detailItem}>
            <Feather name="clock" size={12} color={COLORS.textLight} />
            <Text style={styles.detailText}>{item.usage}</Text>
          </View>
        )}
      </View>

      {item.remark ? (
        <View style={styles.remarkContainer}>
          <Text style={styles.remarkLabel}>Remark:</Text>
          <Text style={styles.remark}>{item.remark}</Text>
        </View>
      ) : null}
    </GlassCard>
  );

  return (
    <ScreenWrapper
      title={auditName || 'Audit Report'}
      showBack={true}
      scrollable={false}
    >
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: SPACING.m }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.tab, activeTab === item.id && styles.activeTab]}
              onPress={() => setActiveTab(item.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === item.id && styles.activeTabText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color={COLORS.textLight}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter..."
          value={filterValue}
          onChangeText={setFilterValue}
        />
      </View>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item.id || index).toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPage(nextPage);
          }
        }}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading && <Text style={styles.emptyText}>No data found.</Text>
        }
        ListFooterComponent={
          loading && <Loader visible={true} size="small" overlay={false} />
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    marginVertical: SPACING.s,
    height: 50,
  },
  tab: {
    marginRight: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  searchContainer: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
  },
  searchInput: { flex: 1, color: COLORS.text },
  listContent: { padding: SPACING.m },
  card: { marginBottom: SPACING.m, padding: SPACING.m },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  badge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  subText: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  detailsRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: { fontSize: 12, color: COLORS.text, marginLeft: 4 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 10 },
  remarkContainer: {
    marginTop: 10,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
  },
  remarkLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: 'bold' },
  remark: {
    marginTop: 2,
    fontStyle: 'italic',
    fontSize: 12,
    color: COLORS.text,
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.textLight },
});

export default AuditReportDetailsScreen;
