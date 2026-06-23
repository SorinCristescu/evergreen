/** ReportForm — Moderation report: names the subject, collects a reason + optional detail. */
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Radio } from '@/components/ui/radio';
import { fontFamily } from '@/constants/fonts';
import { Palette, Spacing } from '@/constants/tokens';
import type { ID, ReportTargetType } from '@/data';
import { useTheme } from '@/theme';

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate'
  | 'impersonation'
  | 'misinformation'
  | 'other';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'impersonation', label: 'Impersonation' },
  { value: 'misinformation', label: 'False or harmful info' },
  { value: 'other', label: 'Something else' },
];

const KIND_LABEL: Record<ReportTargetType, string> = {
  post: 'Reporting a post',
  comment: 'Reporting a comment',
  message: 'Reporting a message',
  user: 'Reporting a profile',
  listing: 'Reporting a listing',
};

export type ReportFormProps = {
  target: { type: ReportTargetType; id: ID; handle: string; snippet: string; initials: string };
  onSubmit: (input: { reason: ReportReason; detail?: string }) => void;
  onCancel: () => void;
};

export function ReportForm({ target, onSubmit }: ReportFormProps) {
  const t = useTheme();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');

  return (
    <View>
      {/* Subject card */}
      <NeuSurface radius={14} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, marginBottom: 14 }}>
        <View style={{ width: 42, height: 42 }}>
          <View style={{ width: 42, height: 42, borderRadius: 999, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            <LinearGradient colors={['#48876a', '#23503c']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
            <AppText color={Palette.white} style={{ fontFamily: fontFamily('display', '600'), fontSize: 14 }}>{target.initials}</AppText>
          </View>
          <View style={{ position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: t.ever100 }}>
            <LinearGradient colors={['#79c6a0', '#3a8c66']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', inset: 0 }} />
            <Icon name="image" size={11} color="rgba(255,255,255,0.85)" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 8.5, letterSpacing: 1 }} color={Palette.danger} uppercase>
            {KIND_LABEL[target.type]}
          </AppText>
          <AppText style={{ fontFamily: fontFamily('display', '600'), fontSize: 14 }} color={t.fg}>{target.handle}</AppText>
          <AppText variant="small" tone="muted" numberOfLines={1} style={{ fontSize: 11.5, marginTop: 1 }}>{target.snippet}</AppText>
        </View>
      </NeuSurface>

      {/* Intro */}
      <AppText variant="small" tone="muted" style={{ fontSize: 12.5, lineHeight: 19, marginHorizontal: 4, marginBottom: 14 }}>
        {`Reports are confidential — ${target.handle} won’t know you reported them. Tell us what’s happening.`}
      </AppText>

      {/* Section label */}
      <AppText style={{ fontFamily: fontFamily('mono', '500'), fontSize: 10, letterSpacing: 1.4, marginHorizontal: 4, marginBottom: 9 }} tone="subtle" uppercase>
        Why are you reporting this?
      </AppText>

      {/* Reasons */}
      <View style={{ gap: 9 }}>
        {REASONS.map((r) => {
          const selected = reason === r.value;
          return (
            <NeuPressable
              key={r.value}
              onPress={() => setReason(r.value)}
              elevation="raised-sm"
              radius={14}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 }}
            >
              <AppText style={{ flex: 1, fontFamily: fontFamily('display', '600'), fontSize: 13.5 }} color={t.fg}>
                {r.label}
              </AppText>
              <Radio selected={selected} />
            </NeuPressable>
          );
        })}
      </View>

      {/* Detail textarea */}
      <NeuSurface elevation="pressed" radius={14} style={{ marginTop: 16, minHeight: 74, paddingHorizontal: 14, paddingVertical: 12 }}>
        <TextInput
          value={detail}
          onChangeText={setDetail}
          placeholder="Add any details that help (optional)…"
          placeholderTextColor={t.fgSubtle}
          multiline
          style={{ fontFamily: fontFamily('body', '400'), fontSize: 13.5, color: t.fg, padding: 0, textAlignVertical: 'top', minHeight: 50 }}
        />
      </NeuSurface>

      {/* Submit */}
      <View style={{ marginTop: 14 }}>
        <Button label="Submit report" fullWidth disabled={!reason} onPress={() => reason && onSubmit({ reason, detail: detail || undefined })} />
      </View>
      <AppText align="center" tone="subtle" style={{ fontSize: 11, marginTop: 8 }}>
        Most reports are reviewed within 24 hours.
      </AppText>
    </View>
  );
}
