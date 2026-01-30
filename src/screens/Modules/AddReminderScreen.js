import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { COLORS, SPACING, SHADOWS, FONTS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import Feather from 'react-native-vector-icons/Feather';

const AddReminderScreen = ({ navigation, route }) => {
  const { organizationId } = route.params;
  const initialAssetCode = route.params?.assetCode || '';
  const assetId = route.params?.assetId;

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
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCalendar(false)}
        >
          <Pressable
            style={styles.calendarContainer}
            onPress={e => e.stopPropagation()}
          >
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

            <Button
              title="Close"
              variant="ghost"
              onPress={() => setShowCalendar(false)}
              style={{ marginTop: SPACING.m }}
            />
          </Pressable>
        </Pressable>
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
        <Input
          label="Asset Code"
          value={assetCode}
          onChangeText={setAssetCode}
          placeholder="Enter Asset Code"
          editable={!assetId}
          required
        />
      </View>

      <View style={styles.formGroup}>
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Reminder Title"
          required
        />
      </View>

      <View style={styles.formGroup}>
        <Input
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter Description"
          area
          style={styles.textArea}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>
          Date (DD-MM-YYYY) <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.8}
        >
          <View pointerEvents="none">
            <Input
              value={date}
              placeholder="Select Date"
              editable={false}
              icon="calendar"
            />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <Button
          title="Reset"
          variant="secondary"
          onPress={handleReset}
          style={{ flex: 1 }}
        />
        <Button
          title="Submit"
          variant="primary"
          onPress={handleSubmit}
          loading={loading}
          style={{ flex: 1 }}
        />
      </View>

      {renderCalendarModal()}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.m },
  formGroup: { marginBottom: SPACING.s },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: FONTS.semiBold,
  },
  required: { color: COLORS.error },
  textArea: { height: 100 },
  buttonRow: { flexDirection: 'row', gap: SPACING.m, marginTop: SPACING.l },

  // Calendar Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Slate 900 70%
    justifyContent: 'center',
    padding: SPACING.m,
  },
  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: SPACING.l,
    ...SHADOWS.hard,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
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
    fontFamily: FONTS.medium,
  },
  dayCell: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  activeDayCell: {
    backgroundColor: COLORS.primary + '20', // Opacity
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: { color: COLORS.text, fontFamily: FONTS.medium },
});

export default AddReminderScreen;
