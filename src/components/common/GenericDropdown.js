import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, SHADOWS } from '../../theme';

const GenericDropdown = ({
  label,
  data,
  value,
  onValueChange,
  placeholder,
  error,
  style,
}) => {
  const [visible, setVisible] = useState(false);

  // Safety check for data
  const safeData = Array.isArray(data) ? data : [];

  // Find selected item safely
  const selectedItem = safeData.find(item => {
    const itemVal =
      typeof item === 'object'
        ? item.value !== undefined
          ? item.value
          : item.id
        : item;
    return String(itemVal) === String(value);
  });

  const displayValue = selectedItem
    ? selectedItem.label || selectedItem.name || selectedItem
    : value && value !== 'default'
    ? value
    : placeholder;

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[styles.dropdownBtn, style, error && styles.inputError]}
        onPress={() => setVisible(true)}
      >
        <Text
          style={[styles.dropdownText, !selectedItem && styles.placeholderText]}
        >
          {displayValue}
        </Text>
        <View style={styles.iconContainer}>
          <Feather name="chevron-down" size={20} color={COLORS.textLight} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={safeData}
              keyExtractor={(item, index) =>
                String(item.id || item.value || index)
              }
              renderItem={({ item }) => {
                const itemVal =
                  typeof item === 'object'
                    ? item.value !== undefined
                      ? item.value
                      : item.id
                    : item;
                const itemLabel =
                  typeof item === 'object' ? item.label || item.name : item;
                return (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      onValueChange(itemVal);
                      setVisible(false);
                    }}
                  >
                    <Text style={styles.modalItemText}>{itemLabel}</Text>
                    {String(itemVal) === String(value) && (
                      <View style={styles.checkIconContainer}>
                        <Feather
                          name="check"
                          size={18}
                          color={COLORS.primary}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setVisible(false)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {},
  dropdownBtn: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputError: { borderColor: COLORS.error },
  dropdownText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
    marginRight: SPACING.s,
  },
  placeholderText: { color: COLORS.textLight },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios' && {
      width: 24,
      height: 24,
    }),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: COLORS.text,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text,
    flex: 1,
  },
  checkIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'ios' && {
      width: 20,
      height: 20,
    }),
  },
  closeBtn: {
    marginTop: 15,
    alignSelf: 'center',
    padding: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  errorText: { color: COLORS.error, fontSize: 12, marginTop: 4 },
});

export default GenericDropdown;
