import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Chip } from '@/components/ui/chip';
import { IconButton } from '@/components/ui/icon-button';
import { Pill } from '@/components/ui/pill';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet } from '@/components/ui/sheet';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import { Palette, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';
import { useAccessGrants, useInviteAccess, useLocations, useRevokeAccess, type AccessGrant, type AccessRole, type ID } from '@/data';

type Perm = { key: string; icon: IconName; title: string; description: string; on: boolean };

const PERMS: Perm[] = [
  { key: 'camera', icon: 'camera', title: 'Camera', description: 'Identify plants and capture photos for Dr. Plant.', on: true },
  { key: 'location', icon: 'pin', title: 'Location', description: 'Local climate and forecasts that shape your care plans.', on: true },
  { key: 'notifications', icon: 'bell', title: 'Notifications', description: 'Gentle reminders when a plant needs care.', on: true },
  { key: 'photos', icon: 'image', title: 'Photos', description: 'Add plants and growth shots from your gallery.', on: false },
];

const ROLES: { value: AccessRole; label: string }[] = [
  { value: 'family', label: 'Family' },
  { value: 'gardener', label: 'Gardener' },
  { value: 'housekeeper', label: 'Housekeeper' },
];
const roleLabel = (r: AccessRole) => ROLES.find((x) => x.value === r)?.label ?? r;

function PermRow({ perm, value, onChange, first }: { perm: Perm; value: boolean; onChange: (v: boolean) => void; first?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14, borderTopWidth: first ? 0 : 1, borderTopColor: 'rgba(22,39,30,0.07)' }}>
      <NeuSurface elevation="pressed" radius={11} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={perm.icon} size={20} strokeWidth={1.7} color={Palette.ever500} />
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14 }}>{perm.title}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 11.5, marginTop: 2, lineHeight: 16 }}>{perm.description}</AppText>
        <AppText variant="metaSm" color={value ? Palette.leaf : t.fgSubtle} uppercase style={{ fontSize: 9.5, letterSpacing: 0.6, marginTop: 5 }}>
          {value ? 'Allowed' : 'Not allowed'}
        </AppText>
      </View>
      <Toggle value={value} onChange={onChange} accessibilityLabel={`Toggle ${perm.title}`} />
    </View>
  );
}

function GrantRow({ grant, onRemove, first }: { grant: AccessGrant; onRemove: () => void; first?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderTopWidth: first ? 0 : 1, borderTopColor: 'rgba(22,39,30,0.07)' }}>
      <NeuSurface elevation="pressed" radius={11} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="user" size={19} strokeWidth={1.7} color={Palette.ever500} />
      </NeuSurface>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14 }} numberOfLines={1}>{grant.granteeName ?? grant.email}</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 11.5, marginTop: 1 }} numberOfLines={1}>
          {roleLabel(grant.role)} · {grant.locationCount} location{grant.locationCount === 1 ? '' : 's'}
        </AppText>
      </View>
      {grant.status === 'active' ? <Pill label="Active" tone="success" /> : <Pill label="Pending" tone="warning" />}
      <IconButton icon="trash" tone="danger" accessibilityLabel={`Remove ${grant.granteeName ?? grant.email}`} onPress={onRemove} />
    </View>
  );
}

export default function PermissionsScreen() {
  const t = useTheme();
  const [state, setState] = useState<Record<string, boolean>>(Object.fromEntries(PERMS.map((p) => [p.key, p.on])));

  const locations = (useLocations() ?? []).filter((l) => !l.sharedByName); // can only share your own
  const grants = useAccessGrants() ?? [];
  const invite = useInviteAccess();
  const revoke = useRevokeAccess();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccessRole>('gardener');
  const [picked, setPicked] = useState<Set<ID>>(new Set());
  const [busy, setBusy] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AccessGrant | null>(null);
  const [removing, setRemoving] = useState(false);

  const confirmRemove = async () => {
    if (!removeTarget || removing) return;
    setRemoving(true);
    try {
      await revoke(removeTarget.id);
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  };

  const togglePick = (id: ID) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openInvite = () => {
    setEmail('');
    setRole('gardener');
    setPicked(new Set(locations.map((l) => l.id))); // share all locations by default; deselect to narrow
    setInviteOpen(true);
  };

  const canSend = email.trim().includes('@') && picked.size > 0 && !busy;
  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    try {
      await invite({ email: email.trim(), role, locationIds: [...picked] });
      setInviteOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <ScreenHeader title="Permissions" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingTop: 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <AppText variant="small" tone="muted" style={{ fontSize: 12.5, lineHeight: 19, marginHorizontal: 4, marginTop: 8, marginBottom: 14 }}>
          You stay in control. Turn anything off here, or in your device settings.
        </AppText>
        <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden' }}>
          {PERMS.map((p, i) => (
            <PermRow key={p.key} perm={p} first={i === 0} value={state[p.key]} onChange={(v) => setState((s) => ({ ...s, [p.key]: v }))} />
          ))}
        </NeuSurface>

        {/* ── Shared access ─────────────────────────────────────────────── */}
        <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9.5, letterSpacing: 0.8, marginHorizontal: 4, marginTop: 24, marginBottom: 8 }}>Shared access</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 12.5, lineHeight: 19, marginHorizontal: 4, marginBottom: 12 }}>
          Invite a family member, gardener or housekeeper by email. They install the app, sign in, and get access to the locations you choose — and can tend the care tasks.
        </AppText>

        {grants.length > 0 ? (
          <NeuSurface elevation="raised" radius={16} stretch style={{ overflow: 'hidden', marginBottom: 12 }}>
            {grants.map((g, i) => (
              <GrantRow key={g.id} grant={g} first={i === 0} onRemove={() => setRemoveTarget(g)} />
            ))}
          </NeuSurface>
        ) : null}

        <NeuPressable onPress={openInvite} elevation="raised" radius={14} stretch style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 50 }} accessibilityLabel="Invite someone">
          <Icon name="plus" size={18} color={Palette.ever400} strokeWidth={2.4} />
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 14.5 }}>Invite someone</AppText>
        </NeuPressable>

        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginHorizontal: 4, marginTop: 16 }}>
          <Icon name="shield" size={15} strokeWidth={1.7} color={Palette.ever500} />
          <AppText variant="small" tone="muted" style={{ flex: 1, fontSize: 11.5, lineHeight: 17 }}>
            Evergreen asks the first time you use a feature, and never collects more than it needs.
          </AppText>
        </View>
      </ScrollView>

      <Sheet visible={inviteOpen} onClose={() => (busy ? undefined : setInviteOpen(false))}>
        <AppText variant="title" style={{ marginBottom: 14 }}>Invite someone</AppText>
        <View style={{ gap: 16 }}>
          <TextField label="Email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoFocus />
          <View>
            <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9.5, letterSpacing: 0.8, marginBottom: 8 }}>Role</AppText>
            <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
              {ROLES.map((r) => (
                <Chip key={r.value} label={r.label} size="lg" selected={role === r.value} onPress={() => setRole(r.value)} />
              ))}
            </View>
          </View>
          <View>
            <AppText variant="metaSm" tone="subtle" uppercase style={{ fontSize: 9.5, letterSpacing: 0.8, marginBottom: 8 }}>Locations to share</AppText>
            {locations.length === 0 ? (
              <AppText variant="small" tone="subtle">You have no locations to share yet.</AppText>
            ) : (
              <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' }}>
                {locations.map((l) => (
                  <Chip key={l.id} label={l.name} size="lg" selected={picked.has(l.id)} onPress={() => togglePick(l.id)} />
                ))}
              </View>
            )}
          </View>
          <NeuPressable
            onPress={send}
            disabled={!canSend}
            elevation="raised"
            radius={14}
            stretch
            accessibilityLabel="Send invite"
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, height: 50, opacity: canSend ? 1 : 0.5 }}
          >
            {busy ? <ActivityIndicator color={Palette.ever400} /> : <Icon name="send" size={17} color={Palette.ever400} />}
            <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 14.5 }}>{busy ? 'Sending…' : 'Send invite'}</AppText>
          </NeuPressable>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            {busy ? <ActivityIndicator color={Palette.ever400} /> : <Icon name="mail" size={14} color={t.fgSubtle} />}
            <AppText variant="metaSm" tone="subtle" style={{ flex: 1, fontSize: 10.5, lineHeight: 15 }}>
              They’ll get an email with an install link. Access turns on automatically the first time they sign in.
            </AppText>
          </View>
        </View>
      </Sheet>

      <Sheet visible={!!removeTarget} onClose={() => (removing ? undefined : setRemoveTarget(null))}>
        <AppText variant="display2" style={{ fontSize: 18, marginBottom: 8 }}>Remove access?</AppText>
        <AppText variant="small" tone="muted" style={{ fontSize: 13.5, lineHeight: 20, marginBottom: 16 }}>
          {removeTarget?.granteeName ?? removeTarget?.email} will lose access to your shared locations. You can invite them again later.
        </AppText>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <NeuPressable onPress={() => setRemoveTarget(null)} elevation="raised" radius={14} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: 50 }} accessibilityLabel="Cancel">
            <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 14.5 }}>Cancel</AppText>
          </NeuPressable>
          <NeuPressable onPress={confirmRemove} elevation="raised" radius={14} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50 }} accessibilityLabel="Confirm remove">
            {removing ? <ActivityIndicator color={Palette.danger} /> : <Icon name="trash" size={17} color={Palette.danger} />}
            <AppText variant="bodyBold" color={Palette.danger} style={{ fontSize: 14.5 }}>Remove</AppText>
          </NeuPressable>
        </View>
      </Sheet>
    </View>
  );
}
