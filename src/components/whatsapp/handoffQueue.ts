export function contactsInHandoffQueue<T extends { tags?: string[] | null }>(
  contacts: T[],
  handoffOnly: boolean,
): T[] {
  if (!handoffOnly) return contacts;
  return contacts.filter((contact) => (contact.tags || []).includes('human_handoff'));
}
