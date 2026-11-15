/**
 * WhatsApp Settings panel: section labels and save callbacks.
 * Dashboard keeps API handlers; this suite mounts the panel with mock props only.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Connection } from '../../types';
import WhatsAppSettingsPanel, {
  WhatsAppBusinessProfileForm,
  WhatsAppInboxSettingsForm,
} from '../../components/whatsapp/WhatsAppSettingsPanel';

const connection: Connection = {
  id: 1,
  user_id: 1,
  platform: 'whatsapp',
  name: 'Arrotech WA',
  status: 'active',
  config: {
    phone_number: '254700000000',
    phone_status: 'CONNECTED',
    business_name: 'Arrotech',
    waba_id: 'waba-1',
    phone_number_id: 'pn-1',
  },
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
};

const day = { open: '08:00', close: '18:00', is_open: true };

const businessProfile: WhatsAppBusinessProfileForm = {
  business_name: 'Arrotech Shop',
  description: 'Groceries',
  industry: 'retail',
  away_message: 'We are closed.',
  timezone: 'Africa/Nairobi',
  business_hours_ui: {
    monday: day,
    tuesday: day,
    wednesday: day,
    thursday: day,
    friday: day,
    saturday: { open: '09:00', close: '14:00', is_open: false },
    sunday: { open: '09:00', close: '14:00', is_open: false },
  },
};

const inboxSettings: WhatsAppInboxSettingsForm = {
  round_robin_enabled: false,
  round_robin_agent_ids: [],
  sla_first_response_minutes: 5,
  notify_new_message_browser: true,
  notify_new_message_sound: true,
  notify_new_message_email: false,
  notify_sla_breach: true,
  csat_enabled: true,
};

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof WhatsAppSettingsPanel>> = {}
) {
  const props: React.ComponentProps<typeof WhatsAppSettingsPanel> = {
    connection,
    phoneNumbers: [],
    businessProfile,
    setBusinessProfile: jest.fn(),
    inboxSettings,
    setInboxSettings: jest.fn(),
    teamMembers: [],
    onConnectMeta: jest.fn(),
    onSyncNumbers: jest.fn(),
    onSaveProfile: jest.fn(),
    onSaveHours: jest.fn(),
    onSaveInbox: jest.fn(),
    onOpenRegister: jest.fn(),
    onOpenDeregister: jest.fn(),
    isSavingProfile: false,
    isSavingHours: false,
    isSyncingNumbers: false,
    ...overrides,
  };
  return { ...render(<WhatsAppSettingsPanel {...props} />), props };
}

describe('WhatsAppSettingsPanel', () => {
  it('renders Connected Account, Business Profile, and save actions', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: 'Connected Account' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Business Profile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save profile/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save hours/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save inbox/i })).toBeInTheDocument();
  });

  it('invokes onSaveProfile when Save Profile is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderPanel();

    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(props.onSaveProfile).toHaveBeenCalledTimes(1);
  });

  it('invokes onSaveHours when Save Hours is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderPanel();

    await user.click(screen.getByRole('button', { name: /save hours/i }));

    expect(props.onSaveHours).toHaveBeenCalledTimes(1);
  });

  it('invokes onSaveInbox when Save inbox settings is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderPanel();

    await user.click(screen.getByRole('button', { name: /save inbox/i }));

    expect(props.onSaveInbox).toHaveBeenCalledTimes(1);
  });
});
