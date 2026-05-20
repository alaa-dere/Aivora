import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';

const toNumber = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return n;
};

const formatMinutes = (value) => `${Math.round(toNumber(value))} min`;

const rankAccent = (rank) => {
  if (rank === 1) return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' };
  if (rank === 2) return { bg: '#e2e8f0', border: '#64748b', text: '#334155' };
  if (rank === 3) return { bg: '#ffedd5', border: '#ea580c', text: '#9a3412' };
  return { bg: '#dbeafe', border: '#2563eb', text: '#1d4ed8' };
};

export default function StudentLeaderboardView({ data, theme }) {
  const top = Array.isArray(data?.top) ? data.top : [];
  const current = data?.current || null;
  const totalStudents = toNumber(data?.totalStudents);
  const podium = top.slice(0, 3);
  const remaining = top.slice(3, 10);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 22 }]}>Leaderboard</Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
          Rank is based on study-time improvement (last 7 days vs previous 7 days).
        </Text>
      </View>

      {current ? (
        <View style={[portalStyles.listCard, { backgroundColor: '#ffedd5', borderColor: '#fb923c', gap: 8 }]}>
          <Text style={{ color: '#9a3412', fontWeight: '800', fontSize: 16 }}>Your Snapshot</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Text style={{ color: '#7c2d12', fontWeight: '700' }}>Position: #{toNumber(current.rank)}</Text>
            <Text style={{ color: '#7c2d12', fontWeight: '700' }}>
              Improvement: {toNumber(current.improvement) >= 0 ? '+' : ''}
              {toNumber(current.improvement)} min
            </Text>
            <Text style={{ color: '#7c2d12', fontWeight: '700' }}>Last 7 days: {formatMinutes(current.minutesLast7)}</Text>
            <Text style={{ color: '#7c2d12', fontWeight: '700' }}>Students: {totalStudents}</Text>
          </View>
        </View>
      ) : null}

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 10 }]}>
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Top Podium</Text>
        {podium.length === 0 ? (
          <Text style={portalStyles.empty}>No leaderboard data yet.</Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {podium.map((row) => {
              const accent = rankAccent(toNumber(row?.rank));
              return (
                <View
                  key={`podium-${row?.id}`}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: accent.border,
                    backgroundColor: accent.bg,
                    borderRadius: 12,
                    padding: 10,
                    minHeight: 140,
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: accent.text, fontWeight: '900', fontSize: 18 }}>#{toNumber(row?.rank)}</Text>
                    <Text numberOfLines={1} style={{ color: '#0f172a', fontWeight: '700' }}>{String(row?.fullName || 'Student')}</Text>
                  </View>
                  <View style={{ alignItems: 'center', gap: 3 }}>
                    <Text style={{ color: '#334155', fontWeight: '700' }}>
                      {toNumber(row?.improvement) >= 0 ? '+' : ''}
                      {toNumber(row?.improvement)} min
                    </Text>
                    <Text style={{ color: '#475569', fontSize: 12 }}>{formatMinutes(row?.minutesLast7)}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Top 10</Text>
        {remaining.length === 0 ? <Text style={portalStyles.empty}>No additional ranked students yet.</Text> : null}
        {remaining.map((row, idx) => {
          const rank = toNumber(row?.rank);
          const isCurrent = String(current?.id || '') === String(row?.id || '');
          return (
            <View
              key={`rank-${row?.id || idx}`}
              style={{
                borderWidth: 1,
                borderColor: isCurrent ? '#60a5fa' : '#dbe4ef',
                borderRadius: 10,
                padding: 10,
                backgroundColor: isCurrent ? '#eff6ff' : '#ffffff',
                gap: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#0f172a', fontWeight: '800' }}>#{rank} {String(row?.fullName || 'Student')}</Text>
                <MaterialCommunityIcons name="crown" size={16} color={rank <= 3 ? '#f59e0b' : '#64748b'} />
              </View>
              <Text style={{ color: '#334155' }}>
                Improvement: {toNumber(row?.improvement) >= 0 ? '+' : ''}
                {toNumber(row?.improvement)} min
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                Last 7d: {formatMinutes(row?.minutesLast7)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
