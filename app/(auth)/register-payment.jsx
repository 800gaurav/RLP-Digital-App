import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { brandLogo } from '../../constants/brandAssets';
import { FontFamily } from '../../constants/typography';
import { register } from '../../services/auth.service';
import { logApiError } from '../../services/api';
import { getRegistrationPaymentStatus, initiateRegistrationPayment } from '../../services/payment.service';
import {
  clearPendingRegistration,
  getPendingRegistration,
} from '../../services/pendingRegistration';
import { getSubscriptionPlan } from '../../services/poster.service';
import { useAuthStore } from '../../store/auth.store';
import { safeReplace } from '../../services/navigation';

const PARTY_NAME = 'Rashtriya Loktantrik Party';

export default function RegisterPaymentScreen() {
  const queryClient = useQueryClient();
  const setLoading = useAuthStore((state) => state.setLoading);
  const [pending] = useState(() => getPendingRegistration());
  const [subscriptionAmount, setSubscriptionAmount] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState('');
  const [paymentStarted, setPaymentStarted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [credentialsModal, setCredentialsModal] = useState(null);
  const canPay = useMemo(() => Number.isFinite(Number(subscriptionAmount)) && Number(subscriptionAmount) > 0, [subscriptionAmount]);

  useEffect(() => {
    if (!pending) {
      Alert.alert('Registration details missing', 'Kripya registration form dobara fill karein.');
      safeReplace('/(auth)/register');
    }
  }, [pending]);

  useEffect(() => {
    let mounted = true;
    async function loadPlan() {
      try {
        const plan = await getSubscriptionPlan();
        const nextAmount = Number(plan?.price);
        if (mounted && Number.isFinite(nextAmount) && nextAmount > 0) {
          setSubscriptionAmount(nextAmount);
        }
      } catch (error) {
        logApiError(error, 'Subscription plan fetch failed');
        if (mounted) setPlanError('Subscription amount load nahi ho paaya. Backend check karke dobara try karein.');
      } finally {
        if (mounted) setLoadingPlan(false);
      }
    }
    loadPlan();
    return () => { mounted = false; };
  }, []);

  async function createRegistrationIfNeeded() {
    if (registeredUser) return registeredUser;
    if (!pending?.payload) throw new Error('Registration details missing');
    try {
      const response = await register(pending.payload);
      const nextUser = response.user;
      setRegisteredUser(nextUser);
      return nextUser;
    } catch (error) {
      if (error?.response?.status !== 409) throw error;
      return {
        fullName: pending.payload.fullName,
        mobileNumber: pending.payload.mobileNumber,
        voterId: pending.payload.voterId,
      };
    }
  }

  function showSuccessModal(user) {
    queryClient.clear();
    clearPendingRegistration();
    setCredentialsModal({
      userId: user?.voterId || pending.credentials?.userId,
      mobileNumber: user?.mobileNumber || pending.credentials?.mobileNumber,
      password: pending.credentials?.password,
    });
  }

  async function checkPaymentStatus({ silent = false } = {}) {
    if (!pending?.payload) return;
    setIsChecking(true);
    try {
      const status = await getRegistrationPaymentStatus({
        client_txn_id: transactionId,
        mobileNumber: pending.payload.mobileNumber,
        voterId: pending.payload.voterId,
      });
      if (status.paymentStatus === 'approved') {
        showSuccessModal(status.user);
        return;
      }
      if (!silent) {
        Alert.alert('Payment pending', 'Payment success callback abhi backend ko nahi mila. 10-20 seconds baad dobara check karein.');
      }
    } catch (error) {
      if (!error?.response) logApiError(error, 'Payment status check failed');
      if (!silent) Alert.alert('Status check failed', 'Payment status check nahi ho paaya. Backend/public callback URL check karein.');
    } finally {
      setIsChecking(false);
    }
  }

  async function payNow() {
    if (!canPay) {
      Alert.alert('Amount missing', 'Subscription amount admin settings se load nahi hua.');
      return;
    }
    setIsCreating(true);
    setLoading(true);
    try {
      const user = await createRegistrationIfNeeded();
      const payment = await initiateRegistrationPayment({
        mobileNumber: user.mobileNumber || pending.payload.mobileNumber,
        voterId: user.voterId || pending.payload.voterId,
        amount: subscriptionAmount,
      });
      if (payment.alreadyPaid) {
        showSuccessModal(payment.user);
        return;
      }
      const nextPaymentLink = payment.payment_url || payment.upi_url || payment.gateway?.data?.payment_url || payment.gateway?.data?.upi_url;
      setTransactionId(payment.client_txn_id || '');
      setPaymentLink(nextPaymentLink || '');
      setPaymentStarted(true);
      if (!nextPaymentLink) {
        Alert.alert('Payment link missing', 'Gateway ne payment URL return nahi kiya. Backend response check karein.');
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = nextPaymentLink;
        return;
      }
      await Linking.openURL(nextPaymentLink);
    } catch (error) {
      if (!error?.response) logApiError(error, 'Register after UPI payment failed');
      Alert.alert(
        'Payment start failed',
        'Registration/payment start nahi ho paaya. Backend gateway settings aur public callback URL check karein.',
      );
    } finally {
      setIsCreating(false);
      setLoading(false);
    }
  }

  if (!pending) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.card}>
          <View style={styles.logoBadge}>
            <Image source={brandLogo} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Register karne ke liye subscription payment karein</Text>
          <Text style={styles.subtitle}>Payment UPI app me open hoga. Payment success callback ke baad login enable hoga.</Text>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Subscription Amount</Text>
            {loadingPlan ? (
              <ActivityIndicator color={Colors.rlpGreen} style={styles.amountLoader} />
            ) : planError ? (
              <Text style={styles.amountError}>{planError}</Text>
            ) : (
              <Text style={styles.amountValue}>₹{subscriptionAmount}</Text>
            )}
            <Text style={styles.partyName}>{PARTY_NAME}</Text>
          </View>

          <TouchableOpacity style={[styles.payButton, (isCreating || loadingPlan || !canPay) && styles.buttonDisabled]} onPress={payNow} activeOpacity={0.85} disabled={isCreating || loadingPlan || !canPay}>
            <Ionicons name="wallet" size={20} color={Colors.onSurface} />
            <Text style={styles.payButtonText}>{isCreating ? 'Starting...' : 'Subscribe & Pay'}</Text>
          </TouchableOpacity>

          {paymentStarted ? (
            <TouchableOpacity
              style={[styles.confirmButton, isCreating && styles.buttonDisabled]}
              onPress={() => checkPaymentStatus()}
              activeOpacity={0.85}
              disabled={isCreating || isChecking}
            >
              {isChecking ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>Check Payment Status</Text>
              )}
            </TouchableOpacity>
          ) : null}

          {paymentLink ? <Text style={styles.note}>Payment app se wapas aakar status check karein. Callback public URL par aate hi login enable ho jayega.</Text> : null}
        </View>
      </ScrollView>

      <Modal visible={Boolean(credentialsModal)} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <Image source={brandLogo} style={styles.modalLogo} resizeMode="contain" />
            </View>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalSubtitle}>Payment success ho gaya hai. Ab aap login kar sakte hain.</Text>

            <View style={styles.credentialBox}>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>User ID</Text>
                <Text style={styles.credentialValue}>{credentialsModal?.userId}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Mobile</Text>
                <Text style={styles.credentialValue}>{credentialsModal?.mobileNumber}</Text>
              </View>
              <View style={styles.credentialRow}>
                <Text style={styles.credentialLabel}>Password</Text>
                <Text style={styles.credentialValue}>{credentialsModal?.password}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.85}
              onPress={() => {
                if (!credentialsModal) return;
                const nextCredentials = credentialsModal;
                setCredentialsModal(null);
                safeReplace({
                  pathname: '/(auth)/login',
                  params: {
                    identifier: nextCredentials.mobileNumber,
                    password: nextCredentials.password,
                  },
                });
              }}
            >
              <Text style={styles.modalButtonText}>Login Screen Par Jayein</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.rlpGreen },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.rlpGreen },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.bold, fontSize: 20, color: Colors.white },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.rlpYellowLight,
  },
  logo: { width: 68, height: 68 },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: Colors.onSurface,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 18,
  },
  amountBox: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 18,
    alignItems: 'center',
    marginBottom: 18,
  },
  amountLabel: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.onSurfaceVariant },
  amountLoader: { marginTop: 16, marginBottom: 10 },
  amountError: { fontFamily: FontFamily.medium, fontSize: 13, color: Colors.error, textAlign: 'center', lineHeight: 18, marginTop: 12 },
  amountValue: { fontFamily: FontFamily.black, fontSize: 42, color: Colors.rlpGreen, marginTop: 4 },
  partyName: { fontFamily: FontFamily.semiBold, fontSize: 15, color: Colors.onSurface, textAlign: 'center', marginTop: 4 },
  payButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.rlpYellow,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 12,
  },
  payButtonText: { fontFamily: FontFamily.bold, fontSize: 16, color: Colors.onSurface },
  confirmButton: {
    width: '100%',
    backgroundColor: Colors.rlpGreen,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmButtonText: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.white },
  buttonDisabled: { opacity: 0.55 },
  note: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 28, 14, 0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  modalBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.rlpYellowLight,
  },
  modalLogo: { width: 56, height: 56 },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 24,
    color: Colors.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  credentialBox: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  credentialRow: { gap: 4 },
  credentialLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: Colors.rlpGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  credentialValue: { fontFamily: FontFamily.semiBold, fontSize: 16, color: Colors.onSurface },
  modalButton: {
    backgroundColor: Colors.rlpYellow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: { fontFamily: FontFamily.bold, fontSize: 15, color: Colors.onSurface },
});
