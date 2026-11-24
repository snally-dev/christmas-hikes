import type { Discovery, Feeling, Weather } from "../types";

export const feelingOptions: { value: Feeling; label: string; emoji: string }[] = [
  { value: "amazing", label: "Amazing", emoji: "🤩" },
  { value: "happy", label: "Happy", emoji: "😊" },
  { value: "proud", label: "Proud", emoji: "🥾" },
  { value: "tired", label: "Tired", emoji: "😮‍💨" },
  { value: "challenged", label: "Challenged", emoji: "💪" },
];
export const weatherOptions: { value: Weather; label: string; emoji: string }[] = [
  { value: "sunny", label: "Sunny", emoji: "☀️" },
  { value: "cloudy", label: "Cloudy", emoji: "☁️" },
  { value: "windy", label: "Windy", emoji: "🍃" },
  { value: "rainy", label: "Rainy", emoji: "🌧️" },
  { value: "snowy", label: "Snowy", emoji: "❄️" },
  { value: "cold", label: "Cold", emoji: "🧣" },
];
export const discoveryOptions: { value: Discovery; label: string; emoji: string }[] = [
  { value: "wildlife", label: "Wildlife", emoji: "🦌" },
  { value: "animal_tracks", label: "Animal tracks", emoji: "🐾" },
  { value: "beautiful_view", label: "A beautiful view", emoji: "🏞️" },
  { value: "history", label: "Something historic", emoji: "🏛️" },
  { value: "water", label: "A river or creek", emoji: "🌊" },
  { value: "rocks", label: "Interesting rocks", emoji: "🪨" },
  { value: "mysterious", label: "Something mysterious", emoji: "🔎" },
  { value: "unexpected", label: "Something unexpected", emoji: "✨" },
];

export const labelFor = <T extends string>(options: { value: T; label: string }[], value?: T) =>
  options.find((option) => option.value === value)?.label ?? "";
