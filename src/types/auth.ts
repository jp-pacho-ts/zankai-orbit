import type { Profile, Tier, UUID } from './orbit';

/** UI state only. Supabase cookies and RLS remain authoritative. */
export type AuthSessionStatus =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'offline_preview';

export type AuthMethod = 'session_restore' | 'magic_link' | 'email_otp' | 'oauth';

/** Safe subset for the user menu. Never put access or refresh tokens in a store. */
export type AuthUserProfile = Pick<
  Profile,
  | 'id'
  | 'email'
  | 'displayName'
  | 'avatarUrl'
  | 'tier'
  | 'aiMonthlyGenerations'
  | 'maxAiGenerations'
>;

/** Display hints derived from the server profile; never an authorization check. */
export interface TierPermissions {
  tier: Tier;
  canUseWorkspace: boolean;
  canUseTaskBreakdown: boolean;
  canGenerateBoard: boolean;
  remainingBoardGenerations: number;
  maxBoardGenerations: number;
}

export type AuthSessionState =
  | {
      status: 'unauthenticated';
      profile: null;
      permissions: null;
    }
  | {
      status: 'authenticating';
      method: AuthMethod;
      profile: null;
      permissions: null;
    }
  | {
      status: 'authenticated';
      userId: UUID;
      /** Null only while the signup trigger/profile read is being reconciled. */
      profile: AuthUserProfile | null;
      permissions: TierPermissions | null;
    }
  | {
      status: 'offline_preview';
      profile: null;
      permissions: null;
    };

export type OAuthProvider = 'google' | 'github';

/** Request an email link; shouldCreateUser follows the selected sign-in/up flow. */
export interface MagicLinkSignInPayload {
  email: string;
  redirectTo: string;
  shouldCreateUser: boolean;
}

/** Request an email one-time code through the passwordless email flow. */
export interface EmailOtpSignInPayload {
  email: string;
  shouldCreateUser: boolean;
}

/** The code is transient: never persist or log it. */
export interface EmailOtpVerificationPayload {
  email: string;
  token: string;
}

/** Redirect target is a configured same-origin auth callback URL. */
export interface OAuthSignInPayload {
  provider: OAuthProvider;
  redirectTo: string;
}

