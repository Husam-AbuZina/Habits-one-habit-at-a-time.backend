import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { StatusCodes } from "http-status-codes";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/api-error";
import { hashPassword } from "../utils/password";
import { ensureUserSettings } from "./settings.service";
import { issueAuthTokens } from "./token.service";

const googleClient = new OAuth2Client();
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const firebaseJwks = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

const parseAudienceList = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const redactSubject = (value: string | null | undefined) =>
  value && value.length > 10 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value ?? null;

const decodeJwtPayloadUnsafe = (token: string) => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const json = Buffer.from(parts[1]!, "base64url").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const normalizeAudience = (value: unknown) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  return [];
};

const summarizeJwtUnsafe = (token: string) => {
  const payload = decodeJwtPayloadUnsafe(token);

  return {
    tokenLength: token.length,
    issuer: typeof payload?.iss === "string" ? payload.iss : null,
    audience: normalizeAudience(payload?.aud),
    authorizedParty: typeof payload?.azp === "string" ? payload.azp : null,
    subject: redactSubject(typeof payload?.sub === "string" ? payload.sub : null),
    emailPresent: typeof payload?.email === "string" && payload.email.length > 0,
    firebaseProvider:
      typeof payload?.firebase === "object" &&
      payload.firebase !== null &&
      "sign_in_provider" in payload.firebase &&
      typeof payload.firebase.sign_in_provider === "string"
        ? payload.firebase.sign_in_provider
        : null,
  };
};

const getConfiguredAudience = (provider: "apple" | "google") => {
  const audiences =
    provider === "google"
      ? parseAudienceList(env.GOOGLE_CLIENT_IDS)
      : parseAudienceList(env.APPLE_CLIENT_IDS);

  if (audiences.length === 0) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      `${provider} auth is not configured on the server`,
    );
  }

  return audiences;
};

export type VerifiedSocialProfile = {
  provider: "apple" | "google";
  subject: string;
  email: string | null;
  name?: string | null;
};

type FirebaseTokenPayload = {
  sub?: string;
  email?: string;
  name?: string;
  firebase?: {
    sign_in_provider?: string;
  };
};

const ensureFirebaseProjectId = () => {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      "Firebase auth is not configured on the server",
    );
  }

  return env.FIREBASE_PROJECT_ID;
};

export const verifyGoogleIdentity = async (idToken: string): Promise<VerifiedSocialProfile> => {
  const configuredAudience = getConfiguredAudience("google");
  const tokenSummary = summarizeJwtUnsafe(idToken);

  console.info("[auth:google] Verifying Google token", {
    configuredAudience,
    tokenSummary,
  });

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: configuredAudience,
    });
    payload = ticket.getPayload();
  } catch (error) {
    const rawPayload = decodeJwtPayloadUnsafe(idToken);
    const tokenAudience = typeof rawPayload?.aud === "string" ? rawPayload.aud : null;
    const tokenAzp = typeof rawPayload?.azp === "string" ? rawPayload.azp : null;

    console.warn("[auth:google] Google token verification failed", {
      configuredAudience,
      tokenSummary,
      reason: error instanceof Error ? error.message : "Unknown verification error",
    });

    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Google token verification failed. Check that GOOGLE_CLIENT_IDS includes the token audience used by the app.",
      {
        configuredAudience,
        tokenAudience,
        tokenAzp,
        reason: error instanceof Error ? error.message : "Unknown verification error",
      },
    );
  }

  if (!payload?.sub) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Google token subject is missing");
  }

  console.info("[auth:google] Google token verified", {
    subject: redactSubject(payload.sub),
    email: payload.email ?? null,
    audience: tokenSummary.audience,
  });

  return {
    provider: "google",
    subject: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  };
};

export const verifyFirebaseIdentity = async (
  firebaseIdToken: string,
  provider: "apple" | "google",
): Promise<VerifiedSocialProfile> => {
  const projectId = ensureFirebaseProjectId();
  const tokenSummary = summarizeJwtUnsafe(firebaseIdToken);

  console.info("[auth:firebase] Verifying Firebase token", {
    expectedProjectId: projectId,
    expectedProvider: provider,
    tokenSummary,
  });

  let payload;
  try {
    const verified = await jwtVerify(firebaseIdToken, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    payload = verified.payload;
  } catch (error) {
    console.warn("[auth:firebase] Firebase token verification failed", {
      expectedProjectId: projectId,
      expectedProvider: provider,
      tokenSummary,
      reason: error instanceof Error ? error.message : "Unknown verification error",
    });

    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Firebase token verification failed. Check FIREBASE_PROJECT_ID and make sure the app sends a Firebase ID token.",
      {
        expectedProjectId: projectId,
        reason: error instanceof Error ? error.message : "Unknown verification error",
      },
    );
  }

  const firebasePayload = payload as FirebaseTokenPayload;

  if (typeof firebasePayload.sub !== "string" || firebasePayload.sub.length === 0) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Firebase token subject is missing");
  }

  const actualProvider = firebasePayload.firebase?.sign_in_provider;
  const expectedProvider = provider === "google" ? "google.com" : "apple.com";

  if (actualProvider !== expectedProvider) {
    console.warn("[auth:firebase] Firebase token provider mismatch", {
      expectedProvider,
      actualProvider: actualProvider ?? null,
      tokenSummary,
    });

    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      `Firebase token provider mismatch: expected ${expectedProvider}, received ${actualProvider ?? "unknown"}`,
    );
  }

  console.info("[auth:firebase] Firebase token verified", {
    provider,
    subject: redactSubject(firebasePayload.sub),
    email: firebasePayload.email ?? null,
    firebaseProvider: actualProvider,
  });

  return {
    provider,
    subject: firebasePayload.sub,
    email: typeof firebasePayload.email === "string" ? firebasePayload.email : null,
    name: typeof firebasePayload.name === "string" ? firebasePayload.name : null,
  };
};

export const verifyAppleIdentity = async (
  identityToken: string,
  fallbackName?: string,
): Promise<VerifiedSocialProfile> => {
  const configuredAudience = getConfiguredAudience("apple");
  const tokenSummary = summarizeJwtUnsafe(identityToken);

  console.info("[auth:apple] Verifying Apple token", {
    configuredAudience,
    tokenSummary,
    hasFallbackName: Boolean(fallbackName),
  });

  let payload;
  try {
    const verified = await jwtVerify(identityToken, appleJwks, {
      issuer: "https://appleid.apple.com",
      audience: configuredAudience,
    });
    payload = verified.payload;
  } catch (error) {
    console.warn("[auth:apple] Apple token verification failed", {
      configuredAudience,
      tokenSummary,
      reason: error instanceof Error ? error.message : "Unknown verification error",
    });

    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Apple token verification failed. Check APPLE_CLIENT_IDS and your Apple sign-in app configuration.",
      {
        configuredAudience,
        tokenAudience: tokenSummary.audience,
        tokenIssuer: tokenSummary.issuer,
        reason: error instanceof Error ? error.message : "Unknown verification error",
      },
    );
  }

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Apple token subject is missing");
  }

  console.info("[auth:apple] Apple token verified", {
    subject: redactSubject(payload.sub),
    email: typeof payload.email === "string" ? payload.email : null,
    audience: tokenSummary.audience,
    issuer: tokenSummary.issuer,
  });

  return {
    provider: "apple",
    subject: payload.sub,
    email: typeof payload.email === "string" ? payload.email : null,
    name: fallbackName ?? null,
  };
};

const providerFieldMap = {
  apple: "appleSubject",
  google: "googleSubject",
} as const;

export const signInVerifiedSocialUser = async (
  profile: VerifiedSocialProfile,
  sessionMeta?: { userAgent?: string | null; ipAddress?: string | null },
) => {
  console.info("[auth:social] Resolving social user", {
    provider: profile.provider,
    subject: redactSubject(profile.subject),
    email: profile.email ?? null,
    hasName: Boolean(profile.name),
  });

  const providerField = providerFieldMap[profile.provider];
  let user = await UserModel.findOne({ [providerField]: profile.subject });

  if (!user && profile.email) {
    user = await UserModel.findOne({ email: profile.email.toLowerCase() });
    if (user) {
      console.info("[auth:social] Matched existing user by email", {
        provider: profile.provider,
        userId: user._id.toString(),
      });

      user.set(providerField, profile.subject);
      if (!user.name && profile.name) {
        user.name = profile.name;
      }
      await user.save();
    }
  }

  if (!user) {
    if (!profile.email) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        `This ${profile.provider} account is not linked yet and the provider did not return an email`,
      );
    }

    user = await UserModel.create({
      email: profile.email.toLowerCase(),
      passwordHash: await hashPassword(randomUUID()),
      name: profile.name ?? null,
      appleSubject: profile.provider === "apple" ? profile.subject : null,
      googleSubject: profile.provider === "google" ? profile.subject : null,
    });

    console.info("[auth:social] Created new user from social login", {
      provider: profile.provider,
      userId: user._id.toString(),
      email: user.email,
    });
  } else {
    console.info("[auth:social] Found existing linked user", {
      provider: profile.provider,
      userId: user._id.toString(),
    });
  }

  await ensureUserSettings(user._id.toString());

  const tokens = await issueAuthTokens(
    { _id: user._id.toString(), email: user.email },
    sessionMeta,
  );

  console.info("[auth:social] Issued backend tokens", {
    provider: profile.provider,
    userId: user._id.toString(),
    hasUserAgent: Boolean(sessionMeta?.userAgent),
    hasIpAddress: Boolean(sessionMeta?.ipAddress),
  });

  return { user, tokens };
};
