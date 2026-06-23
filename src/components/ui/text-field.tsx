/** TextField — text input on a pressed neumorphic field. `.field` (52px) in the onboarding HTML. */
import { TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { type IconName } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AnimatedIcon } from '@/components/ui/animated-icon';
import { AppText } from '@/components/ui/app-text';
import { fontFamily } from '@/constants/fonts';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';

export type TextFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  leadingIcon?: IconName;
  leadingIconSize?: number;
  onSubmitEditing?: () => void;
};

export function TextField({
  value,
  onChangeText,
  label,
  placeholder,
  helperText,
  errorText,
  multiline,
  maxLength,
  keyboardType,
  autoFocus,
  leadingIcon,
  leadingIconSize = 18,
  onSubmitEditing,
}: TextFieldProps) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <AppText variant="meta" tone="subtle" uppercase>
          {label}
        </AppText>
      ) : null}
      <NeuSurface
        elevation="pressed"
        radius={15}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, paddingVertical: multiline ? 12 : 0 }}
      >
        {leadingIcon ? (
          <AnimatedIcon name={leadingIcon} size={leadingIconSize} color={Palette.ever400} motion={leadingIcon === 'search' ? 'search' : leadingIcon === 'pencil' ? 'write' : 'bob'} />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.fgSubtle}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          style={{ flex: 1, color: t.fg, fontFamily: fontFamily('body', '500'), fontSize: 15 }}
        />
      </NeuSurface>
      {errorText ? (
        <AppText variant="small" tone="danger">
          {errorText}
        </AppText>
      ) : helperText ? (
        <AppText variant="small" tone="subtle">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
}
