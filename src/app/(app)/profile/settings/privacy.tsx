import { DataGlanceCard } from '@/components/domain/data-glance-card';
import { LegalReader } from '@/components/domain/legal-reader';

const SECTIONS = [
  ['What we collect', 'We collect what you give us — your account details, plant photos, journals — and a little about how you use the app to make it better.'],
  ['How we use it', 'To run the core loop: identify, care, diagnose, and connect. We tune reminders and care plans to your home. We don’t use your data for advertising.'],
  ['AI processing', 'To identify and diagnose, plant photos may be sent to our AI partners (Plant.id, Anthropic). They process the image to return a result and do not train on your data.'],
  ['Location', 'Used only to fetch local climate and forecasts for your care plans. It’s approximate by default, and you can enter a city manually instead.'],
  ['Sharing', 'We don’t sell your data. Public posts are visible to the community; your DMs stay private; uploads pass through automated moderation.'],
  ['Your rights', 'You’re in control. Export or permanently delete your data anytime from Settings › Account.'],
  ['Retention', 'We keep your data while your account is active. When you delete it, we remove it within 30 days, except where the law requires us to keep records.'],
] as const;

export default function PrivacyScreen() {
  return (
    <LegalReader
      title="Privacy Policy"
      updatedLabel="Last updated · June 2026"
      header={
        <DataGlanceCard
          items={[
            { icon: 'user', label: 'Account & email' },
            { icon: 'image', label: 'Plant photos' },
            { icon: 'pin', label: 'Approximate location' },
            { icon: 'chart', label: 'Usage & care activity' },
          ]}
        />
      }
      sections={SECTIONS.map(([heading, body]) => ({ heading, body }))}
    />
  );
}
