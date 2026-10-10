import {
  ArrowUpRight,
  ArrowRight,
  Camera,
  Images,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import type { Mode } from "../types"

const modes = [
  {
    mode: "classic" as Mode,
    number: "01",
    title: "Classic booth",
    detail: "The timeless photo strip.",
    meta: "3 or 4 shots · strips & grids",
    Icon: Camera,
    className: "classic",
  },
  {
    mode: "pose-match" as Mode,
    number: "02",
    title: "Pose match",
    detail: "A little inspiration. All you.",
    meta: "Pick a reference · strike a pose",
    Icon: ScanFace,
    className: "pose",
  },
  {
    mode: "polaroid" as Mode,
    number: "03",
    title: "Polaroid",
    detail: "Your own little scrapbook.",
    meta: "1–3 photos · make a collage",
    Icon: Images,
    className: "polaroid",
  },
]
export default function HomeScreen({
  onSelect,
}: {
  onSelect: (mode: Mode) => void
}) {
  return (
    <div className="home-screen animate-screen-in">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span /> YOUR COZY CORNER OF THE INTERNET
          </p>
          <h1>
            Little moments.
            <br />
            <em>Lovely tales.</em>
          </h1>
          <p className="hero-description">
            A few smiles, a little mischief, and a memory to keep. Make it yours
            in the Foxtale photo booth.
          </p>
          <button
            className="primary-action"
            onClick={() => onSelect("classic")}
          >
            <Camera size={19} /> Let's make a memory <ArrowRight size={19} />
          </button>
          <p className="hero-note">
            <ShieldCheck size={15} /> Photos stay in your browser. Just for you.
          </p>
        </div>
        <div className="hero-art">
          <div className="art-ring" />
          <span className="art-label">
            <Sparkles size={15} /> A little fox. A lot of heart.
          </span>
          <div className="fox-print">
            <img
              src={`${import.meta.env.BASE_URL}brand/fox-hero.webp`}
              alt="An orange fox holding a camera, ready to capture a little photo magic"
              fetchPriority="high"
              width="1024"
              height="1024"
            />
            <span>oh, these are the good days.</span>
          </div>
          <div className="small-print" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}brand/fox-mark.svg`} alt="" />
            <span>made of memories</span>
          </div>
          <span className="art-star" aria-hidden="true">
            ✳
          </span>
          <span className="art-caption">a little keepsake, a lot of you ↗</span>
        </div>
      </section>
      <section className="modes-section" aria-labelledby="modes-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PICK YOUR KIND OF MAGIC</p>
            <h2 id="modes-title">One booth. Three ways to play.</h2>
          </div>
          <span>Choose · Capture · Make it yours</span>
        </div>
        <div className="mode-grid">
          {modes.map(
            ({ mode, number, title, detail, meta, Icon, className }) => (
              <button
                key={mode}
                className={`experience-card ${className}`}
                onClick={() => onSelect(mode)}
              >
                <div className="experience-top">
                  <span className="experience-icon">
                    <Icon size={25} strokeWidth={1.6} />
                  </span>
                  <span className="experience-number">{number}</span>
                </div>
                <div className="experience-bottom">
                  <div>
                    <h3>{title}</h3>
                    <p>{detail}</p>
                    <span>{meta}</span>
                  </div>
                  <ArrowUpRight size={23} />
                </div>
              </button>
            ),
          )}
        </div>
      </section>
      <footer className="home-footer">
        <span>Made for the moments in between.</span>
        <span>
          With love, Foxtale <span aria-hidden="true">✳</span>
        </span>
      </footer>
    </div>
  )
}
