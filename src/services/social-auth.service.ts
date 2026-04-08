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

const parseAudienceList = (value?: string) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

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

export const verifyGoogleIdentity = async (idToken: string): Promise<VerifiedSocialProfile> => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: getConfiguredAudience("google"),
  });
  const payload = ticket.getPayload();

  if (!payload?.sub) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Google token subject is missing");
  }

  return {
    provider: "google",
    subject: payload.sub,
    email: payload.email ?? null,
    name: payload.name ?? null,
  };
};

export const verifyAppleIdentity = async (
  identityToken: string,
  fallbackName?: string,
): Promise<VerifiedSocialProfile> => {
  const { payload } = await jwtVerify(identityToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: getConfiguredAudience("apple"),
  });

  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Apple token subject is missing");
  }

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
  const providerField = providerFieldMap[profile.provider];
  let user = await UserModel.findOne({ [providerField]: profile.subject });

  if (!user && profile.email) {
    user = await UserModel.findOne({ email: profile.email.toLowerCase() });
    if (user) {
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
  }

  await ensureUserSettings(user._id.toString());

  const tokens = await issueAuthTokens(
    { _id: user._id.toString(), email: user.email },
    sessionMeta,
  );

  return { user, tokens };
};
