import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';
import { toImageSource } from '../../services/api-client';
import { Image } from 'react-native';

export default function StudentCourseDetailView({
  data,
  theme,
  apiFetch,
  onBack = () => {},
  onEnrollSuccess = () => {},
}) {
  const course = useMemo(() => data?.course || data || {}, [data]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('card');
  const [countryMenuOpen, setCountryMenuOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    country: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    paypalEmail: '',
    paypalTxnId: '',
  });

  const courseId = String(course?.id || '').trim();
  const enrolled = Boolean(course?.enrolled);
  const countryOptions = [
    'Palestine',
    'Jordan',
    'Egypt',
    'Saudi Arabia',
    'United Arab Emirates',
    'Qatar',
    'Kuwait',
    'Oman',
    'Bahrain',
    'Iraq',
    'Lebanon',
    'Syria',
    'Morocco',
    'Algeria',
    'Tunisia',
    'United States',
    'United Kingdom',
    'Germany',
    'France',
    'Canada',
    'Australia',
  ];

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const response = await apiFetch('/api/profile/me', { method: 'GET' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !mounted) return;
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || String(payload?.user?.fullName || ''),
          email: prev.email || String(payload?.user?.email || ''),
        }));
      } catch {
        // no-op
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, [apiFetch]);

  const submitEnroll = async () => {
    if (!courseId || submitting) return;
    if (!form.fullName.trim() || !form.email.trim() || !form.country.trim()) {
      setError('Please fill full name, email, and country.');
      return;
    }
    const cardLast4 = String(form.cardNumber || '').replace(/\D/g, '').slice(-4) || null;
    if (method === 'card') {
      if (!cardLast4 || !String(form.expiry || '').trim() || !String(form.cvc || '').trim()) {
        setError('Please enter valid card details.');
        return;
      }
    } else {
      if (!String(form.paypalEmail || '').trim() || !String(form.paypalTxnId || '').trim()) {
        setError('Please enter PayPal details.');
        return;
      }
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await apiFetch(`/api/student/courses/${encodeURIComponent(courseId)}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentConfirmed: true,
          method,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          country: form.country.trim(),
          cardLast4: method === 'card' ? cardLast4 : null,
          paypalEmail: method === 'paypal' ? form.paypalEmail.trim() : null,
          paypalTxnId: method === 'paypal' ? form.paypalTxnId.trim() : null,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.message || 'Enrollment failed');
      onEnrollSuccess(course);
    } catch (err) {
      setError(String(err?.message || 'Enrollment failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const imageSource = toImageSource(String(course?.imageUrl || ''), require('../../../assets/p7.png'));

  return (
    <ScrollView style={portalStyles.dataWrap} contentContainerStyle={portalStyles.dataContent}>
      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 10 }]}>
        <Pressable
          onPress={onBack}
          style={[portalStyles.secondaryBtn, { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 8 }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textPrimary} />
        </Pressable>

        <Image source={imageSource} resizeMode="cover" style={{ width: '100%', height: 180, borderRadius: 12 }} />
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 22 }]}>{course?.title || 'Course'}</Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>By {course?.teacherName || 'Unknown teacher'}</Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary }]}>
          {String(course?.description || 'No description yet.')}
        </Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
          ${Number(course?.price || 0)} • {Math.max(1, Number(course?.durationWeeks || 0))} week(s)
        </Text>

        {enrolled ? (
          <Pressable onPress={() => onEnrollSuccess(course)} style={portalStyles.chatSendBtn}>
            <Text style={portalStyles.chatSendText}>Open Full Course</Text>
          </Pressable>
        ) : (
          <View style={{ gap: 8, marginTop: 6 }}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Payment Information</Text>
            <TextInput
              value={form.fullName}
              onChangeText={(v) => setForm((p) => ({ ...p, fullName: v }))}
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              style={portalStyles.input}
            />
            <TextInput
              value={form.email}
              onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
              placeholder="Email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              style={portalStyles.input}
            />
            <View>
              <Pressable
                onPress={() => setCountryMenuOpen((prev) => !prev)}
                style={[
                  portalStyles.input,
                  {
                    minHeight: 44,
                    justifyContent: 'center',
                    borderColor: '#cbd5e1',
                    backgroundColor: '#ffffff',
                  },
                ]}
              >
                <Text style={{ color: form.country ? '#0f172a' : '#94a3b8' }}>
                  {form.country || 'Select country'}
                </Text>
              </Pressable>
              {countryMenuOpen ? (
                <View
                  style={{
                    marginTop: 6,
                    maxHeight: 180,
                    borderWidth: 1,
                    borderColor: '#dbe4ef',
                    borderRadius: 10,
                    backgroundColor: '#ffffff',
                    overflow: 'hidden',
                  }}
                >
                  <ScrollView nestedScrollEnabled>
                    {countryOptions.map((countryName) => (
                      <Pressable
                        key={countryName}
                        onPress={() => {
                          setForm((p) => ({ ...p, country: countryName }));
                          setCountryMenuOpen(false);
                        }}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          borderTopWidth: countryName === countryOptions[0] ? 0 : 1,
                          borderTopColor: '#eef2f7',
                          backgroundColor: form.country === countryName ? '#eff6ff' : '#ffffff',
                        }}
                      >
                        <Text style={{ color: '#0f172a' }}>{countryName}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setMethod('card')}
                style={[
                  portalStyles.secondaryBtn,
                  { flex: 1, borderColor: method === 'card' ? '#2563eb' : '#dbe4ef', borderWidth: 1 },
                ]}
              >
                <Text style={portalStyles.secondaryBtnText}>Card</Text>
              </Pressable>
              <Pressable
                onPress={() => setMethod('paypal')}
                style={[
                  portalStyles.secondaryBtn,
                  { flex: 1, borderColor: method === 'paypal' ? '#2563eb' : '#dbe4ef', borderWidth: 1 },
                ]}
              >
                <Text style={portalStyles.secondaryBtnText}>PayPal</Text>
              </Pressable>
            </View>

            {method === 'card' ? (
              <>
                <TextInput
                  value={form.cardNumber}
                  onChangeText={(v) => setForm((p) => ({ ...p, cardNumber: v }))}
                  placeholder="Card number"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  style={portalStyles.input}
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={form.expiry}
                    onChangeText={(v) => setForm((p) => ({ ...p, expiry: v }))}
                    placeholder="MM/YY"
                    placeholderTextColor="#94a3b8"
                    style={[portalStyles.input, { flex: 1 }]}
                  />
                  <TextInput
                    value={form.cvc}
                    onChangeText={(v) => setForm((p) => ({ ...p, cvc: v }))}
                    placeholder="CVC"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    style={[portalStyles.input, { flex: 1 }]}
                  />
                </View>
              </>
            ) : (
              <>
                <TextInput
                  value={form.paypalEmail}
                  onChangeText={(v) => setForm((p) => ({ ...p, paypalEmail: v }))}
                  placeholder="PayPal email"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={portalStyles.input}
                />
                <TextInput
                  value={form.paypalTxnId}
                  onChangeText={(v) => setForm((p) => ({ ...p, paypalTxnId: v }))}
                  placeholder="PayPal transaction ID"
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                />
              </>
            )}

            {error ? <Text style={portalStyles.error}>{error}</Text> : null}

            <Pressable onPress={submitEnroll} disabled={submitting} style={portalStyles.chatSendBtn}>
              <Text style={portalStyles.chatSendText}>{submitting ? 'Processing...' : 'Pay & Enroll'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
