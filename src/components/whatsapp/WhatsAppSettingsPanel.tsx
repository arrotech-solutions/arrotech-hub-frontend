import React from 'react';
import { AlertCircle, Bot, Check, Clock, Loader2, Phone, Users, Zap } from 'lucide-react';
import { Connection } from '../../types';
import {
  hubDangerBtn,
  hubFieldLabel,
  hubPrimaryBtn,
  hubSection,
  hubSectionHeader,
} from '../../lib/hubPolish';
import { TeamMember } from './ConversationsTab';

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const fieldClass =
  'mt-1.5 w-full px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent transition-all';

const quietBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors';

export interface DayHours {
  open: string;
  close: string;
  is_open: boolean;
}

export interface WhatsAppBusinessProfileForm {
  business_name: string;
  description: string;
  industry: string;
  away_message: string;
  timezone: string;
  business_hours_ui: Record<string, DayHours>;
}

export interface WhatsAppInboxSettingsForm {
  round_robin_enabled: boolean;
  round_robin_agent_ids: string[];
  sla_first_response_minutes: number;
  notify_new_message_browser: boolean;
  notify_new_message_sound: boolean;
  notify_new_message_email: boolean;
  notify_sla_breach: boolean;
  csat_enabled: boolean;
}

export interface WhatsAppPhoneNumberRow {
  id?: string;
  display_phone_number?: string;
  phone_number?: string;
  name_status?: string;
  quality_rating?: string;
  status?: string;
}

export interface WhatsAppSettingsPanelProps {
  connection: Connection | null;
  phoneNumbers: WhatsAppPhoneNumberRow[];
  businessProfile: WhatsAppBusinessProfileForm;
  setBusinessProfile: React.Dispatch<React.SetStateAction<WhatsAppBusinessProfileForm>>;
  inboxSettings: WhatsAppInboxSettingsForm;
  setInboxSettings: React.Dispatch<React.SetStateAction<WhatsAppInboxSettingsForm>>;
  teamMembers: TeamMember[];
  onConnectMeta: () => void;
  onSyncNumbers: () => void;
  onSaveProfile: () => void;
  onSaveHours: () => void;
  onSaveInbox: () => void;
  onOpenRegister: () => void;
  onOpenDeregister: () => void;
  isSavingProfile: boolean;
  isSavingHours: boolean;
  isSyncingNumbers: boolean;
}

const formatDayLabel = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);

const INBOX_TOGGLES = [
  ['notify_new_message_browser', 'Browser notifications for new messages'],
  ['notify_new_message_sound', 'Sound alert for new messages'],
  ['notify_new_message_email', 'Email when SLA is breached (coming soon)'],
  ['notify_sla_breach', 'Highlight SLA breaches in inbox'],
  ['csat_enabled', 'Send CSAT survey when marking resolved'],
] as const;

const WhatsAppSettingsPanel: React.FC<WhatsAppSettingsPanelProps> = ({
  connection,
  phoneNumbers,
  businessProfile,
  setBusinessProfile,
  inboxSettings,
  setInboxSettings,
  teamMembers,
  onConnectMeta,
  onSyncNumbers,
  onSaveProfile,
  onSaveHours,
  onSaveInbox,
  onOpenRegister,
  onOpenDeregister,
  isSavingProfile,
  isSavingHours,
  isSyncingNumbers,
}) => {
  const phonePending = connection?.config?.phone_status === 'PENDING';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {connection ? (
        <section className={`${hubSection} p-6 sm:p-8 shadow-sm`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800/30 shrink-0">
                <Phone className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <h3 className={hubSectionHeader}>Connected Account</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Your active WhatsApp Business connection</p>
              </div>
            </div>
            {phonePending ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-semibold rounded-full flex items-center gap-1.5 self-start border border-yellow-200 dark:border-yellow-800/50">
                  <AlertCircle className="w-3.5 h-3.5" /> Pending Registration
                </span>
                <button type="button" onClick={onOpenRegister} className={hubPrimaryBtn}>
                  Complete Registration
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full flex items-center gap-1.5 self-start border border-green-200 dark:border-green-800/50">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
                <button type="button" onClick={onOpenDeregister} className={hubDangerBtn}>
                  Deregister Phone
                </button>
              </div>
            )}
          </div>

          <dl className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-slate-800">
              <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Connection Name</dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white break-words">{connection.name}</dd>
            </div>
            {connection.config?.phone_number && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-slate-800">
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Phone Number</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white">+{connection.config.phone_number}</dd>
              </div>
            )}
            {connection.config?.business_name && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-slate-800">
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Business Display Name</dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-white break-words">{connection.config.business_name}</dd>
              </div>
            )}
            {connection.config?.waba_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-slate-800">
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">WABA ID</dt>
                <dd className="text-sm font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 px-2 py-0.5 rounded break-all">{connection.config.waba_id}</dd>
              </div>
            )}
            {connection.config?.phone_number_id && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-gray-100 dark:border-slate-800">
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Phone Number ID</dt>
                <dd className="text-sm font-mono text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 px-2 py-0.5 rounded break-all">{connection.config.phone_number_id}</dd>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3">
              <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Connected Since</dt>
              <dd className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(connection.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800/30 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-800/30 rounded-full shrink-0">
            <Bot className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-orange-900 dark:text-orange-300">No Account Connected</h3>
            <p className="text-sm text-orange-700 dark:text-orange-400/80 mt-1">Please connect your WhatsApp Business account in the Connections tab to access full features.</p>
          </div>
          <button type="button" onClick={onConnectMeta} className={`${hubPrimaryBtn} shrink-0`}>
            Connect Using Meta
          </button>
        </section>
      )}

      {connection && (
        <section className={`${hubSection} p-6 sm:p-8 shadow-sm`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30 shrink-0">
                <Phone className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className={hubSectionHeader}>Phone Numbers</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onSyncNumbers} disabled={isSyncingNumbers} className={quietBtn}>
                {isSyncingNumbers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Sync
              </button>
              <button type="button" onClick={onConnectMeta} className={hubPrimaryBtn}>
                Add Number
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
            Manage your connected sending numbers via Meta Embedded Signup. The quality rating determines your daily messaging limits.
          </p>

          {phoneNumbers && phoneNumbers.length > 0 ? (
            <div className="space-y-3">
              {phoneNumbers.map((pn, i) => (
                <div key={pn.id || i} className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center py-3 border-b border-gray-100 dark:border-slate-800">
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white inline-block break-all">+{String(pn.display_phone_number || pn.phone_number || pn.id).replace(/^\+/, '')}</span>
                    <span className="block text-xs text-gray-500 dark:text-slate-400 mt-0.5">{pn.name_status || 'PENDING_REVIEW'} | Quality: {pn.quality_rating || 'UNKNOWN'}</span>
                  </div>
                  <span className={`self-start px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${pn.status === 'CONNECTED' || pn.status?.toUpperCase() === 'CONNECTED' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                    {pn.status || 'PENDING'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-500 dark:text-slate-400 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
              No numbers fetched yet. Click &quot;Add Number&quot; to setup or &quot;Sync&quot; to refresh.
            </div>
          )}
        </section>
      )}

      <section className={`${hubSection} p-6 sm:p-8 shadow-sm`}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30 shrink-0">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className={hubSectionHeader}>Business Profile</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          This information helps AI generate better responses for your customers.
        </p>

        <div className="space-y-5">
          <div>
            <label htmlFor="wa-business-name" className={hubFieldLabel}>
              Business Name
            </label>
            <input
              id="wa-business-name"
              type="text"
              value={businessProfile.business_name || ''}
              onChange={(e) => setBusinessProfile({ ...businessProfile, business_name: e.target.value })}
              placeholder="Your Business Name"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="wa-business-description" className={hubFieldLabel}>
              Description
            </label>
            <textarea
              id="wa-business-description"
              rows={3}
              value={businessProfile.description || ''}
              onChange={(e) => setBusinessProfile({ ...businessProfile, description: e.target.value })}
              placeholder="What does your business do?"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="wa-business-industry" className={hubFieldLabel}>
              Industry
            </label>
            <select
              id="wa-business-industry"
              value={businessProfile.industry || ''}
              onChange={(e) => setBusinessProfile({ ...businessProfile, industry: e.target.value })}
              className={fieldClass}
            >
              <option value="">Select industry</option>
              <option value="retail">Retail & E-commerce</option>
              <option value="food">Food & Beverage</option>
              <option value="services">Professional Services</option>
              <option value="health">Health & Beauty</option>
              <option value="tech">Technology</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button type="button" onClick={onSaveProfile} disabled={isSavingProfile} className={hubPrimaryBtn}>
            {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Profile
          </button>
        </div>
      </section>

      <section className={`${hubSection} p-6 sm:p-8 shadow-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg shrink-0">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className={hubSectionHeader}>Business Hours</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
          Set your operating hours and away message. Used by &quot;Outside Business Hours&quot; auto-reply rules.
        </p>

        <div className="mb-5">
          <label htmlFor="wa-timezone" className={hubFieldLabel}>
            Timezone
          </label>
          <select
            id="wa-timezone"
            value={businessProfile.timezone}
            onChange={(e) => setBusinessProfile({ ...businessProfile, timezone: e.target.value })}
            className={fieldClass}
          >
            <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
            <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
            <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="wa-away-message" className={hubFieldLabel}>
            Away Message
          </label>
          <textarea
            id="wa-away-message"
            rows={2}
            value={businessProfile.away_message}
            onChange={(e) => setBusinessProfile({ ...businessProfile, away_message: e.target.value })}
            placeholder="Thanks for reaching out! We're currently closed and will reply during business hours."
            className={fieldClass}
          />
        </div>

        <div className="space-y-4">
          {WEEKDAYS.map((day) => {
            const dayHours = businessProfile.business_hours_ui[day];
            return (
              <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="w-28 font-semibold text-gray-700 dark:text-slate-300">{formatDayLabel(day)}</div>
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <input
                    type="time"
                    aria-label={`${formatDayLabel(day)} open`}
                    value={dayHours.open}
                    disabled={!dayHours.is_open}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      business_hours_ui: {
                        ...businessProfile.business_hours_ui,
                        [day]: { ...dayHours, open: e.target.value },
                      },
                    })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-secondary-500 transition-all disabled:opacity-40"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    aria-label={`${formatDayLabel(day)} close`}
                    value={dayHours.close}
                    disabled={!dayHours.is_open}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      business_hours_ui: {
                        ...businessProfile.business_hours_ui,
                        [day]: { ...dayHours, close: e.target.value },
                      },
                    })}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm dark:text-white outline-none focus:ring-2 focus:ring-secondary-500 transition-all disabled:opacity-40"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dayHours.is_open}
                    onChange={(e) => setBusinessProfile({
                      ...businessProfile,
                      business_hours_ui: {
                        ...businessProfile.business_hours_ui,
                        [day]: { ...dayHours, is_open: e.target.checked },
                      },
                    })}
                    className="rounded border-gray-300 dark:border-slate-700 text-secondary-800 focus:ring-secondary-500 dark:bg-slate-800"
                  />
                  <span className="font-medium">Open</span>
                </label>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={onSaveHours} disabled={isSavingHours} className={`${hubPrimaryBtn} mt-8`}>
          {isSavingHours && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Hours
        </button>
      </section>

      <section className={`${hubSection} p-6 sm:p-8 shadow-sm`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg shrink-0">
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className={hubSectionHeader}>Team inbox</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Round-robin assignment and SLA targets for open conversations.
        </p>
        <label className="flex items-center gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={inboxSettings.round_robin_enabled}
            onChange={(e) => setInboxSettings({ ...inboxSettings, round_robin_enabled: e.target.checked })}
            className="rounded border-gray-300 text-secondary-800"
          />
          <span className="text-sm text-gray-700 dark:text-slate-300">Auto-assign new conversations (round-robin)</span>
        </label>
        {inboxSettings.round_robin_enabled && (
          <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
            {teamMembers.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={inboxSettings.round_robin_agent_ids.includes(m.id)}
                  onChange={(e) => {
                    const ids = e.target.checked
                      ? [...inboxSettings.round_robin_agent_ids, m.id]
                      : inboxSettings.round_robin_agent_ids.filter((id) => id !== m.id);
                    setInboxSettings({ ...inboxSettings, round_robin_agent_ids: ids });
                  }}
                />
                {m.name}
              </label>
            ))}
          </div>
        )}
        <label htmlFor="wa-sla-minutes" className={hubFieldLabel}>
          First response SLA (minutes)
        </label>
        <input
          id="wa-sla-minutes"
          type="number"
          min={1}
          max={120}
          value={inboxSettings.sla_first_response_minutes}
          onChange={(e) => setInboxSettings({ ...inboxSettings, sla_first_response_minutes: Number(e.target.value) })}
          className={`${fieldClass} max-w-xs mb-4`}
        />
        <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">Notification preferences</p>
        <div className="space-y-2 mb-4">
          {INBOX_TOGGLES.map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(inboxSettings[key])}
                onChange={(e) => setInboxSettings({ ...inboxSettings, [key]: e.target.checked })}
                className="rounded border-gray-300 text-secondary-800"
              />
              <span className="text-gray-700 dark:text-slate-300">{label}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={onSaveInbox} className={hubPrimaryBtn}>
          Save inbox settings
        </button>
      </section>
    </div>
  );
};

export default WhatsAppSettingsPanel;
