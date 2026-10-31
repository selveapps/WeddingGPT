import React, { useMemo } from 'react';

import { Card, ListRow, SectionHeader, Stack } from '@/design-system/components';
import { appointmentLabel, appointmentWhen, upcomingAppointments } from '@/models';
import { formatMediumDate } from '@/lib/date';

/** The next few appointments across every vendor (slice H1); tap one to open its vendor. */
export function UpcomingAppointments({ vendors, onPress, limit = 3 }) {
  const appointments = useMemo(() => upcomingAppointments(vendors, { limit }), [vendors, limit]);
  if (!appointments.length) return null;

  return (
    <Stack gap="sm">
      <SectionHeader title="Coming up" />
      <Card padding="none">
        {appointments.map((appointment) => (
          <ListRow
            key={appointment.key}
            title={`${appointmentLabel(appointment)} - ${appointment.vendorName}`}
            subtitle={[appointmentWhen(appointment, formatMediumDate), appointment.place]
              .filter(Boolean)
              .join(' · ')}
            onPress={() => onPress?.(appointment)}
          />
        ))}
      </Card>
    </Stack>
  );
}

export default UpcomingAppointments;
