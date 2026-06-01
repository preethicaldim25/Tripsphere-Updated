import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds match backend cooldown

export default function VerifyOTPScreen() {
  const { email: rawEmail } = useLocalSearchParams<{ email: string }>();
  const email = rawEmail ? decodeURIComponent(rawEmail) : '';

  const { verifyOtp, resendOtp } = useAuth();

  // OTP digits state
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Refs for input focus management
  const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(cardSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    // Auto-focus first input
    setTimeout(() => inputRefs.current[0]?.focus(), 400);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerSuccess = () => {
    Animated.parallel([
      Animated.spring(successScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleChangeText = (text: string, index: number) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      // Backspace — clear current and go back
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }

    // Handle paste — fill all boxes
    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { newOtp[i] = d; });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      setError('');
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleaned;
    setOtp(newOtp);
    setError('');

    // Move to next input
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit code');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    const result = await verifyOtp(email, code);

    if (result.success) {
      setVerified(true);
      triggerSuccess();
      // Navigate after success animation - Requirement: Redirect to login screen
      setTimeout(() => router.replace('/auth/login'), 2000);
    } else {
      setError(result.error || 'Invalid OTP. Please try again.');
      triggerShake();
      // Clear inputs on wrong OTP
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    const result = await resendOtp(email);

    setResendLoading(false);
    if (result.success) {
      setResendSuccess(true);
      setResendCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setTimeout(() => setResendSuccess(false), 3000);
    } else {
      setError(result.error || 'Failed to resend OTP');
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.max(2, b.length)) + c)
    : '';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#2D0065', '#6B4EFF', '#C84BFF', '#FF6BCC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative orbs */}
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* Header */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.iconWrapper}>
              <LinearGradient
                colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                style={styles.iconCircle}
              >
                <Ionicons name="mail-unread-outline" size={42} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to
            </Text>
            <Text style={styles.emailText}>{maskedEmail}</Text>

            {/* Card */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateY: cardSlide }, { translateX: shakeAnim }] }
              ]}
            >
              {verified ? (
                /* Success State */
                <Animated.View
                  style={[styles.successContainer, { opacity: successOpacity, transform: [{ scale: successScale }] }]}
                >
                  <LinearGradient
                    colors={['#6B4EFF', '#C84BFF']}
                    style={styles.successCircle}
                  >
                    <Ionicons name="checkmark" size={48} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.successTitle}>Verified!</Text>
                  <Text style={styles.successText}>Registration successful.{"\n"}Please login. 🎉</Text>
                </Animated.View>
              ) : (
                <>
                  <Text style={styles.cardLabel}>Enter verification code</Text>

                  {/* OTP Boxes */}
                  <View style={styles.otpRow}>
                    {Array(OTP_LENGTH).fill(0).map((_, i) => (
                      <TextInput
                        key={i}
                        ref={(ref) => { inputRefs.current[i] = ref; }}
                        style={[
                          styles.otpBox,
                          otp[i] ? styles.otpBoxFilled : {},
                          error ? styles.otpBoxError : {},
                        ]}
                        value={otp[i]}
                        onChangeText={(text) => handleChangeText(text, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                        keyboardType="number-pad"
                        maxLength={OTP_LENGTH} // allows paste
                        selectTextOnFocus
                        caretHidden
                        testID={`otp-input-${i}`}
                      />
                    ))}
                  </View>

                  {/* Error message */}
                  {error ? (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle" size={15} color="#FF4B8C" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {/* Resend success */}
                  {resendSuccess ? (
                    <View style={styles.successRow}>
                      <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                      <Text style={styles.resendSuccessText}>New code sent to your email!</Text>
                    </View>
                  ) : null}

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[styles.verifyButton, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                    activeOpacity={0.85}
                    testID="verify-otp-button"
                  >
                    <LinearGradient
                      colors={['#6B4EFF', '#C84BFF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.verifyGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Text style={styles.verifyButtonText}>Verify & Continue</Text>
                          <Ionicons name="arrow-forward" size={18} color="#fff" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Resend OTP */}
                  <View style={styles.resendContainer}>
                    <TouchableOpacity
                      style={[
                        styles.resendButton,
                        (resendCooldown > 0 || resendLoading) && styles.resendButtonDisabled
                      ]}
                      onPress={handleResend}
                      disabled={resendCooldown > 0 || resendLoading}
                      testID="resend-otp-button"
                    >
                      {resendLoading ? (
                        <ActivityIndicator size="small" color="#6B4EFF" />
                      ) : (
                        <Text style={[
                          styles.resendLink,
                          resendCooldown > 0 && styles.resendTextDisabled
                        ]}>
                          {resendCooldown > 0 
                            ? `Resend OTP in ${resendCooldown}s` 
                            : "Resend OTP"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Expiry note */}
                  <View style={styles.noteRow}>
                    <Ionicons name="time-outline" size={13} color="#9CA3AF" />
                    <Text style={styles.noteText}>Code expires in 5 minutes</Text>
                  </View>
                </>
              )}
            </Animated.View>
          </Animated.View>
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
  orb1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(200, 75, 255, 0.18)',
    top: -80,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(107, 78, 255, 0.25)',
    bottom: 100,
    left: -60,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 40,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    marginBottom: 20,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#E8D5FF',
    marginBottom: 32,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 25,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 18,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  otpBoxFilled: {
    borderColor: '#6B4EFF',
    backgroundColor: '#F5F3FF',
    color: '#6B4EFF',
  },
  otpBoxError: {
    borderColor: '#FF4B8C',
    backgroundColor: '#FFF0F5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#FF4B8C',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  resendSuccessText: {
    color: '#22C55E',
    fontSize: 13,
    fontWeight: '500',
  },
  verifyButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  verifyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resendContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6B4EFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  resendButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  resendLink: {
    color: '#6B4EFF',
    fontSize: 15,
    fontWeight: '700',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
    fontWeight: '600',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    justifyContent: 'center',
  },
  noteText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#6B4EFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
