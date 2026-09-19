import {
  Clapperboard,
  MirrorRound,
  Image as ImageIcon,
  Sparkles,
  Sparkle,
  Heart,
  Flower2,
  Ribbon,
} from 'lucide-react';
import ModeCard from '../components/ModeCard';
import { type Mode } from '../types';

interface HomeScreenProps {
  onSelect: (mode: Mode) => void;
}

const FLOATIES = [
  { Icon: Sparkle, color: '#FF8A3D' },
  { Icon: Heart, color: '#FFB3C8' },
  { Icon: Flower2, color: '#9EDFC4' },
  { Icon: Sparkles, color: '#FFE87A' },
  { Icon: Ribbon, color: '#FFB3C8' },
  { Icon: Sparkle, color: '#93CCFF' },
  { Icon: Sparkles, color: '#FFB3C8' },
  { Icon: Heart, color: '#FF8A3D' },
];

export default function HomeScreen({ onSelect }: HomeScreenProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
      {/* Decorative floating icons */}
      {FLOATIES.map(({ Icon, color }, i) => (
        <span
          key={i}
          className="absolute select-none pointer-events-none opacity-25"
          style={{
            left: `${8 + i * 12}%`,
            top: `${10 + ((i * 17) % 70)}%`,
            transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (10 + i * 5)}deg)`,
          }}
        >
          <Icon size={16 + (i % 3) * 8} strokeWidth={1.75} color={color} />
        </span>
      ))}

      {/* Centered stack: icon, wordmark, mode cards — centered H and V */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-8 z-10 py-6">
        <img
          src={`${import.meta.env.BASE_URL}brand/fox-logo.png`}
          alt="Foxtale Studio logo"
          draggable={false}
          className="h-24 w-auto"
        />
        <h1 className="text-6xl md:text-7xl font-black tracking-tight text-booth-text">
          <span className="text-booth-violet">Fox</span>tale Studio
        </h1>

        {/* Mode cards: one row on desktop */}
        <div className="flex items-center gap-6 flex-wrap justify-center px-4">
          <ModeCard
            title="Classic Booth"
            description="Choose your layout — 3 or 4 shots portrait, or a 2×2 landscape grid."
            icon={<Clapperboard size={40} strokeWidth={1.75} color="#3A2A3A" />}
            compact
            accent="#FF8A3D"
            bg="linear-gradient(135deg, #E8D5FF, #C8E8FF)"
            onClick={() => onSelect('classic')}
          />

          <div className="flex flex-col items-center gap-2 text-booth-muted">
            <div className="w-px h-16 bg-booth-border" />
            <span className="text-xs font-bold tracking-widest uppercase">or</span>
            <div className="w-px h-16 bg-booth-border" />
          </div>

          <ModeCard
            title="Pose Match"
            description="Follow reference poses from a curated pose pack and see how you compare."
            icon={<MirrorRound size={40} strokeWidth={1.75} color="#3A2A3A" />}
            compact
            accent="#FFB3C8"
            bg="linear-gradient(135deg, #FFD6E8, #FFF3C4)"
            onClick={() => onSelect('pose-match')}
          />

          <div className="flex flex-col items-center gap-2 text-booth-muted">
            <div className="w-px h-16 bg-booth-border" />
            <span className="text-xs font-bold tracking-widest uppercase">or</span>
            <div className="w-px h-16 bg-booth-border" />
          </div>

          <ModeCard
            title="Polaroid"
            description="Free-floating instant photos you can drag, resize and rotate on a 9:16 canvas."
            icon={<ImageIcon size={40} strokeWidth={1.75} color="#3A2A3A" />}
            compact
            accent="#9EDFC4"
            bg="linear-gradient(135deg, #C8F5E3, #FFF3C4)"
            onClick={() => onSelect('polaroid')}
          />
        </div>
      </div>
    </div>
  );
}
