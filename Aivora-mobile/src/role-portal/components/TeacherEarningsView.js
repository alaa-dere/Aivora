import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { API_ROUTES } from '@aivora/shared';
import { portalStyles } from '../styles';

const money = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
};

export default function TeacherEarningsView({ apiFetch, theme, onOpenMessages = () => {}, onOpenProfile = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({ totalRevenue: 0, monthRevenue: 0, grossSales: 0 });
  const [transactions, setTransactions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);

  const loadEarnings = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const profileRes = await apiFetch(API_ROUTES.teacher.profile, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData?.message || 'Failed to load profile');

      const teacherId = String(profileData?.teacher?.id || '').trim();
      if (!teacherId) throw new Error('Teacher profile is missing an ID');

      const statsRes = await apiFetch(`/api/teachers?id=${encodeURIComponent(teacherId)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const statsData = await statsRes.json();
      if (!statsRes.ok) throw new Error(statsData?.message || 'Failed to load earnings');

      setSummary({
        totalRevenue: Number(statsData?.stats?.totalRevenue || 0),
        monthRevenue: Number(statsData?.stats?.monthRevenue || 0),
        grossSales: Number(statsData?.stats?.grossSales || 0),
      });
      setTransactions(Array.isArray(statsData?.transactions) ? statsData.transactions : []);
      setVisibleCount(5);
    } catch (err) {
      setError(err?.message || 'Failed to load earnings');
      setSummary({ totalRevenue: 0, monthRevenue: 0, grossSales: 0 });
      setTransactions([]);
      setVisibleCount(5);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const statCards = useMemo(
    () => [
      { key: 'available', label: 'Available Balance', value: money(summary.totalRevenue), note: 'Ready for withdrawal request.' },
      { key: 'month', label: 'This Month', value: money(summary.monthRevenue), note: 'Revenue since month start.' },
      { key: 'gross', label: 'Gross Sales', value: money(summary.grossSales), note: 'Before platform share.' },
    ],
    [summary]
  );
  const visibleTransactions = useMemo(
    () => transactions.slice(0, visibleCount),
    [transactions, visibleCount]
  );
  const hasMoreTransactions = transactions.length > visibleCount;

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Earnings & Withdrawals</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Track your revenue, review payouts, and request withdrawals.
      </Text>

      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && error ? <Text style={portalStyles.error}>{error}</Text> : null}

      {!loading && !error ? (
        <>
          <View style={portalStyles.statsGrid}>
            {statCards.map((stat) => (
              <View key={stat.key} style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stat.value}</Text>
                <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>{stat.label}</Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, marginTop: 4 }]}>{stat.note}</Text>
              </View>
            ))}
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Recent Payouts</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Last 12 transactions</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {transactions.length === 0 ? <Text style={portalStyles.empty}>No transactions found yet.</Text> : null}
              {visibleTransactions.map((tx, idx) => (
                <View key={String(tx?.id || `tx-${idx}`)} style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                  <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{tx?.courseTitle || 'Course'}</Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    {tx?.studentName || 'Student'} | {formatDateTime(tx?.dateTime)}
                  </Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Status: {String(tx?.status || '-')}</Text>
                  <Text style={[portalStyles.listItemValue, { color: theme.textPrimary }]}>
                    {money(tx?.teacherShare || 0, tx?.currency || 'USD')}
                  </Text>
                </View>
              ))}
              {hasMoreTransactions ? (
                <Pressable onPress={() => setVisibleCount((prev) => prev + 5)} style={[portalStyles.secondaryBtn, { alignSelf: 'flex-start' }]}>
                  <Text style={portalStyles.secondaryBtnText}>Show more</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Withdraw Funds</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>1. Confirm your profile email and payout info.</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>2. Send admin a message with withdrawal amount.</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>3. Processing takes around 2-5 business days.</Text>
            <View style={[portalStyles.actionRow, { flexWrap: 'wrap' }]}>
              <Pressable onPress={onOpenMessages} style={[portalStyles.secondaryBtn, { backgroundColor: '#0d3b66', borderWidth: 1, borderColor: '#0b2f50' }]}>
                <Text style={[portalStyles.secondaryBtnText, { color: '#ffffff' }]}>Message Admin</Text>
              </Pressable>
              <Pressable onPress={onOpenProfile} style={portalStyles.secondaryBtn}>
                <Text style={portalStyles.secondaryBtnText}>Update Profile</Text>
              </Pressable>
              <Pressable onPress={loadEarnings} style={portalStyles.secondaryBtn}>
                <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
