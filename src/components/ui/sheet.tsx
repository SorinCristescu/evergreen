/** Sheet — a bottom modal sheet on the app canvas, with a grabber and a tap-to-dismiss scrim. */
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function Sheet({ visible, onClose, children }: SheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(7,18,12,0.45)', justifyContent: 'flex-end' }}>
          {/* Stop taps inside the sheet from dismissing it */}
          <Pressable onPress={() => {}} style={{ width: '100%' }}>
            <View
              style={{
                backgroundColor: t.canvas,
                borderTopLeftRadius: 26,
                borderTopRightRadius: 26,
                paddingHorizontal: Spacing.xl,
                paddingTop: 10,
                paddingBottom: insets.bottom + Spacing.xl,
              }}
            >
              <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.fgSubtle, opacity: 0.4, marginBottom: 16 }} />
              {children}
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
