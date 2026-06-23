/** ComposeSheet — "Share with the community" post composer (pick photos + caption → real post). */
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { NeuPressable, NeuSurface } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Palette } from '@/constants/tokens';
import { useTheme } from '@/theme';
import { useCreatePost, usePlants, useProfile } from '@/data';

export type ComposeSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function ComposeSheet({ visible, onClose }: ComposeSheetProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const createPost = useCreatePost();

  const plants = usePlants() ?? [];
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [taggedPlantId, setTaggedPlantId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const taggedPlant = plants.find((p) => p.id === taggedPlantId);

  const reset = () => {
    setText('');
    setPhotos([]);
    setTaggedPlantId(null);
    setPickerOpen(false);
  };
  const close = () => {
    if (posting) return;
    reset();
    onClose();
  };

  const addPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.85, selectionLimit: 4 });
    if (!result.canceled) setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
  };

  const canPost = (!!text.trim() || photos.length > 0) && !posting;
  const post = async () => {
    if (!canPost) return;
    setPosting(true);
    try {
      await createPost(text.trim(), photos, taggedPlantId ?? undefined);
      reset();
      onClose();
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable onPress={close} style={{ flex: 1, backgroundColor: 'rgba(11,24,18,0.22)', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ marginHorizontal: 12, marginBottom: insets.bottom + 14 }}>
          <NeuSurface elevation="raised" radius={20} stretch style={{ padding: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, paddingBottom: 12 }}>
              <Avatar uri={profile?.avatarUrl} name={profile?.name ?? 'You'} size="sm" />
              <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 15 }}>Share with the community</AppText>
            </View>

            {photos.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginHorizontal: 2, marginBottom: 10 }}>
                {photos.map((uri, i) => (
                  <View key={uri} style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden' }}>
                    <Image source={{ uri }} style={{ width: 72, height: 72 }} contentFit="cover" />
                    <Pressable
                      onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      accessibilityLabel="Remove photo"
                      style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="close" size={12} color={Palette.white} />
                    </Pressable>
                  </View>
                ))}
                {photos.length < 4 ? (
                  <Pressable onPress={addPhotos} accessibilityLabel="Add more photos" style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1.5, borderColor: t.fgSubtle, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="plus" size={20} tone="accent" />
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <NeuPressable onPress={addPhotos} elevation="raised-sm" radius={14} accessibilityLabel="Add photos" style={{ height: 84, alignItems: 'center', justifyContent: 'center', gap: 5, marginHorizontal: 2, marginBottom: 10 }}>
                <Icon name="image" size={22} tone="accent" />
                <AppText variant="bodyBold" color={Palette.ever500} style={{ fontSize: 12 }}>Add photos</AppText>
              </NeuPressable>
            )}

            <NeuSurface elevation="pressed" radius={14} style={{ marginHorizontal: 2, paddingHorizontal: 12, paddingVertical: 10, minHeight: 64 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="What's growing? Share a win, ask for help…"
                placeholderTextColor={t.fgSubtle}
                multiline
                style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: t.fg, minHeight: 44, textAlignVertical: 'top' }}
              />
            </NeuSurface>

            {pickerOpen && plants.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: 2, marginTop: 10 }} contentContainerStyle={{ gap: 7, paddingRight: 8 }}>
                {plants.map((p) => {
                  const sel = p.id === taggedPlantId;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => { setTaggedPlantId(sel ? null : p.id); setPickerOpen(false); }}
                      accessibilityLabel={p.nickname ?? 'Plant'}
                      style={{ height: 34, paddingHorizontal: 13, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? Palette.ever100 : 'transparent', borderWidth: 1, borderColor: sel ? Palette.ever400 : t.fgSubtle }}
                    >
                      <AppText variant="small" color={sel ? Palette.ever500 : t.fg} style={{ fontSize: 12.5 }}>{p.nickname ?? 'Plant'}</AppText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 11, paddingHorizontal: 2 }}>
              <NeuPressable onPress={() => setPickerOpen((o) => !o)} elevation="raised-sm" radius={999} accessibilityLabel="Tag a plant" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 13 }}>
                <Icon name="leaf" size={14} tone={taggedPlant ? 'accent' : 'muted'} />
                <AppText variant="small" color={taggedPlant ? Palette.ever500 : t.fgMuted} style={{ fontSize: 12.5 }}>{taggedPlant?.nickname ?? 'Tag a plant'}</AppText>
                {taggedPlant ? <Pressable onPress={() => setTaggedPlantId(null)} hitSlop={8}><Icon name="close" size={12} tone="muted" /></Pressable> : null}
              </NeuPressable>
              <View style={{ flex: 1 }} />
              <NeuPressable onPress={post} disabled={!canPost} elevation="raised" radius={12} accessibilityLabel="Post" style={{ height: 42, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: canPost ? 1 : 0.5 }}>
                {posting ? <ActivityIndicator color={Palette.ever400} /> : null}
                <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 14 }}>{posting ? 'Posting…' : 'Post'}</AppText>
              </NeuPressable>
            </View>
          </NeuSurface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
