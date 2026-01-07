import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { COLORS, SPACING, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { useToast } from '../../context/ToastContext';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import GlassCard from '../../components/premium/GlassCard';
import GradientButton from '../../components/premium/GradientButton';
import Feather from 'react-native-vector-icons/Feather';
import RazorpayCheckout from 'react-native-razorpay';
import Config from 'react-native-config';
import Loader from '../../components/common/Loader';

const { width } = Dimensions.get('window');

const InvoicesScreen = ({ route }) => {
  const { organizationId } = route.params || {};
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoices, setExpandedInvoices] = useState([]);
  const [payingId, setPayingId] = useState(null);

  const api = useApiService();
  const { showToast } = useToast();

  useEffect(() => {
    fetchInvoices();
  }, [organizationId]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.getInvoices(organizationId);
      if (response.data && response.data.success) {
        setInvoices(response.data.user_invoice || []);
      }
    } catch (e) {
      console.error(e);
      showToast('Network error. Failed to load invoices.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    if (!status) return COLORS.textLight;
    switch (status.toLowerCase()) {
      case 'paid':
        return '#10B981'; // Green
      case 'unpaid':
        return '#EF4444'; // Red
      case 'pending':
        return COLORS.secondary; // Orange/Gray
      case 'send':
      case 'sent':
        return '#10B981';
      case 'cancel':
      case 'canceled':
        return '#EF4444';
      case 'failed':
        return '#EF4444';
      default:
        return COLORS.textLight;
    }
  };

  const toggleInvoiceDetails = id => {
    setExpandedInvoices(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handlePayNow = async invoice => {
    if (payingId === invoice.id) return;
    setPayingId(invoice.id);

    try {
      const rawAmount = invoice.total_amount;
      const amount = parseFloat(rawAmount);

      if (isNaN(amount) || amount <= 0) {
        showToast('Invalid invoice amount', 'error');
        setPayingId(null);
        return;
      }

      const amountInPaise = Math.round(amount * 100);
      const rzpKey = Config.RZP_KEY;

      const options = {
        description: `Payment for Invoice ${invoice.invoice_number || ''}`,
        image: 'https://cdn.razorpay.com/logos/7XBG3hrjgFvwF5/large.png',
        currency: 'INR',
        key: rzpKey || 'rzp_test_1DP5mmOlF5G5ag',
        amount: amountInPaise,
        name: 'Bo-trak',
        prefill: {
          name: String(invoice.receiver?.contact_person || 'Customer'),
          email: String(invoice.sender?.organization?.email || ''),
          contact: String(invoice.sender?.organization?.phone || '').replace(
            /[^0-9]/g,
            '',
          ),
        },
        theme: { color: COLORS.primary },
      };

      RazorpayCheckout.open(options)
        .then(async data => {
          const result = await api.markInvoicePaid(organizationId, {
            invoice_id: invoice.id,
            transaction_number: data.razorpay_payment_id,
          });

          if (result.data?.success) {
            setInvoices(prev =>
              prev.map(inv =>
                inv.id === invoice.id
                  ? { ...inv, payment_status: 'paid' }
                  : inv,
              ),
            );
            showToast('Payment successful!', 'success');
          } else {
            showToast(
              'Payment recorded but verification failed on server.',
              'warning',
            );
            fetchInvoices();
          }
        })
        .catch(error => {
          console.log('Payment Error', error);
          showToast('Payment Cancelled or Failed', 'error');
        })
        .finally(() => setPayingId(null));
    } catch (error) {
      console.error(error);
      showToast('Payment initialization failed', 'error');
      setPayingId(null);
    }
  };

  const DetailRow = ({ label, value, valueColor }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor && { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );

  const renderInvoiceCard = ({ item: invoice }) => {
    const isExpanded = expandedInvoices.includes(invoice.id);
    const statusColor = getStatusColor(invoice.payment_status);
    const invoiceStatusColor = getStatusColor(invoice.invoice_status);

    return (
      <GlassCard style={styles.card}>
        <TouchableOpacity
          style={styles.header}
          onPress={() => toggleInvoiceDetails(invoice.id)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.invoiceDate}>
              {invoice.created_at
                ? new Date(invoice.created_at).toDateString()
                : 'Date N/A'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  borderColor: statusColor,
                  backgroundColor: statusColor + '15',
                },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: statusColor }]}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {invoice.payment_status?.toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textLight}
              style={{ marginLeft: 8 }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />

            <View style={styles.section}>
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.subLabel}>Sender</Text>
                  <Text style={styles.subValue}>
                    {invoice.sender?.name || '-'}
                  </Text>
                </View>
                <View style={styles.halfCol}>
                  <Text style={[styles.subLabel, { textAlign: 'right' }]}>
                    Receiver
                  </Text>
                  <Text style={[styles.subValue, { textAlign: 'right' }]}>
                    {invoice.receiver?.name || '-'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <DetailRow
                label="Plan"
                value={invoice.companypriceplans?.priceplan?.name || 'N/A'}
              />
              <DetailRow
                label="Period"
                value={`${invoice.plan_start_date} - ${invoice.plan_end_date}`}
              />
              <DetailRow
                label="Due Date"
                value={invoice.payment_due_date || '-'}
              />
              <DetailRow
                label="Status"
                value={
                  invoice.invoice_status?.charAt(0).toUpperCase() +
                    invoice.invoice_status?.slice(1) || 'Unknown'
                }
                valueColor={invoiceStatusColor}
              />
            </View>

            <View style={styles.amountBox}>
              <DetailRow
                label="Base Amount"
                value={`₹${parseFloat(invoice.amount || 0).toLocaleString()}`}
              />
              <DetailRow
                label="Discount"
                value={`- ₹${parseFloat(
                  invoice.discount || 0,
                ).toLocaleString()}`}
              />
              <DetailRow
                label="Tax (GST)"
                value={`₹${(
                  parseFloat(invoice.sgst || 0) + parseFloat(invoice.cgst || 0)
                ).toLocaleString()}`}
              />

              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>
                  ₹{parseFloat(invoice.total_amount || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {(invoice.payment_status?.toLowerCase() === 'pending' ||
              invoice.payment_status?.toLowerCase() === 'failed') &&
              invoice.invoice_status?.toLowerCase() !== 'cancel' && (
                <View style={styles.actionContainer}>
                  <GradientButton
                    title="Pay Now"
                    onPress={() => handlePayNow(invoice)}
                    loading={payingId === invoice.id}
                    icon={
                      <Feather
                        name="credit-card"
                        size={18}
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                    }
                  />
                </View>
              )}
          </View>
        )}
      </GlassCard>
    );
  };

  return (
    <ScreenWrapper title="Invoices" showMenu={true} scrollable={false}>
      {invoices.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Feather name="file-text" size={48} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No invoices found.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchInvoices}>
            <Text style={styles.retryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceCard}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            loading && <Loader visible={true} size="small" overlay={false} />
          }
        />
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  card: {
    marginBottom: SPACING.m,
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  invoiceDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  expandedContent: {
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.m,
  },
  section: {
    marginBottom: SPACING.m,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCol: {
    flex: 1,
  },
  subLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  subValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  amountBox: {
    backgroundColor: COLORS.background, // Slightly darker than surface
    padding: SPACING.m,
    borderRadius: 12,
    marginTop: SPACING.s,
  },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionContainer: {
    marginTop: SPACING.m,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  retryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default InvoicesScreen;
