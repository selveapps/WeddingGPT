/**
 * Day-of emergency / contingency plan — scenarios, owners, contacts, checklists.
 */

export const EMERGENCY_PLAN_KEY = 'tools:emergency-plan:v2';

export const ScenarioSeverity = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
});

export const DEFAULT_SCENARIOS = [
  {
    id: 'sc-weather',
    title: 'Bad weather',
    severity: ScenarioSeverity.HIGH,
    triggers: 'Rain, extreme heat, wind',
    plan: 'Move ceremony to indoor backup; notify guests via WhatsApp group; delay photos 30 min.',
    owner: 'Coordinator',
    contactRole: 'venue',
    checklist: [
      { id: 'w1', text: 'Confirm indoor backup space', done: false },
      { id: 'w2', text: 'Umbrellas / fans staged', done: false },
      { id: 'w3', text: 'Guest message template ready', done: false },
    ],
  },
  {
    id: 'sc-vendor-no-show',
    title: 'Vendor no-show',
    severity: ScenarioSeverity.CRITICAL,
    triggers: 'Vendor unreachable 2h before',
    plan: 'Call backup list; reassign tasks to party; inform couple only if needed.',
    owner: 'Best person',
    contactRole: 'vendor',
    checklist: [
      { id: 'v1', text: 'Backup vendor numbers saved', done: false },
      { id: 'v2', text: 'Payment terms for emergency hire known', done: false },
    ],
  },
  {
    id: 'sc-medical',
    title: 'Medical issue',
    severity: ScenarioSeverity.CRITICAL,
    triggers: 'Guest or couple unwell',
    plan: 'Call local emergency; first-aid kit location; designate calm point person.',
    owner: 'Assigned family',
    contactRole: 'medical',
    checklist: [
      { id: 'm1', text: 'First-aid kit location marked', done: false },
      { id: 'm2', text: 'Nearest hospital route saved offline', done: false },
      { id: 'm3', text: 'Emergency number confirmed for city', done: false },
    ],
  },
  {
    id: 'sc-power',
    title: 'Power / AV failure',
    severity: ScenarioSeverity.MEDIUM,
    triggers: 'Outage during ceremony or reception',
    plan: 'Battery speakers; unplugged ceremony option; venue generator status.',
    owner: 'Venue tech',
    contactRole: 'venue',
    checklist: [
      { id: 'p1', text: 'Battery speaker charged', done: false },
      { id: 'p2', text: 'Acoustic ceremony plan agreed', done: false },
    ],
  },
  {
    id: 'sc-traffic',
    title: 'Traffic / late VIP',
    severity: ScenarioSeverity.MEDIUM,
    triggers: 'Processional delayed 15+ min',
    plan: 'Stretch cocktail hour; text ushers; hold food service.',
    owner: 'Coordinator',
    contactRole: 'transport',
    checklist: [
      { id: 't1', text: 'Buffer built into timeline', done: false },
      { id: 't2', text: 'Driver numbers in day-of pack', done: false },
    ],
  },
];

export function createId(prefix = 'em') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyEmergencyState() {
  return {
    version: 2,
    scenarios: DEFAULT_SCENARIOS.map((s) => ({
      ...s,
      checklist: s.checklist.map((c) => ({ ...c })),
    })),
    generalNotes: '',
    assemblyPoint: '',
    hospitalName: '',
    hospitalPhone: '',
    hospitalAddress: '',
    emergencyNumber: '',
    updatedAt: null,
  };
}

export function normaliseEmergencyState(raw) {
  const base = emptyEmergencyState();
  if (!raw || typeof raw !== 'object') return base;
  return {
    ...base,
    ...raw,
    scenarios: Array.isArray(raw.scenarios) && raw.scenarios.length ? raw.scenarios : base.scenarios,
  };
}

export function scenarioProgress(scenario) {
  const list = scenario.checklist || [];
  const total = list.length;
  const done = list.filter((c) => c.done).length;
  return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function planReadiness(state) {
  const scenarios = state.scenarios || [];
  let score = 0;
  let max = 0;
  max += 2;
  if (state.assemblyPoint?.trim()) score += 2;
  max += 2;
  if (state.hospitalName?.trim() || state.hospitalPhone?.trim()) score += 2;
  max += 1;
  if (state.emergencyNumber?.trim()) score += 1;
  for (const sc of scenarios) {
    max += 2;
    const p = scenarioProgress(sc);
    if (p.percent >= 100) score += 2;
    else if (p.percent >= 50) score += 1;
  }
  return { score, max, percent: max ? Math.round((score / max) * 100) : 0 };
}

export function createScenario(partial = {}) {
  return {
    id: createId('sc'),
    title: '',
    severity: ScenarioSeverity.MEDIUM,
    triggers: '',
    plan: '',
    owner: '',
    contactRole: '',
    checklist: [],
    ...partial,
  };
}

export function toggleChecklistItem(scenario, itemId) {
  return {
    ...scenario,
    checklist: (scenario.checklist || []).map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c
    ),
  };
}

export function exportEmergencyText(state) {
  const lines = [
    'WEDDING EMERGENCY PLAN',
    `Assembly: ${state.assemblyPoint || '—'}`,
    `Hospital: ${state.hospitalName || '—'} ${state.hospitalPhone || ''}`,
    `Emergency #: ${state.emergencyNumber || '—'}`,
    '',
  ];
  for (const sc of state.scenarios || []) {
    lines.push(`## ${sc.title} (${sc.severity})`);
    lines.push(`Triggers: ${sc.triggers}`);
    lines.push(`Plan: ${sc.plan}`);
    lines.push(`Owner: ${sc.owner}`);
    for (const c of sc.checklist || []) {
      lines.push(`  [${c.done ? 'x' : ' '}] ${c.text}`);
    }
    lines.push('');
  }
  if (state.generalNotes) lines.push(`Notes: ${state.generalNotes}`);
  return lines.join('\n');
}

export default {
  EMERGENCY_PLAN_KEY,
  emptyEmergencyState,
  normaliseEmergencyState,
  planReadiness,
  exportEmergencyText,
  DEFAULT_SCENARIOS,
};
