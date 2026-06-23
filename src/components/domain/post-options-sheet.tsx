/** PostOptionsSheet — the ⋯ menu on a feed post. `.sheet[data-sheet=post]` in evergreen-community.html. */
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type PostOptionsSheetProps = {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
  onDelete?: () => void; // present only for the viewer's own posts
};

function Row({ icon, label, danger, onPress }: { icon: IconName; label: string; danger?: boolean; onPress: () => void }) {
  const t = useTheme();
  const color = danger ? Palette.danger : t.fg;
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13, borderRadius: 12 }}>
      <NeuSurface elevation="pressed" radius={10} style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color={danger ? Palette.danger : Palette.ever500} />
      </NeuSurface>
      <AppText variant="body" color={color} style={{ fontSize: 14.5 }}>{label}</AppText>
    </Pressable>
  );
}

export function PostOptionsSheet({ visible, onClose, onReport, onDelete }: PostOptionsSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(11,24,18,0.22)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ marginHorizontal: 12, marginBottom: insets.bottom + 14 }}>
          <NeuSurface elevation="raised" radius={20} stretch style={{ padding: 8 }}>
            <Row icon="link" label="Copy link" onPress={onClose} />
            {onDelete ? (
              <Row icon="trash" label="Delete post" danger onPress={onDelete} />
            ) : (
              <>
                <Row icon="mute" label="Mute this gardener" onPress={onClose} />
                <Row icon="flag" label="Report post" danger onPress={onReport} />
                <Row icon="ban" label="Block gardener" danger onPress={onClose} />
              </>
            )}
          </NeuSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
