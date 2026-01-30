import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import Card from '../../components/common/Card';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import CustomDropDown from '../../components/common/CustomDropDown';

const FILTERS = {
  case1: [
    { label: 'All', value: '' },
    { label: 'Found', value: 'Found' },
    { label: 'Location mismatch', value: 'Location mismatch' },
  ],
  case2: [
    { label: 'All', value: '' },
    { label: 'Working', value: 'Working' },
    { label: 'Not Working', value: 'Not Working' },
    { label: 'Partially Working', value: 'Partially working' },
    { label: 'Scrap', value: 'Scrap' },
  ],
  case3: [
    { label: 'All', value: '' },
    { label: 'Medium', value: 'medium' },
    { label: 'Idle', value: 'Idle' },
    { label: 'Low', value: 'low' },
    { label: 'High', value: 'high' },
  ],
  case4: [
    { label: 'All', value: '' },
    { label: 'Laptop Charger', value: 'laptop charger' },
    { label: 'Laptop', value: 'laptop' },
    { label: 'Keyboard', value: 'keyboard' },
    { label: 'Mouse', value: 'mouse' },
    { label: 'Desktop', value: 'desktop' },
    { label: 'Monitor', value: 'monitor' },
    { label: 'Cable', value: 'cable' },
    { label: 'Mobile', value: 'mobile' },
  ],
  case5: [
    { label: 'All', value: '' },
    { label: 'Medium', value: 'medium' },
    { label: 'Idle', value: 'Idle' },
    { label: 'Low', value: 'low' },
    { label: 'High', value: 'high' },
  ],
};

const TABS = [
  { id: 'case1', label: 'Found' },
  { id: 'case2', label: 'Condition' },
  { id: 'case3', label: 'Usage' },
  { id: 'case4', label: 'New' },
  { id: 'case5', label: 'Not Found' },
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

        const keyMap = {
          case1: 'found_status',
          case2: 'condition',
          case3: 'usage',
          case4: 'asset_type',
          case5: 'not_found_status',
        };

        const key = keyMap[activeTab];
        if (key) {
          let valToSend = filterValue;
          if (!valToSend) {
            if (activeTab === 'case1') {
              valToSend = '';
            } else {
              valToSend = 'all';
            }
          }
          body[key] = valToSend;
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
        setHasMore(false);
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
    setFilterValue('');
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

  const capitalize = str => {
    if (!str) return '';
    return String(str).replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      duration={600}
      delay={index * 100}
      useNativeDriver
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>
              {item.asset_code || item.name || 'Unknown Asset'}
            </Text>
            {item.location_name && (
              <Text style={styles.subText}>Main Loc: {item.location_name}</Text>
            )}
            {item.current_location_name && (
              <Text style={styles.subText}>
                Current Loc: {item.current_location_name}
              </Text>
            )}
            {item.user_name && (
              <Text style={styles.subText}>User: {item.user_name}</Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end', maxWidth: '40%' }}>
            {(() => {
              let valueToShow = item.found;
              let displayLabel = item.found;

              switch (activeTab) {
                case 'case2': // Condition
                  valueToShow = item.condition;
                  displayLabel = item.condition;
                  break;
                case 'case3': // Usage
                case 'case5': // Not Found -> Usage
                  valueToShow = item.usage;
                  displayLabel = item.usage;
                  break;
                case 'case4': // New -> Asset Type
                  valueToShow = item.asset_type;
                  displayLabel = item.asset_type;
                  break;
                case 'case1':
                default:
                  valueToShow = item.found;
                  displayLabel =
                    item.found ||
                    (item.count !== undefined ? item.count : 'N/A');
                  break;
              }

              if (!valueToShow && activeTab !== 'case1') return null;

              return (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: COLORS.success + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: COLORS.success,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {capitalize(displayLabel)}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          {item.asset_type && (
            <View style={[styles.detailItem]}>
              <Feather name="box" size={12} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                {capitalize(item.asset_type)}
              </Text>
            </View>
          )}
          {item.condition && (
            <View style={[styles.detailItem]}>
              <Feather name="activity" size={12} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                Condition: {capitalize(item.condition)}
              </Text>
            </View>
          )}
          {item.usage && (
            <View style={[styles.detailItem]}>
              <Feather name="clock" size={12} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                Usage: {capitalize(item.usage)}
              </Text>
            </View>
          )}
          {item.qr_scan !== undefined && (
            <View style={[styles.detailItem]}>
              <Feather name="settings" size={12} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                Mode: {item.qr_scan ? 'QR Scanning' : 'Manual'}
              </Text>
            </View>
          )}
          {item.updated_at && (
            <View style={[styles.detailItem]}>
              <Feather name="calendar" size={12} color={COLORS.textLight} />
              <Text style={styles.detailText}>
                Updated:{' '}
                {item.updated_at
                  ? format(new Date(item.updated_at), 'dd-MM-yyyy')
                  : ''}
              </Text>
            </View>
          )}
        </View>

        {item.remark ? (
          <View style={styles.remarkContainer}>
            <Text style={styles.remarkLabel}>Remark:</Text>
            <Text style={styles.remark}>{item.remark}</Text>
          </View>
        ) : null}
      </Card>
    </Animatable.View>
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
          renderItem={({ item }) => {
            const isActive = activeTab === item.id;
            return (
              <TouchableOpacity
                onPress={() => setActiveTab(item.id)}
                activeOpacity={0.7}
              >
                {isActive ? (
                  <LinearGradient
                    colors={COLORS.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.tab, styles.activeTabGradient]}
                  >
                    <Text style={[styles.tabText, styles.activeTabText]}>
                      {item.label}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.tab}>
                    <Text style={styles.tabText}>{item.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.filterContainer}>
        <CustomDropDown
          label="Filter By"
          data={FILTERS[activeTab] || []}
          value={filterValue}
          onValueChange={val => setFilterValue(val?.value ?? val)}
          placeholder="Select Filter"
          style={styles.dropdownBtn}
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
          !loading && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={styles.emptyText}>No data found.</Text>
            </View>
          )
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
    height: 40,
  },
  activeTabGradient: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  tabText: {
    color: COLORS.textLight,
    fontWeight: '600',
    fontFamily: FONTS.medium,
  },
  activeTabText: {
    color: 'white',
  },
  filterContainer: {
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    zIndex: 100,
  },
  dropdownBtn: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  listContent: { padding: SPACING.m, paddingBottom: 100 },
  card: { marginBottom: SPACING.m, padding: SPACING.m },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  badge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  subText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  detailsRow: { flexDirection: 'row', marginTop: 10, flexWrap: 'wrap' },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 6,
    backgroundColor: COLORS.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    color: COLORS.text,
    marginLeft: 4,
    fontFamily: FONTS.medium,
  },
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
    fontStyle: FONTS.italic,
    fontSize: 12,
    color: COLORS.text,
  },
  emptyText: { textAlign: 'center', marginTop: 20, color: COLORS.textLight },
});

export default AuditReportDetailsScreen;
