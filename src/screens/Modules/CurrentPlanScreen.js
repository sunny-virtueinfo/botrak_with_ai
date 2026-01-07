import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import GlassCard from '../../components/premium/GlassCard';
import GradientButton from '../../components/premium/GradientButton';
import ScreenWrapper from '../../components/common/ScreenWrapper';

const CurrentPlanScreen = ({ route, navigation }) => {
  const { organizationId } = route.params || {};
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApiService();
  const { showToast } = useToast();

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      if (!organizationId) return;
      const response = await api.getCurrentPlan(organizationId);
      if (response.data && response.data.success) {
        setPlan(response.data.user_plan);
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load plan details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPlan = () => {
    Alert.alert(
      'Cancel Plan',
      'Are you sure you want to cancel your current plan?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: confirmCancel },
      ],
    );
  };

  const confirmCancel = async () => {
    try {
      const res = await api.cancelCurrentPlan(organizationId, {
        company_price_plans_id: plan?.id,
      });
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Plan Cancelled Successfully', 'success');
        fetchPlan();
      } else {
        showToast(res.data?.message || 'Cancellation Failed', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('An error occurred', 'error');
    }
  };

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIconContainer}>
        <Feather name={icon} size={20} color={COLORS.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  if (loading)
    return (
      <ScreenWrapper title="Current Plan" showMenu={true}>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading Plan Details...</Text>
        </View>
      </ScreenWrapper>
    );

  if (!plan)
    return (
      <ScreenWrapper title="Current Plan" showMenu={true}>
        <View style={styles.centerContainer}>
          <GlassCard style={styles.emptyCard}>
            <Feather name="slash" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No Active Plan Found</Text>
            <Text style={styles.emptySubText}>
              Please subscribe to a plan to unlock features.
            </Text>
          </GlassCard>
        </View>
      </ScreenWrapper>
    );

  const isUnlimited = !plan.priceplan?.per_asset_price;
  const statusColor =
    plan.status === 'active' || plan.status === 'continue'
      ? COLORS.success
      : COLORS.error;

  return (
    <ScreenWrapper title="Current Plan" showMenu={true} scrollable={true}>
      <View style={styles.content}>
        {/* Header Card */}
        <GlassCard style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.planName}>
                {plan.priceplan?.name || 'Current Plan'}
              </Text>
              <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {plan.status?.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceAmount}>
                {isUnlimited ? '∞' : plan.priceplan.per_asset_price}
              </Text>
              <Text style={styles.perAsset}>
                {isUnlimited ? 'Unlimited' : '/ Asset'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Details Section */}
        <Text style={styles.sectionTitle}>Plan Details</Text>
        <GlassCard style={styles.detailsCard}>
          <DetailRow
            icon="calendar"
            label="Start Date"
            value={new Date(plan.start_date).toDateString()}
          />
          <View style={styles.separator} />

          <DetailRow
            icon="clock"
            label="End Date"
            value={new Date(plan.end_date).toDateString()}
          />
          <View style={styles.separator} />

          <DetailRow
            icon="repeat"
            label="Billing Frequency"
            value={plan.billing_frequency}
          />
          <View style={styles.separator} />

          <DetailRow
            icon="layers"
            label="Max Assets"
            value={plan.max_valid_asset}
          />
        </GlassCard>

        {/* Actions */}
        {plan.status !== 'cancel' && (
          <View style={styles.actionContainer}>
            <GradientButton
              title="Cancel Subscription"
              onPress={handleCancelPlan}
              colors={[COLORS.error, '#D32F2F']}
              icon={
                <Feather
                  name="x-circle"
                  size={20}
                  color="white"
                  style={{ marginRight: 8 }}
                />
              }
            />
            <Text style={styles.cancelDisclaimer}>
              Cancelling will stop future billing. You can continue using
              features until the end date.
            </Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.m },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.l,
  },
  loadingText: { color: COLORS.text, fontSize: 16, marginTop: 10 },

  // Header Card Styles
  headerCard: {
    padding: SPACING.l,
    marginBottom: SPACING.xl,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  currency: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: -4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.primary,
    fontFamily: FONTS.bold,
    lineHeight: 38,
  },
  perAsset: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
  },

  // Details Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.m,
    marginLeft: SPACING.xs,
  },
  detailsCard: {
    padding: 0, // Reset default padding for cleaner list look
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 70, 229, 0.08)', // Primary transparent
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 68, // Align with text start
  },

  // Action Styles
  actionContainer: {
    marginTop: SPACING.xxl,
  },
  cancelDisclaimer: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.m,
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    width: '100%',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.m,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.s,
  },
});

export default CurrentPlanScreen;
