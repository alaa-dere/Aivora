import { Pressable, Text, View } from 'react-native';
import { portalStyles } from '../styles';

const toMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

export default function StudentWalletView({
  data,
  theme,
  localBalance = 0,
  onTopUp = () => {},
}) {
  const apiBalance = Number(data?.balance || 0);
  const totalSpent = Number(data?.totalSpent || 0);
  const balance = apiBalance + Number(localBalance || 0);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Wallet & Payments</Text>
      </View>
      <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
        Review your balance and payment summary.
      </Text>

      <View style={portalStyles.statsGrid}>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{toMoney(balance)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Balance</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{toMoney(totalSpent)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Spent</Text>
        </View>
      </View>

      <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
        <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Quick Actions</Text>
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
          Demo top-up is local to this session.
        </Text>
        <View style={portalStyles.actionRow}>
          <Pressable onPress={() => onTopUp(10)} style={portalStyles.secondaryBtn}>
            <Text style={portalStyles.secondaryBtnText}>Top up $10</Text>
          </Pressable>
          <Pressable onPress={() => onTopUp(25)} style={portalStyles.secondaryBtn}>
            <Text style={portalStyles.secondaryBtnText}>Top up $25</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
