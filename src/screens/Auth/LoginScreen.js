import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { COLORS, FONTS, SHADOWS, SPACING } from '../../theme';
import { useApiService } from '../../services/ApiService';
import { API_ENDPOINTS } from '../../api/endpoints';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('sunny19.virtueinfo@gmail.com');
  const [password, setPassword] = useState('Sunny2002@');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
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
      const response = await api.login(email, password);
      if (response.data.success) {
        const { user } = response.data;
        const token = user.authentication_token;

        client.defaults.headers.token = token;

        try {
          const orgResponse = await client.get(API_ENDPOINTS.MY_ORGANIZATIONS, {
            headers: { token: token },
          });

          if (
            orgResponse.data &&
            orgResponse.data.my_organizations &&
            orgResponse.data.my_organizations.length > 0
          ) {
            const orgs = orgResponse.data.my_organizations;

            let targetOrg = orgs.find(
              o =>
                o.organization_id == user.organization_id &&
                (o.is_plan_active === true || o.is_plan_active === 1),
            );

            if (!targetOrg) {
              targetOrg = orgs.find(
                o => o.is_plan_active === true || o.is_plan_active === 1,
              );
            }

            if (!targetOrg) {
              targetOrg = orgs[0];
            }

            const firstOrg = {
              organization_id: targetOrg.organization_id,
              name: targetOrg.organization_name,
              role: targetOrg.role,
              is_plan_active: targetOrg.is_plan_active,
            };

            await require('@react-native-async-storage/async-storage').default.setItem(
              'active_org',
              JSON.stringify(firstOrg),
            );
          }
        } catch (orgError) {
          console.log('Org Fetch Warning', orgError);
        }

        await login(user, token);
      } else {
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

      <LinearGradient
        colors={['#0F172A', '#1E293B']} // Dark premium background
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Circles */}
      <View
        style={[
          styles.circle,
          {
            top: -100,
            left: -50,
            backgroundColor: COLORS.primary,
            opacity: 0.15,
          },
        ]}
      />
      <View
        style={[
          styles.circle,
          {
            bottom: -50,
            right: -50,
            backgroundColor: COLORS.secondary,
            opacity: 0.1,
          },
        ]}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Animatable.View
          animation="fadeInDown"
          duration={1000}
          style={styles.headerContainer}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logoIcon}>B</Text>
          </View>
          <Text style={styles.logoText}>BoTrak</Text>
          <Text style={styles.subtitle}>Enterprise Asset Management</Text>
        </Animatable.View>

        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          delay={200}
          style={styles.card}
        >
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue</Text>
          </View>

          <Input
            icon="mail"
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 16 }}
            inputStyle={{ backgroundColor: COLORS.surface }} // Optimization for dark bg
          />
          <Input
            icon="lock"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            style={{ marginBottom: 24 }}
            inputStyle={{ backgroundColor: COLORS.surface }}
            rightIcon={secureTextEntry ? 'eye-off' : 'eye'}
            onRightIconPress={() => setSecureTextEntry(!secureTextEntry)}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="large"
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </Animatable.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Virtue Info. All rights reserved.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: SPACING.l },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.glow,
  },
  logoIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: FONTS.bold,
  },
  logoText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    fontFamily: FONTS.extraBold,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textPlaceholder,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // High opacity for clean look
    borderRadius: 30,
    padding: SPACING.xl,
    ...SHADOWS.hard,
  },
  welcomeContainer: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: FONTS.bold,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  button: {
    borderRadius: 16,
    marginTop: 8,
    ...SHADOWS.glow,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginTop: 24,
    padding: 8,
  },
  forgotPassword: {
    textAlign: 'center',
    color: COLORS.textLight,
    fontWeight: '600',
    fontSize: 14,
  },
  circle: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    opacity: 0.6,
  },
  footerText: {
    color: COLORS.textPlaceholder,
    fontSize: 12,
  },
});

export default LoginScreen;
