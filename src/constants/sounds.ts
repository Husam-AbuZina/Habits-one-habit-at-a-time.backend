export type SoundCategory = "completion" | "failure" | "notification";

export interface SoundDefinition {
  id: string;
  name: string;
  category: SoundCategory;
  description: string;
  durationMs: number;
  previewAssetKey: string;
}

export const SOUND_CATALOG: SoundDefinition[] = [
  {
    id: "success-1",
    name: "Bright Bell",
    category: "completion",
    description: "A quick upbeat chime for successful habit completion.",
    durationMs: 850,
    previewAssetKey: "completion/bright-bell.mp3",
  },
  {
    id: "success-2",
    name: "Soft Pop",
    category: "completion",
    description: "A softer success sound for low-friction feedback.",
    durationMs: 620,
    previewAssetKey: "completion/soft-pop.mp3",
  },
  {
    id: "failure-1",
    name: "Muted Buzzer",
    category: "failure",
    description: "A gentle negative cue for failed break habits.",
    durationMs: 900,
    previewAssetKey: "failure/muted-buzzer.mp3",
  },
  {
    id: "failure-2",
    name: "Low Tap",
    category: "failure",
    description: "A subtle warning tap for failure state transitions.",
    durationMs: 500,
    previewAssetKey: "failure/low-tap.mp3",
  },
  {
    id: "notification-1",
    name: "Morning Ping",
    category: "notification",
    description: "A clear reminder sound suited for habit prompts.",
    durationMs: 1000,
    previewAssetKey: "notification/morning-ping.mp3",
  },
  {
    id: "notification-2",
    name: "Ripple",
    category: "notification",
    description: "A softer ambient reminder tone.",
    durationMs: 1200,
    previewAssetKey: "notification/ripple.mp3",
  },
];
