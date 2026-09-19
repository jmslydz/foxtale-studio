import type { ComponentType } from 'react';
import {
  Sparkle4,
  Star5,
  SparkleCluster,
  Moon,
  Sun,
  Cloud,
  Rainbow,
  MoonAndStars,
  SparkleBurst,
  WashiTape,
  Squiggle,
  DottedArrow,
  SpeechBubble,
  Crown,
  SmallCamera,
} from './components/stickers';

export type Screen = 'home' | 'setup' | 'capture' | 'review' | 'editor' | 'done';
export type Mode = 'classic' | 'pose-match' | 'polaroid';
export type Layout = '3-portrait' | '4-portrait' | '4-landscape';

/** Sticker size limits, in % of canvas width. */
export const STICKER_SIZE_MIN = 5;
export const STICKER_SIZE_MAX = 60;
/** Default placement sizes: image/SVG glyphs start bigger than emoji. */
export const STICKER_SIZE_DEFAULT_GRAPHIC = 22;
export const STICKER_SIZE_DEFAULT_EMOJI = 10;

export type Shot = { id: string; blob: Blob; url: string };

export interface PlacedSticker {
  id: string;
  stickerId: string;
  x: number;
  y: number;
  /** Sticker width as % of the canvas width (height follows 1:1). */
  sizePct: number;
  rotation: number;
}

/** A reference pose photo (from the manifest) for pose-match mode. */
export type PoseRef = {
  id: string;
  label: string;
  category: string;
  src: string;
};

/** A free-floating polaroid card on the 9:16 polaroid canvas. */
export interface PlacedPolaroid {
  id: string;
  /** Index into the session's shots array. */
  shotIndex: number;
  /** Card center X, % of canvas width. */
  x: number;
  /** Card center Y, % of canvas height. */
  y: number;
  /** Card width, % of canvas width. */
  width: number;
  rotation: number;
}

/** A sticker definition: emoji, SVG component, or an image src. */
export type StickerDef = {
  id: string;
  label: string;
  emoji?: string;
  /** SVG sticker component; takes a pixel size. */
  Svg?: ComponentType<{ size: number }>;
  /** Public-relative image path for PNG/WebP/SVG stickers (from the manifest). */
  src?: string;
};

export const SCREEN_STEPS: Record<Screen, number> = {
  home: 1,
  setup: 2,
  capture: 3,
  review: 4,
  editor: 5,
  done: 6,
};

export const STEPS = ['Choose', 'Setup', 'Capture', 'Review', 'Edit', 'Done'];

export const SHOT_COUNTS: Record<string, number> = {
  '3-portrait': 3,
  '4-portrait': 4,
  '4-landscape': 4,
  'pose-match': 4,
};

export const PASTEL_PHOTO_COLORS = [
  { from: '#FFD6E8', to: '#FFB3C8' },
  { from: '#E8D5FF', to: '#FFBFA3' },
  { from: '#C8F5E3', to: '#9EDFC4' },
  { from: '#FFF3C4', to: '#FFE87A' },
  { from: '#C8E8FF', to: '#93CCFF' },
  { from: '#FFE5D0', to: '#FFBFA3' },
];

export const BG_COLORS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Pink', value: '#FFD6E8' },
  { label: 'Lavender', value: '#E8D5FF' },
  { label: 'Mint', value: '#C8F5E3' },
  { label: 'Yellow', value: '#FFF3C4' },
  { label: 'Sky', value: '#C8E8FF' },
  { label: 'Peach', value: '#FFE5D0' },
  { label: 'Noir', value: '#2A1A2A' },
];

export const STICKER_CATEGORIES: { name: string; stickers: StickerDef[] }[] = [
  {
    name: 'Stars',
    stickers: [
      { id: 'star-sparkle-4', label: '4-point sparkle', Svg: Sparkle4 },
      { id: 'star-star-5', label: 'five-point star', Svg: Star5 },
      { id: 'star-cluster', label: 'sparkle cluster', Svg: SparkleCluster },
      { id: 'star-moon', label: 'moon', Svg: Moon },
      { id: 'star-sun', label: 'sun', Svg: Sun },
    ],
  },
  {
    name: 'Hearts',
    stickers: [
      { id: 'heart-sparkling', label: 'sparkling heart', emoji: '💖' },
      { id: 'heart-two', label: 'two hearts', emoji: '💕' },
      { id: 'heart-growing', label: 'growing heart', emoji: '💗' },
      { id: 'heart-ribbon', label: 'heart ribbon', emoji: '💝' },
      { id: 'heart-pink', label: 'pink heart', emoji: '🩷' },
      { id: 'heart-suit', label: 'heart suit', emoji: '♥' },
    ],
  },
  {
    name: 'Ribbons',
    stickers: [
      { id: 'ribbon-bow', label: 'ribbon', emoji: '🎀' },
      { id: 'ribbon-confetti', label: 'confetti', emoji: '🎊' },
      { id: 'ribbon-party', label: 'party', emoji: '🎉' },
      { id: 'ribbon-balloon', label: 'balloon', emoji: '🎈' },
      { id: 'ribbon-gift', label: 'gift', emoji: '🎁' },
    ],
  },
  {
    name: 'Nature',
    stickers: [
      { id: 'nature-blossom', label: 'cherry blossom', emoji: '🌸' },
      { id: 'nature-hibiscus', label: 'hibiscus', emoji: '🌺' },
      { id: 'nature-daisy', label: 'daisy', emoji: '🌼' },
      { id: 'nature-tulip', label: 'tulip', emoji: '🌷' },
      { id: 'nature-strawberry', label: 'strawberry', emoji: '🍓' },
      { id: 'nature-butterfly', label: 'butterfly', emoji: '🦋' },
    ],
  },
  {
    name: 'Sky',
    stickers: [
      { id: 'sky-cloud', label: 'cloud', Svg: Cloud },
      { id: 'sky-rainbow', label: 'rainbow', Svg: Rainbow },
      { id: 'sky-moon-stars', label: 'moon and stars', Svg: MoonAndStars },
      { id: 'sky-burst', label: 'sparkle burst', Svg: SparkleBurst },
    ],
  },
  {
    name: 'Doodles',
    stickers: [
      { id: 'doodle-washi', label: 'washi tape strip', Svg: WashiTape },
      { id: 'doodle-squiggle', label: 'squiggle line', Svg: Squiggle },
      { id: 'doodle-arrow', label: 'dotted arrow', Svg: DottedArrow },
      { id: 'doodle-bubble', label: 'speech bubble', Svg: SpeechBubble },
      { id: 'doodle-crown', label: 'crown', Svg: Crown },
      { id: 'doodle-camera', label: 'small camera', Svg: SmallCamera },
    ],
  },
];
