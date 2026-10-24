import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RentalBadge({ rental, returnDate }) {
  if (!rental) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        Rental{returnDate ? ` · return ${new Date(returnDate).toLocaleDateString()}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: '600', color: '#1E40AF' },
});
