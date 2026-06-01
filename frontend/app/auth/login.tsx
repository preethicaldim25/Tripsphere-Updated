import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
  <View style={styles.requirementItem}>
    <Ionicons 
      name={met ? "checkmark-circle" : "ellipse-outline"} 
      size={14} 
      color={met ? "#00C851" : "#A0A0A0"} 
    />
    <Text style={[styles.requirementText, { color: met ? "#00C851" : "#A0A0A0" }]}>
      {text}
    </Text>
  </View>
);

export default function AuthScreen({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const { login, register } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const checkPasswordStrength = (pass: string) => {
    const requirements = {
      length: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    };
    setPasswordRequirements(requirements);

    let strength = 0;
    if (requirements.length) strength += 1;
    if (requirements.upper) strength += 1;
    if (requirements.lower) strength += 1;
    if (requirements.number) strength += 1;
    if (requirements.special) strength += 1;
    
    setPasswordStrength(strength);
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (!isLogin) {
      checkPasswordStrength(text);
    }
  };

  const toggleAuthMode = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsLogin(!isLogin);
      // Reset validation states
      if (isLogin) {
        checkPasswordStrength(password);
      }
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAuth = async () => {
    // Validation
    const trimmedIdentifier = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedIdentifier || !trimmedPassword || (!isLogin && !trimmedName)) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (!isLogin) {
      if (!validateEmail(trimmedIdentifier)) {
        Alert.alert('Error', 'Please enter a valid email address');
        return;
      }

      if (passwordStrength < 5) {
        Alert.alert('Weak Password', 'Password must contain uppercase, lowercase, number and special character (min 8 chars).');
        return;
      }

      if (trimmedPassword !== confirmPassword.trim()) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(trimmedIdentifier, trimmedPassword);
        if (result.success) {
          router.replace('/(tabs)');
        } else if (result.needsVerification) {
          // User registered but hasn't verified — redirect to OTP screen
          Alert.alert('Verification Required', 'Please verify your email before login.');
          router.push(`/auth/verify-otp?email=${encodeURIComponent(trimmedIdentifier)}`);
        } else {
          Alert.alert('Login Failed', result.error || 'Invalid email/username or password');
        }
      } else {
        const result = await register(trimmedName, trimmedIdentifier, trimmedPassword);
        if (result.success) {
          if (result.message) {
            Alert.alert('Pending Verification', result.message);
          }
          // New user or pending user — go to OTP verification screen
          router.push(`/auth/verify-otp?email=${encodeURIComponent(trimmedIdentifier)}`);
        } else {
          Alert.alert('Registration Failed', result.error || 'Could not create account');
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message || 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return '#FF4D4D';
    if (passwordStrength <= 4) return '#FFAD33';
    return '#00C851';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 4) return 'Medium';
    return 'Strong';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#6B4EFF', '#8E70FF', '#F5F3FF']}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Ionicons name="compass" size={60} color="#6B4EFF" />
            </View>
            <Text style={styles.appName}>Tripsphere</Text>
            <Text style={styles.tagline}>Explore Tamil Nadu like never before</Text>
          </View>

          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
            <Text style={styles.formSubtitle}>
              {isLogin ? 'Sign in to continue your journey' : 'Join our community of travelers'}
            </Text>

            <View style={styles.form}>
              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#6B4EFF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#6B4EFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={isLogin ? "Email or Username" : "Email Address"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType={isLogin ? "default" : "email-address"}
                  autoCapitalize="none"
                  placeholderTextColor="#A0A0A0"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B4EFF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#A0A0A0"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B4EFF" />
                </TouchableOpacity>
              </View>

              {!isLogin && password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthHeader}>
                    <Text style={styles.strengthLabel}>Password Strength: </Text>
                    <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                      {getStrengthText()}
                    </Text>
                  </View>
                  <View style={styles.strengthBarContainer}>
                    <View 
                      style={[
                        styles.strengthBar, 
                        { 
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getStrengthColor() 
                        }
                      ]} 
                    />
                  </View>
                  
                  <View style={styles.requirementsGrid}>
                    <RequirementItem met={passwordRequirements.length} text="8+ Characters" />
                    <RequirementItem met={passwordRequirements.upper} text="Uppercase" />
                    <RequirementItem met={passwordRequirements.lower} text="Lowercase" />
                    <RequirementItem met={passwordRequirements.number} text="Number" />
                    <RequirementItem met={passwordRequirements.special} text="Special Char" />
                  </View>
                </View>
              )}

              {!isLogin && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={20} color="#6B4EFF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
              )}

              {isLogin && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <View style={styles.toggleContainer}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </Text>
                <TouchableOpacity onPress={toggleAuthMode}>
                  <Text style={styles.toggleLink}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          {isLogin && (
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Guest Access:</Text>
              <TouchableOpacity
                style={styles.demoButton}
                onPress={() => {
                  setEmail('test1@example.com');
                  setPassword('password123');
                }}
              >
                <Text style={styles.demoButtonText}>Use Demo Credentials</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#777',
    marginBottom: 25,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#6B4EFF',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  toggleText: {
    color: '#777',
    fontSize: 14,
  },
  toggleLink: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoContainer: {
    marginTop: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 20,
    width: '100%',
  },
  demoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  demoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  demoButtonText: {
    color: '#6B4EFF',
    fontSize: 13,
    fontWeight: '600',
  },
  strengthContainer: {
    marginTop: 10,
    marginBottom: 15,
    width: '100%',
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  strengthLabel: {
    fontSize: 12,
    color: '#666',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '700',
  },
  strengthBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    width: '100%',
    marginBottom: 8,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },
  requirementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  requirementText: {
    fontSize: 10,
    marginLeft: 4,
  },
});