import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Loader from '../../components/common/Loader';
import Feather from 'react-native-vector-icons/Ionicons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AssetRegisterSelectionScreen = ({ navigation, route }) => {
  const { organizationId, isForAssignment } = route.params || {};
  const api = useApiService();

  const [loading, setLoading] = useState(true);
  const [registers, setRegisters] = useState([]);

  useEffect(() => {
    loadRegisters();
  }, []);

  const loadRegisters = async () => {
    try {
      setLoading(true);
      const res = await api.getAssetRegisters(organizationId);
      if (res.data) {
        const list =
          res.data.asset_registers ||
          res.data.data ||
          (Array.isArray(res.data) ? res.data : []);
        setRegisters(list);
      }
    } catch (error) {
      console.error('Failed to load registers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegister = register => {
    navigation.navigate('Dashboard', {
      screen: 'AssetAssignment',
      params: {
        organizationId,
        registerId: register.id,
        registerName: register.name,
      },
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleSelectRegister(item)}
    >
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <Feather name="book-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward-outline"
          size={24}
          color={COLORS.textLight}
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Loader visible={true} size="large" />
      </View>
    );
  }

  return (
    <ScreenWrapper title="Select Register" showMenu={true} scrollable={false}>
      <FlatList
        data={registers}
        renderItem={renderItem}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No Asset Registers Found</Text>
          </View>
        }
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: SPACING.m,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: SPACING.m,
    ...SHADOWS.soft,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF', // Light Indigo
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.s,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: 16,
  },
});

export default AssetRegisterSelectionScreen;
