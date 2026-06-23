import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ChallengeCard } from '@/components/domain/challenge-card';
import { PostOptionsSheet } from '@/components/domain/post-options-sheet';
import { SwapListingCard } from '@/components/domain/swap-listing-card';

import { Icon } from '@/components/icon';
import { NeuSurface } from '@/components/neu-surface';
import { AppHeader } from '@/components/ui/app-header';
import { AppText } from '@/components/ui/app-text';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { DataGate } from '@/components/ui/data-gate';
import { IconButton } from '@/components/ui/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TopTabs } from '@/components/ui/top-tabs';
import { fontFamily } from '@/constants/fonts';
import { Image } from 'expo-image';
import { plantPhotoForSeed, Palette, Spacing } from '@/constants/tokens';
import { useCommunityFeed, useDeletePost, useProfile, type Post } from '@/data';
import { useTheme } from '@/theme';

function PostCard({ post }: { post: Post }) {
  const t = useTheme();
  const router = useRouter();
  const profile = useProfile();
  const deletePost = useDeletePost();
  const isOwn = !!profile && profile.id === post.author.id;
  const [menuOpen, setMenuOpen] = useState(false);
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const toggleLike = () =>
    setLiked((prev) => {
      setLikeCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
  return (
    <>
    <Card padded={false} radius="lg">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingTop: 12, paddingBottom: 11 }}>
        <Avatar uri={post.author.avatarUrl} name={post.author.name} size="sm" />
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" color={t.fg} style={{ fontSize: 13.5 }}>@{post.author.handle}</AppText>
          <AppText variant="meta" tone="subtle" style={{ fontSize: 10 }}>
            {post.createdAtLabel}
          </AppText>
        </View>
        <Pressable onPress={() => setMenuOpen(true)} accessibilityLabel="Post options" style={{ padding: 4 }}>
          <Icon name="more" size={18} tone="subtle" />
        </Pressable>
      </View>
      {post.photoUrls.length > 0 ? (
        <View>
          <Image source={{ uri: post.photoUrls[0] }} style={{ width: '100%', height: 220 }} contentFit="cover" transition={150} />
          {post.photoUrls.length > 1 ? (
            <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
              <AppText variant="metaSm" color={Palette.white} style={{ fontSize: 10 }}>1/{post.photoUrls.length}</AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <Image source={plantPhotoForSeed(post.id)} style={{ width: '100%', height: 220 }} contentFit="cover" transition={150} />
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 5 }}>
        <Pressable onPress={toggleLike} accessibilityRole="button" accessibilityLabel={liked ? 'Unlike' : 'Like'} accessibilityState={{ selected: liked }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
          <Icon name="heart" size={18} color={liked ? Palette.terra : t.fgMuted} filled={liked} />
          <AppText variant="meta" color={liked ? Palette.terra : t.fgMuted} style={{ fontSize: 12 }}>{likeCount}</AppText>
        </Pressable>
        <Pressable onPress={() => router.push('/(app)/messages')} accessibilityRole="button" accessibilityLabel="Comments" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
          <Icon name="comment" size={18} tone="muted" />
          <AppText variant="meta" tone="muted" style={{ fontSize: 12 }}>{post.commentCount}</AppText>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setSaved((s) => !s)} accessibilityRole="button" accessibilityLabel={saved ? 'Remove bookmark' : 'Save'} accessibilityState={{ selected: saved }} style={{ paddingVertical: 4, paddingLeft: 8 }}>
          <Icon name="bookmark" size={18} color={saved ? Palette.ever500 : t.fgMuted} filled={saved} />
        </Pressable>
      </View>
      <View style={{ paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 }}>
        <AppText variant="small" style={{ fontSize: 13, lineHeight: 20 }}>
          <AppText variant="small" color={t.ever700} style={{ fontSize: 13, fontFamily: fontFamily('body', '600') }}>@{post.author.handle}</AppText> {post.caption}
        </AppText>
        {post.taggedPlant ? (
          <Pressable
            onPress={() => router.push(`/(app)/plant/${post.taggedPlant!.id}`)}
            accessibilityLabel={`View ${post.taggedPlant.label}`}
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, backgroundColor: t.accentTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}
          >
            <Icon name="leaf" size={13} color={Palette.ever500} />
            <AppText variant="small" color={Palette.ever500} style={{ fontSize: 12 }}>{post.taggedPlant.label}</AppText>
          </Pressable>
        ) : null}
      </View>
    </Card>
    <PostOptionsSheet
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      onReport={() => {
        setMenuOpen(false);
        router.push(`/(app)/report?type=post&id=${post.id}&handle=@${post.author.handle}`);
      }}
      onDelete={isOwn ? () => { setMenuOpen(false); void deletePost(post.id); } : undefined}
    />
    </>
  );
}

export default function CommunityScreen() {
  const t = useTheme();
  const router = useRouter();
  const feedData = useCommunityFeed();
  const feed = feedData ?? [];
  const [tab, setTab] = useState('feed');
  const [feedMode, setFeedMode] = useState<'discover' | 'following'>('discover');
  const loading = tab === 'feed' && feedData === undefined;

  return (
    <View style={{ flex: 1, backgroundColor: t.ever100 }}>
      <DataGate loading={loading}>
      <AppHeader
        title="Community"
        trailing={
          <>
            <IconButton icon="comment" accessibilityLabel="Messages" badgeCount={1} onPress={() => router.push('/(app)/messages')} />
            <IconButton icon="bell" accessibilityLabel="Notifications" badgeCount={1} onPress={() => router.push('/(app)/notifications')} />
          </>
        }
      />
      <TopTabs
        tabs={[
          { key: 'feed', label: 'Feed' },
          { key: 'swap', label: 'Swap' },
          { key: 'challenges', label: 'Challenges' },
        ]}
        activeKey={tab}
        onChange={setTab}
      />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: Spacing.xl, paddingBottom: 140, gap: Spacing.lg, paddingTop: Spacing.md }}>
        {tab === 'feed' ? (
          <>
            <SegmentedControl
              options={[
                { value: 'discover', label: 'Discover' },
                { value: 'following', label: 'Following' },
              ]}
              value={feedMode}
              onChange={setFeedMode}
            />
            {(feedMode === 'following' ? feed.filter((p) => p.following) : feed).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            <NeuSurface elevation="pressed" radius={18} stretch style={{ alignItems: 'center', paddingVertical: 24, paddingHorizontal: 18, marginTop: 4 }}>
              <View style={{ opacity: 0.75, marginBottom: 8 }}>
                <Icon name="people" size={26} tone="accent" />
              </View>
              <AppText variant="bodyBold" color={t.ever700} style={{ fontSize: 14.5 }}>Quiet over here</AppText>
              <AppText variant="small" tone="muted" align="center" style={{ marginTop: 3, maxWidth: 220 }}>
                Follow a few gardeners and their wins will show up in Following.
              </AppText>
            </NeuSurface>
          </>
        ) : tab === 'swap' ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md }}>
            {[
              { id: 'sw1', tag: 'Offering' as const, title: 'Pilea pups ×3', seek: 'Seeking: any trailing pothos' },
              { id: 'sw2', tag: 'Offering' as const, title: 'Monstera cutting', seek: 'Seeking: ZZ or snake plant' },
              { id: 'sw3', tag: 'Seeking' as const, title: 'String of hearts', seek: 'Offering: spider plant babies' },
              { id: 'sw4', tag: 'Offering' as const, title: 'Basil seedlings', seek: 'Local pickup · Lisbon' },
            ].map((l) => (
              <View key={l.id} style={{ width: '47.5%' }}>
                <SwapListingCard listing={l} onMessage={() => router.push('/(app)/messages')} />
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {[
              { id: 'ch1', title: '#BrightWindow', description: 'Best growth in 30 days of good light.', metaLabel: 'Ends in 12 days · 248 entries' },
              { id: 'ch2', title: 'Rescue & Revive', description: 'Bring one back from the brink.', metaLabel: 'Ends in 5 days · 96 entries' },
              { id: 'ch3', title: 'First Bloom', description: "Share your plant's first flower.", metaLabel: 'Ends in 21 days · 174 entries' },
            ].map((c) => (
              <ChallengeCard key={c.id} challenge={c} onPress={() => {}} />
            ))}
          </View>
        )}
      </ScrollView>
      </DataGate>
    </View>
  );
}
