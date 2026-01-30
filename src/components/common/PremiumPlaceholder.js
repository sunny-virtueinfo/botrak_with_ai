import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS, SPACING, FONTS } from '../../theme';
import GlassCard from '../premium/GlassCard';

const PremiumPlaceholder = ({ title, icon }) => {
  return (
    <LinearGradient colors={COLORS.gradients.surface} style={styles.container}>
      <View style={styles.content}>
        <GlassCard style={styles.card}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{title.charAt(0)}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            This premium module is currently under active development. Check
            back soon for updates!
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>COMING SOON</Text>
          </View>
        </GlassCard>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  card: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  iconText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  badge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
});

export default PremiumPlaceholder;
