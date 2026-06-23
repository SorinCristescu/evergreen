import { LegalReader } from '@/components/domain/legal-reader';

const SECTIONS = [
  ['Using Evergreen', 'Evergreen helps you identify, care for, diagnose, and share plants. Use it lawfully and kindly — that’s the whole deal.'],
  ['Your account', 'You’re responsible for your account and keeping it secure. One person per account, and you must be at least 13 years old to sign up.'],
  ['Your content', 'You keep ownership of your photos, journals, and posts. By posting publicly you grant Evergreen a licence to display them in the app. Only share what you have the right to share.'],
  ['Community rules', 'Be respectful. No harassment, spam, scams, or harmful content. We moderate, and may remove content or suspend accounts that break these rules.'],
  ['AI & accuracy', 'Identifications, diagnoses, and care plans are AI-assisted estimates shown with a confidence level. They are not a substitute for professional advice — never eat, treat, or medicate based solely on the app.'],
  ['Subscriptions', 'evergreen+ renews automatically until cancelled. Manage or cancel anytime in your app store. Free trials convert to paid unless cancelled before they end.'],
  ['Liability', 'Evergreen is provided “as is.” To the extent the law allows, we’re not liable for plant loss or decisions made using the app.'],
  ['Changes', 'We may update these terms and will notify you of material changes. Continuing to use Evergreen means you accept the updated terms.'],
] as const;

export default function TermsScreen() {
  return (
    <LegalReader
      title="Terms of Service"
      updatedLabel="Last updated · June 2026"
      lead="Welcome to Evergreen. These terms keep things fair for everyone in the garden. Here’s the short, readable version."
      sections={SECTIONS.map(([heading, body], i) => ({
        number: String(i + 1).padStart(2, '0'),
        heading,
        body,
      }))}
    />
  );
}
