import { describe, expect, it } from 'vitest';
import { contactsInHandoffQueue } from '../../components/whatsapp/handoffQueue';

describe('contactsInHandoffQueue', () => {
  const contacts = [
    { id: 1, name: 'Amina', tags: ['vip', 'human_handoff'] },
    { id: 2, name: 'Brian', tags: ['vip'] },
    { id: 3, name: 'Cara' },
  ];

  it('keeps only human_handoff contacts when the handoff queue is selected', () => {
    expect(contactsInHandoffQueue(contacts, true).map((contact) => contact.name)).toEqual(['Amina']);
  });

  it('returns every contact when the handoff queue is off', () => {
    expect(contactsInHandoffQueue(contacts, false)).toEqual(contacts);
  });
});
