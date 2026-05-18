import { StyleSheet, Text, View } from 'react-native';

export default function JsonCard({ item }) {
  return (
    <View style={styles.dataCard}>
      <Text style={styles.dataText}>{JSON.stringify(item, null, 2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dataCard: {
    borderRadius: 12,
    backgroundColor: '#0b1e2d',
    padding: 10,
  },
  dataText: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
});
