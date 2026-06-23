import { useSignIn, useSignUp, useSSO } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { BrandMark } from '@/components/domain/brand-mark';
import { OAuthButton } from '@/components/domain/oauth-button';
import { Icon } from '@/components/icon';
import { NeuPressable } from '@/components/neu-surface';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { Wordmark } from '@/components/ui/wordmark';
import { Palette, Radius, Spacing } from '@/constants/tokens';
import { useTheme } from '@/theme';

/**
 * Email-code (OTP) sign-in using @clerk/expo's Future API (`signIn.emailCode.sendCode/verifyCode`
 * + `signIn.finalize()`; the methods return `{ error }` rather than throwing). Route GATING is
 * Phase 4 — here we just need a working sign-in to give Convex an identity.
 */
// Ensures the OAuth web browser session is dismissed/completed on return (no-op on web).
WebBrowser.maybeCompleteAuthSession();

function errMessage(error: unknown, fallback: string): string {
  const m = (error as { message?: string; errors?: { message?: string }[] } | null) ?? null;
  return m?.errors?.[0]?.message ?? m?.message ?? fallback;
}

export default function LoginScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Route through the splash gate, which sends new users to onboarding and returning users to the app.
  const afterAuth = () => router.replace('/');

  // Google OAuth via Clerk SSO. On web the flow runs in a popup; on native, in an auth browser
  // returning to the app's scheme. Requires Google enabled in the Clerk dashboard.
  const signInWithGoogle = async () => {
    if (oauthBusy) return;
    setOauthBusy(true);
    setError(null);
    try {
      const redirectUrl = AuthSession.makeRedirectUri();
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: 'oauth_google', redirectUrl });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        afterAuth();
      }
    } catch (e) {
      setError(errMessage(e, 'Google sign-in failed. Try again.'));
    } finally {
      setOauthBusy(false);
    }
  };

  const sendCode = async () => {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    // Try existing account first; if that email has no account, sign up instead.
    const created = await signIn.create({ identifier: email.trim() });
    if (!created.error) {
      const sent = await signIn.emailCode.sendCode();
      if (sent.error) setError(errMessage(sent.error, 'Could not send a code. Try again.'));
      else {
        setMode('in');
        setStep('code');
      }
    } else {
      const signedUp = await signUp.create({ emailAddress: email.trim() });
      if (signedUp.error) {
        setError(errMessage(signedUp.error, 'Could not send a code. Try again.'));
      } else {
        const sent = await signUp.verifications.sendEmailCode();
        if (sent.error) setError(errMessage(sent.error, 'Could not send a code. Try again.'));
        else {
          setMode('up');
          setStep('code');
        }
      }
    }
    setBusy(false);
  };

  const verify = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setError(null);
    if (mode === 'in') {
      const res = await signIn.emailCode.verifyCode({ code: code.trim() });
      if (res.error) setError(errMessage(res.error, 'That code did not work. Try again.'));
      else if (signIn.status === 'complete') {
        await signIn.finalize();
        afterAuth();
      } else setError('Enter the 6-digit code we emailed you.');
    } else {
      const res = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (res.error) setError(errMessage(res.error, 'That code did not work. Try again.'));
      else if (signUp.status === 'complete') {
        await signUp.finalize();
        afterAuth();
      } else setError('Enter the 6-digit code we emailed you.');
    }
    setBusy(false);
  };

  const onEmail = step === 'email';
  const canContinue = onEmail ? !!email.trim() && !busy : !!code.trim() && !busy;

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: insets.top + Spacing.lg }}>
      {/* header */}
      <View style={{ alignItems: 'center', gap: Spacing.sm, marginTop: 10 }}>
        <BrandMark size={64} animate="bloom" />
        <Wordmark size={28} />
      </View>

      <View style={{ alignItems: 'center', gap: 4, marginTop: Spacing.lg }}>
        <AppText variant="display2">Welcome</AppText>
        <AppText variant="body" tone="subtle" align="center">
          {onEmail ? 'Sign in to tend your garden.' : `Enter the code we sent to ${email}.`}
        </AppText>
      </View>

      {/* email / code */}
      <View style={{ gap: Spacing.md, marginTop: Spacing.xl }}>
        {onEmail ? (
          <TextField
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            leadingIcon="mail"
            keyboardType="email-address"
            onSubmitEditing={sendCode}
          />
        ) : (
          <TextField
            value={code}
            onChangeText={setCode}
            placeholder="6-digit code"
            leadingIcon="lock"
            keyboardType="number-pad"
            onSubmitEditing={verify}
          />
        )}

        <NeuPressable
          onPress={onEmail ? sendCode : verify}
          radius={Radius.md}
          elevation="raised"
          stretch
          backgroundColor={t.ever100}
          accessibilityLabel={onEmail ? 'Continue with email' : 'Verify code'}
          accessibilityState={{ disabled: !canContinue }}
          style={{ height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: canContinue ? 1 : 0.5 }}
        >
          <AppText variant="bodyBold" color={Palette.ever400} style={{ fontSize: 15 }}>
            {onEmail ? 'Continue with email' : busy ? 'Verifying…' : 'Verify code'}
          </AppText>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.accentTint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="arrowRight" size={15} color={Palette.ever400} />
          </View>
        </NeuPressable>

        {error ? (
          <AppText variant="small" tone="danger" align="center">
            {error}
          </AppText>
        ) : null}

        {!onEmail ? (
          <AppText
            variant="small"
            tone="subtle"
            align="center"
            onPress={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
          >
            Use a different email
          </AppText>
        ) : null}
      </View>

      {/* OR */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.lg }}>
        <View style={{ flex: 1, height: 1, backgroundColor: t.fgSubtle, opacity: 0.3 }} />
        <AppText variant="meta" tone="subtle" uppercase>
          or
        </AppText>
        <View style={{ flex: 1, height: 1, backgroundColor: t.fgSubtle, opacity: 0.3 }} />
      </View>

      {/* oauth — Google is live; Apple is wired in a later phase (needs a dev build) */}
      <View style={{ gap: Spacing.md }}>
        <OAuthButton provider="google" onPress={signInWithGoogle} loading={oauthBusy} />
        <View style={{ opacity: 0.5 }}>
          <OAuthButton provider="apple" onPress={() => {}} />
        </View>
      </View>

      {/* legal */}
      <View style={{ marginTop: Spacing.xl }}>
        <AppText variant="small" tone="subtle" align="center">
          By continuing, you agree to our{' '}
          <AppText
            variant="small"
            color={Palette.ever400}
            style={{ textDecorationLine: 'underline' }}
            onPress={() => router.push('/(app)/profile/settings/terms')}
          >
            Terms
          </AppText>
          {' & '}
          <AppText
            variant="small"
            color={Palette.ever400}
            style={{ textDecorationLine: 'underline' }}
            onPress={() => router.push('/(app)/profile/settings/privacy')}
          >
            Privacy
          </AppText>
          .
        </AppText>
      </View>
    </View>
  );
}
