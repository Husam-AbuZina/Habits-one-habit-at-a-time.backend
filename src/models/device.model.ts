import { Schema, model } from "mongoose";

const deviceSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    platform: {
      type: String,
      enum: ["android", "ios", "web"],
      required: true,
    },
    appVersion: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      default: null,
    },
    deviceName: {
      type: String,
      default: null,
    },
    pushProvider: {
      type: String,
      enum: ["fcm"],
      default: "fcm",
    },
    notificationPermission: {
      type: String,
      enum: ["granted", "denied", "provisional", "not_determined"],
      default: "not_determined",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: () => new Date(),
    },
    lastRegisteredAt: {
      type: Date,
      default: () => new Date(),
    },
    invalidatedAt: {
      type: Date,
      default: null,
    },
    invalidationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

deviceSchema.index({ userId: 1, isActive: 1, platform: 1 });

export const DeviceModel = model("Device", deviceSchema);
