import { useMemo } from 'react';

import { selectWedding, useWeddingStore } from '@/store/weddingStore';
import { selectAllVendors, useVendorStore } from '@/store/vendorStore';

import {
  hasContactDetails,
  matchesContactFilter,
  searchContacts,
  sortContacts,
} from '../lib/contactHelpers';
import { ContactFilter } from '../lib/contactConstants';

export function useContacts({ filter = ContactFilter.ALL, query = '' } = {}) {
  const vendors = useVendorStore(selectAllVendors);
  const wedding = useWeddingStore(selectWedding);
  const weddingId = wedding?.id;

  const contacts = useMemo(() => {
    const weddingVendors = weddingId
      ? vendors.filter((vendor) => vendor.weddingId === weddingId)
      : vendors;
    const withContactDetails = weddingVendors.filter(hasContactDetails);
    return sortContacts(
      searchContacts(
        withContactDetails.filter((vendor) => matchesContactFilter(vendor, filter)),
        query
      )
    );
  }, [filter, query, vendors, weddingId]);

  return { contacts, wedding };
}
