import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { jobLabel, jobTone } from './lib/backupSelectors';

export default function BackupStatusBanner({ job }) {
  if (!job || job.status === 'idle') return null;
  const tone = jobTone(job.status);
  return (
    <View style={[styles.banner, styles[tone] || styles.neutral]}>
      <Text style={styles.label}>{jobLabel(job.status)}</Text>
      {job.progress > 0 && job.progress < 1 ? (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(job.progress * 100)}%` }]} />
        </View>
      ) : null}
      {job.error ? <Text style={styles.err}>{job.error}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  banner: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
  neutral: { backgroundColor: '#F5F5F4', borderColor: '#E7E5E4' },
  info: { backgroundColor: '#F2F9FC', borderColor: '#A8D5E5' },
  success: { backgroundColor: '#F4FBF8', borderColor: '#B8E0D2' },
  danger: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  warning: { backgroundColor: '#FFF9F2', borderColor: '#F5D0A9' },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  track: { height: 4, backgroundColor: '#E7E5E4', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: '#C93862' },
  err: { fontSize: 12, color: '#B91C1C', marginTop: 6 },
});
