import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import GlassCard from '../premium/GlassCard';

const ActionCard = ({
  title,
  description,
  icon,
  color,
  iconColor = 'black',
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <GlassCard style={styles.optionCard}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Image
          source={icon}
          style={[styles.iconImage, { tintColor: iconColor }]}
        />
      </View>
      <View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{description}</Text>
      </View>
    </GlassCard>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16, // Softer corners
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  iconImage: {
    width: 60, // Adjusted for better fit
    height: 60,
    resizeMode: 'contain',
    // tintColor moved to inline style
  },
  optionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  optionDesc: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
});

export default ActionCard;
