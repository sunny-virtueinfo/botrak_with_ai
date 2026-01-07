import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Feather from 'react-native-vector-icons/Feather';

const AddReminderScreen = ({ navigation, route }) => {
  const { organizationId } = route.params;
  const initialAssetCode = route.params?.assetCode || '';
  const assetId = route.params?.assetId;

  // Form State
  const [assetCode, setAssetCode] = useState(initialAssetCode);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getFullYear()}`;
  });
  const [loading, setLoading] = useState(false);

  // Calendar State
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const { showToast } = useToast();
  const api = useApiService();

  const handleReset = () => {
    setAssetCode('');
    setTitle('');
    setDescription('');
    setDate('');
  };

  const handleSubmit = async () => {
    if (!assetCode || !title || !date) {
      showToast(
        'Please fill required fields (Asset Code, Title, Date)',
        'error',
      );
      return;
    }

    try {
      setLoading(true);
      // Convert DD-MM-YYYY to YYYY-MM-DD for API
      const [day, month, year] = date.split('-');
      const apiDate = `${year}-${month}-${day}`;

      const payload = {
        id: assetId,
        reminders_attributes: [
          {
            title,
            description,
            date: apiDate,
          },
        ],
      };

      const response = await api.createReminder(organizationId, payload);
      if (response.data && response.status) {
        showToast('Reminder added successfully', 'success');
        navigation.goBack();
      } else {
        showToast(response.data?.error || 'Failed to add reminder', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calendar Helpers
  const generateCalendar = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const handleDateSelect = day => {
    if (!day) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const formattedDate = `${day.toString().padStart(2, '0')}-${month
      .toString()
      .padStart(2, '0')}-${year}`;
    setDate(formattedDate);
    setShowCalendar(false);
  };

  const changeMonth = delta => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1),
    );
  };

  const renderCalendarModal = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const days = generateCalendar(year, month);

    return (
      <Modal
        transparent={true}
        visible={showCalendar}
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="chevron-left" size={24} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.monthTitle}>
                {monthName} {year}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="chevron-right" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekRow}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>

            <FlatList
              data={days}
              numColumns={7}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dayCell, item && styles.activeDayCell]}
                  onPress={() => handleDateSelect(item)}
                  disabled={!item}
                >
                  <Text
                    style={[styles.dayText, !item && { color: 'transparent' }]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScreenWrapper
      title="Add Reminder"
      showBack={true}
      scrollable={true}
      contentContainerStyle={styles.content}
    >
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Asset Code <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={assetCode}
          onChangeText={setAssetCode}
          placeholder="Enter Asset Code"
          placeholderTextColor={COLORS.textLight}
          editable={!assetId} // If assetId exists, likely readonly/prefilled
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Reminder Title"
          placeholderTextColor={COLORS.textLight}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter Description"
          placeholderTextColor={COLORS.textLight}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Date (DD-MM-YYYY) <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity onPress={() => setShowCalendar(true)}>
          <View pointerEvents="none">
            <TextInput
              style={styles.input}
              value={date}
              placeholder="Select Date"
              placeholderTextColor={COLORS.textLight}
              editable={false}
            />
          </View>
          <Feather
            name="calendar"
            size={20}
            color={COLORS.textLight}
            style={styles.calendarIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
        <GradientButton
          title="Submit"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </View>

      {renderCalendarModal()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.m },
  formGroup: { marginBottom: SPACING.l },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: COLORS.text,
  },
  calendarIcon: { position: 'absolute', right: 12, top: 12 },
  textArea: { height: 100 },
  buttonRow: { flexDirection: 'row', gap: SPACING.m, marginTop: SPACING.m },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: { color: COLORS.textLight, fontWeight: 'bold' },
  submitButton: { flex: 1 },

  // Calendar Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.m,
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: SPACING.m,
    ...SHADOWS.medium,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  monthTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.s,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    color: COLORS.textLight,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  activeDayCell: { backgroundColor: '#F3F4F6', borderRadius: 20 },
  dayText: { color: COLORS.text },
  closeButton: { marginTop: SPACING.m, alignSelf: 'center', padding: 10 },
  closeButtonText: { color: COLORS.primary, fontWeight: 'bold' },
});

export default AddReminderScreen;
