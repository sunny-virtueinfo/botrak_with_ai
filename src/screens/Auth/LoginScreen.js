import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ImageBackground,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import GlassInput from '../../components/premium/GlassInput';
import GradientButton from '../../components/premium/GradientButton';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS, FONTS, SHADOWS } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { API_ENDPOINTS } from '../../api/endpoints';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('sunny19.virtueinfo@gmail.com');
  const [password, setPassword] = useState('Sunny2002@');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useToast();
  const api = useApiService();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    setLoading(true);
    try {
      // 1. ApiService Call
      const response = await api.login(email, password);
      if (response.data.success) {
        const { user } = response.data;
        const token = user.authentication_token;

        // 2. Set Token manually
        client.defaults.headers.token = token;

        // 3. Fetch Organizations and Auto-Select First
        try {
          // Use client directly to pass the new token specifically,
          // because api.getMyOrganizations uses the old (null) user from context
          const orgResponse = await client.get(API_ENDPOINTS.MY_ORGANIZATIONS, {
            headers: { token: token },
          });

          if (
            orgResponse.data &&
            orgResponse.data.my_organizations &&
            orgResponse.data.my_organizations.length > 0
          ) {
            const orgs = orgResponse.data.my_organizations;

            // Auto Select Logic: Find first org with active plan
            let targetOrg = orgs.find(
              o => o.is_plan_active === true || o.is_plan_active === 1,
            );

            // Fallback to first one
            if (!targetOrg) {
              targetOrg = orgs[0];
            }

            const firstOrg = {
              organization_id: targetOrg.organization_id, // Ensure correct ID key
              name: targetOrg.organization_name,
              role: targetOrg.role,
              is_plan_active: targetOrg.is_plan_active,
            };

            // Save active org to storage
            await require('@react-native-async-storage/async-storage').default.setItem(
              'active_org',
              JSON.stringify(firstOrg),
            );
          }
        } catch (orgError) {
          console.log('Org Fetch Warning', orgError);
        }

        // 4. Set Token in Context
        await login(user, token);
      } else {
        console.log('response.data', response.data);
        showToast(response.data.error || 'Invalid credentials', 'error');
      }
    } catch (error) {
      console.error('Login Error', error);
      const msg = error.response?.data?.error || 'Network Error';
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
        colors={['#0F172A', '#1E293B', '#334155']} // Dark slate premium background
        style={StyleSheet.absoluteFillObject}
      />

      {/* Abstract Shapes for Depth */}
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
        <Animatable.View
          animation="fadeInDown"
          duration={1200}
          style={styles.headerContainer}
        >
          <Text style={styles.logoText}>BoTrak</Text>
          <Text style={styles.subtitle}>Enter your workspace</Text>
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
          <GlassInput
            icon="lock"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={{ height: 20 }} />

          <GradientButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animatable.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.5,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 16,
    color: '#E2E8F0',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Glass Effect
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...SHADOWS.medium,
  },
  button: {
    marginTop: 10,
    borderRadius: 12,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 20,
  },
  forgotPassword: {
    textAlign: 'center',
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 14,
  },
  circle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});

export default LoginScreen;
