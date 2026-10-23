import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { QuoteReaderScreen } from '@/features/vendors/QuoteReaderScreen';

export default function QuoteReaderRoute() {
  const { vendor } = useLocalSearchParams();
  return <QuoteReaderScreen vendorId={vendor ? String(vendor) : null} />;
}
