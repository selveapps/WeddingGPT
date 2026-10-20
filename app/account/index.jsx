import React from 'react';

import { Profile } from '@/features/profile';

/**
 * Account home - the couple's profile and workspace settings entry point.
 *
 * Feature UI lives in `src/features/profile`; this route file only mounts it
 * so the path table in `Routes.account` stays truthful.
 */
export default function AccountScreen() {
  return <Profile />;
}
