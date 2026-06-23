/**
 * access — shared-location grants the owner hands out (Profile › Permissions › Shared access).
 * Invite by email + role + which locations; the invitee is matched & activated on sign-in
 * (see users.ensureUser). The invite email itself is mocked (no email provider wired).
 */
import { internalAction, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { getCurrentUser, getCurrentUserOrThrow } from './lib/auth';
import type { AccessGrant } from '../src/data/types';

const ROLE = v.union(v.literal('family'), v.literal('gardener'), v.literal('housekeeper'));

export const inviteAccess = mutation({
  args: {
    email: v.string(),
    role: ROLE,
    locationIds: v.array(v.id('locations')),
  },
  handler: async (ctx, { email, role, locationIds }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const clean = email.trim().toLowerCase();
    if (!clean.includes('@')) throw new Error('A valid email is required');
    if (locationIds.length === 0) throw new Error('Pick at least one location to share');

    // only the owner's own locations can be shared
    const locationNames: string[] = [];
    for (const lid of locationIds) {
      const loc = await ctx.db.get(lid);
      if (!loc || loc.userId !== user._id) throw new Error('Location not found');
      locationNames.push(loc.name);
    }

    // The invitee is matched & activated on their next sign-in (we don't store emails to look up).
    const id = await ctx.db.insert('accessGrants', {
      ownerId: user._id,
      email: clean,
      role,
      locationIds,
      status: 'pending',
      createdAt: Date.now(),
    });

    // Send the invite email out-of-band (best effort — the grant exists regardless).
    await ctx.scheduler.runAfter(0, internal.access.sendInviteEmail, {
      email: clean,
      ownerName: user.name,
      role,
      locationNames,
    });
    return id;
  },
});

/**
 * Email the invite via Resend (https://resend.com). Best-effort: scheduled from inviteAccess so a
 * send failure never blocks the grant. Requires Convex env vars:
 *   RESEND_API_KEY  (required — without it nothing is sent)
 *   RESEND_FROM     (optional, default "evergreen <onboarding@resend.dev>" — Resend's test sender,
 *                    which can only deliver to your own verified address until you verify a domain)
 *   APP_INVITE_URL  (optional — the install / open-app link in the email)
 */
export const sendInviteEmail = internalAction({
  args: { email: v.string(), ownerName: v.string(), role: ROLE, locationNames: v.array(v.string()) },
  handler: async (_ctx, { email, ownerName, role, locationNames }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(`[invite] RESEND_API_KEY not set — no email sent to ${email}`);
      return null;
    }
    const from = process.env.RESEND_FROM ?? 'evergreen <onboarding@resend.dev>';
    const appUrl = process.env.APP_INVITE_URL ?? 'https://evergreen.app';
    const places = locationNames.length ? locationNames.join(', ') : 'their garden';
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

    // Brand mark (a 5-petal bloom) + the "evergreen" wordmark, in a table header for email clients.
    const bloom = `
      <svg width="30" height="30" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <g fill="#2c694e">
          <ellipse cx="120" cy="70" rx="30" ry="54"/>
          <ellipse cx="120" cy="70" rx="30" ry="54" transform="rotate(72 120 120)"/>
          <ellipse cx="120" cy="70" rx="30" ry="54" transform="rotate(144 120 120)"/>
          <ellipse cx="120" cy="70" rx="30" ry="54" transform="rotate(216 120 120)"/>
          <ellipse cx="120" cy="70" rx="30" ry="54" transform="rotate(288 120 120)"/>
        </g>
        <circle cx="120" cy="120" r="22" fill="#0c1f17"/>
      </svg>`;

    const html = `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#16271e">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px"><tr>
          <td style="vertical-align:middle;padding-right:12px">
            <div style="width:52px;height:52px;border-radius:15px;background:#d8e9df;text-align:center;line-height:52px">${bloom}</div>
          </td>
          <td style="vertical-align:middle">
            <span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:#1b4332">ever<span style="color:#4daf82">green</span></span>
          </td>
        </tr></table>
        <h2 style="color:#2c694e;font-size:19px;margin:0 0 8px">${ownerName} invited you</h2>
        <p>You've been added as <strong>${roleLabel}</strong> to help care for plants at <strong>${places}</strong>.</p>
        <p>Install <strong>evergreen</strong> and sign in with this email (<strong>${email}</strong>) — your access turns on automatically.</p>
        <p style="margin:24px 0">
          <a href="${appUrl}" style="background:#2c694e;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;display:inline-block">Get the app</a>
        </p>
        <p style="color:#7d9488;font-size:13px">If you didn't expect this, you can ignore this email.</p>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `${ownerName} invited you to help care for their plants`,
        html,
      }),
    });
    if (!res.ok) throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
    return null;
  },
});

export const listGrants = query({
  args: {},
  handler: async (ctx): Promise<AccessGrant[]> => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];
    const grants = await ctx.db
      .query('accessGrants')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .collect();
    grants.sort((a, b) => b.createdAt - a.createdAt);
    const out: AccessGrant[] = [];
    for (const g of grants) {
      const grantee = g.granteeUserId ? await ctx.db.get(g.granteeUserId) : null;
      out.push({
        id: g._id,
        email: g.email,
        role: g.role,
        status: g.status,
        locationCount: g.locationIds.length,
        granteeName: grantee?.name,
      });
    }
    return out;
  },
});

export const revokeAccess = mutation({
  args: { grantId: v.id('accessGrants') },
  handler: async (ctx, { grantId }) => {
    const user = await getCurrentUserOrThrow(ctx);
    const grant = await ctx.db.get(grantId);
    if (!grant || grant.ownerId !== user._id) throw new Error('Grant not found');
    await ctx.db.delete(grantId);
    return null;
  },
});
