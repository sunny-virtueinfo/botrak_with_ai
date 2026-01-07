import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import GlassInput from '../../components/premium/GlassInput';
import GradientButton from '../../components/premium/GradientButton';
import { useToast } from '../../context/ToastContext';
import { useApiService } from '../../services/ApiService';
import { COLORS, FONTS, SHADOWS } from '../../theme';
import Feather from 'react-native-vector-icons/Feather';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const api = useApiService();

  const handleReset = async () => {
    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.forgotPassword(email);
      if (response && (response.status === 200 || response.data?.success)) {
        showToast('Password reset instructions sent to your email', 'success');
        setTimeout(() => navigation.goBack(), 2000);
      } else {
        showToast(
          response.data?.message || 'Failed to send reset email',
          'error',
        );
      }
    } catch (error) {
      console.error('Forgot Password Error', error);
      const msg = error.response?.data?.message || 'Network Error';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* Background Graphic */}
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Abstract Shapes */}
      <View
        style={[
          styles.circle,
          { top: -100, left: -50, backgroundColor: '#38BDF8', opacity: 0.2 },
        ]}
      />
      <View
        style={[
          styles.circle,
          {
            bottom: -100,
            right: -50,
            backgroundColor: '#818CF8',
            opacity: 0.2,
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <Animatable.View
          animation="fadeInDown"
          duration={1200}
          style={styles.headerContainer}
        >
          <Text style={styles.logoText}>Recovery</Text>
          <Text style={styles.subtitle}>Enter email to reset password</Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          delay={300}
          style={styles.glassCard}
        >
          <GlassInput
            icon="mail"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={{ height: 20 }} />

          <GradientButton
            title="Send Reset Link"
            onPress={handleReset}
            loading={loading}
            style={styles.button}
          />
        </Animatable.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...SHADOWS.medium,
  },
  button: { marginTop: 10, borderRadius: 12 },
  circle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});

export default ForgotPasswordScreen;
