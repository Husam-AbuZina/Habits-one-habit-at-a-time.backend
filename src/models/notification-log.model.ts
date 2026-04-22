import { Schema, model } from "mongoose";

const notificationLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    deviceId: {
      type: Schema.Types.ObjectId,
      ref: "Device",
      default: null,
      index: true,
    },
    token: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["reminder", "transactional", "marketing", "system", "test"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    deepLink: {
      type: String,
      default: null,
    },
    data: {
      type: Map,
      of: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["queued", "sent", "failed", "invalid"],
      required: true,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

notificationLogSchema.index({ userId: 1, createdAt: -1 });

export const NotificationLogModel = model("NotificationLog", notificationLogSchema);
