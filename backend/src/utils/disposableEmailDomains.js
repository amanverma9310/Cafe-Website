/**
 * Small curated list of disposable/temporary email providers. Not exhaustive — new ones appear
 * constantly — but it stops the common ones bots and spam tools default to. Matches the domain
 * itself and any of its subdomains.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  '10minutemail.com', '10minutemail.net', '10minemail.com',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de',
  'yopmail.com', 'yopmail.net', 'yopmail.fr',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmailo.com', 'tempmail.net', 'tempail.com',
  'throwawaymail.com', 'trashmail.com', 'trashmail.net', 'trashmail.me',
  'fakeinbox.com', 'fakemailgenerator.com', 'getnada.com', 'dispostable.com',
  'sharklasers.com', 'maildrop.cc', 'mintemail.com', 'discard.email', 'discardmail.com',
  'moakt.com', 'moakt.cc', 'emailondeck.com', 'mohmal.com', 'mohmal.in',
  'spamgourmet.com', 'mailnesia.com', 'mytemp.email', 'tempinbox.com', 'burnermail.io',
  'emailfake.com', 'inboxbear.com', 'crazymailing.com', 'harakirimail.com', 'anonaddy.me',
  'noreply.example', 'example.com', 'test.com',
]);

export function isDisposableEmail(email) {
  const domain = String(email || '').split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  for (const d of DISPOSABLE_DOMAINS) {
    if (domain === d || domain.endsWith(`.${d}`)) return true;
  }
  return false;
}
