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

  const contacts = useMemo(() => {
    const weddingVendors = wedding?.id
      ? vendors.filter((vendor) => vendor.weddingId === wedding.id)
      : vendors;
    const withContactDetails = weddingVendors.filter(hasContactDetails);
    return sortContacts(
      searchContacts(
        withContactDetails.filter((vendor) => matchesContactFilter(vendor, filter)),
        query
      )
    );
  }, [filter, query, vendors, wedding?.id]);

  return { contacts, wedding };
}
