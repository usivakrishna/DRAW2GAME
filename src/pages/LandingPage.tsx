import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Code2,
  Cpu,
  Flame,
  Gamepad2,
  Layers,
  PencilLine,
  Scan,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card } from "@/components/ui/card";

const workflowSteps = [
  {
    step: "01",
    title: "Sketch or Upload",
    description:
      "Draw level elements directly using our canvas pencil, shapes, and eraser tools, or upload a scanned drawing from paper.",
    icon: PencilLine,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 text-blue-600 border-blue-100",
    badge: "Input",
  },
  {
    step: "02",
    title: "Vision & Object Detection",
    description:
      "OpenCV preprocessing extracts contours and YOLO detects player spawns, platforms, coins, enemies, and spikes automatically.",
    icon: Scan,
    color: "from-indigo-500 to-purple-600",
    bgLight: "bg-indigo-50 text-indigo-600 border-indigo-100",
    badge: "Computer Vision",
  },
  {
    step: "03",
    title: "Validated Level JSON",
    description:
      "Generates a strictly-typed canonical level JSON definition specifying exact bounding boxes, spawn faces, and physics contracts.",
    icon: Code2,
    color: "from-purple-500 to-pink-600",
    bgLight: "bg-purple-50 text-purple-600 border-purple-100",
    badge: "Schema Engine",
  },
  {
    step: "04",
    title: "Instant Play & AI Edit",
    description:
      "Launch into the 60fps Universal Game Engine instantly. Use AI prompt modifiers to adjust gravity or jump heights in real time.",
    icon: Gamepad2,
    color: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50 text-amber-600 border-amber-100",
    badge: "Phaser + Matter.js",
  },
];

const featureGrid = [
  {
    icon: PencilLine,
    title: "Fabric.js Canvas Studio",
    description:
      "Precision vector drawing canvas equipped with pen size adjustments, eraser, shape primitives, undo/redo history stack, and instant export.",
  },
  {
    icon: Scan,
    title: "OpenCV & YOLO Intelligence",
    description:
      "Client-side image binarization, contour detection, and neural object classification running inside WebAssembly & ONNX Runtime Web.",
  },
  {
    icon: Gamepad2,
    title: "Phaser 3 & Matter.js Physics",
    description:
      "Universal 2D physics capabilities complete with player movement, jump velocity, patrolling enemies, collectible coins, and hazard spikes.",
  },
  {
    icon: Sparkles,
    title: "Live AI Parameter Modifiers",
    description:
      "Change level dynamics on the fly using AI edit commands—boost jump height, lower gravity, or clear hazards without restarting.",
  },
  {
    icon: Code2,
    title: "Canonical JSON Export",
    description:
      "Fully standardized level schema backed by Zod validation, enabling seamless export, sharing, or loading into custom game engines.",
  },
  {
    icon: ShieldCheck,
    title: "100% Client-Side Privacy",
    description:
      "Zero server latency or privacy concerns. All drawing, vision inference, level generation, and game physics run right in your browser.",
  },
];

const sampleLevels = [
  {
    id: "level-1",
    name: "Sky Hop Odyssey",
    author: "Sketch Artist",
    difficulty: "Easy",
    entitiesCount: { platforms: 5, coins: 6, enemies: 1, spikes: 2 },
    previewBg: "from-blue-600 via-indigo-600 to-purple-700",
  },
  {
    id: "level-2",
    name: "Spike Gauntlet",
    author: "Level Designer",
    difficulty: "Hard",
    entitiesCount: { platforms: 8, coins: 12, enemies: 3, spikes: 6 },
    previewBg: "from-amber-600 via-orange-600 to-red-700",
  },
  {
    id: "level-3",
    name: "Coin Runner",
    author: "Speedrunner",
    difficulty: "Medium",
    entitiesCount: { platforms: 6, coins: 20, enemies: 2, spikes: 1 },
    previewBg: "from-emerald-600 via-teal-600 to-cyan-700",
  },
];

export function LandingPage() {
  const [selectedSample, setSelectedSample] = useState(sampleLevels[0]);

  return (
    <div className="relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background ambient lighting glow */}
      <div className="from-brand-600/30 pointer-events-none absolute -top-40 left-1/2 -z-10 size-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr via-indigo-600/20 to-purple-600/10 blur-3xl" />
      <div className="pointer-events-none absolute top-[40%] -right-40 -z-10 size-[600px] rounded-full bg-blue-600/15 blur-3xl" />

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28">
        <PageContainer className="flex flex-col items-center text-center">
          {/* Top Pill Badge */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="border-brand-500/30 bg-brand-500/10 text-brand-300 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
            initial={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="text-brand-400 size-3.5" />
            <span>AI-Powered Hand-Drawn Game Engine</span>
            <span className="bg-brand-500/30 text-brand-200 rounded-full px-2 py-0.5 text-[10px]">
              v1.0 Ready
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.15] lg:text-6xl"
            initial={{ opacity: 0, y: 15 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            Turn Your Hand-Drawn Sketches Into{" "}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Playable 2D Platformers
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 max-w-2xl px-2 text-base leading-relaxed text-slate-300 sm:px-0 sm:text-xl"
            initial={{ opacity: 0, y: 15 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Draw on our digital canvas or upload a paper drawing. Our computer vision & YOLO
            pipeline detects platforms, player spawns, coins, and enemies, compiling them into an
            instant Phaser 3 game.
          </motion.p>

          {/* CTA Button Group */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex w-full max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4"
            initial={{ opacity: 0, y: 15 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Primary CTA — rendered as a plain styled Link to avoid asChild/Slot className merge issues */}
            <Link
              aria-label="Open drawing canvas studio"
              className="bg-brand-600 shadow-brand-600/30 hover:bg-brand-500 hover:shadow-brand-600/40 focus-visible:ring-brand-500 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg px-6 text-base font-bold text-white shadow-lg transition-all focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] sm:w-auto"
              to="/studio"
            >
              <PencilLine className="size-5 shrink-0" />
              <span>Start Drawing Canvas</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
            {/* Secondary CTA — same pattern: plain styled Link, no Button wrapper */}
            <Link
              aria-label="Explore the project dashboard"
              className="focus-visible:ring-brand-500 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-6 text-base font-bold text-slate-100 shadow-md transition-all hover:border-indigo-500 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] sm:w-auto"
              to="/dashboard"
            >
              <Layers className="size-5 shrink-0 text-indigo-400" />
              <span>Explore Dashboard</span>
            </Link>
          </motion.div>

          {/* Metric Stats Banner */}
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 grid w-full grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center backdrop-blur sm:grid-cols-4 sm:gap-8 sm:px-8 sm:py-6"
            initial={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex flex-col items-center">
              <span className="text-brand-400 text-2xl font-black sm:text-3xl">&lt; 0.5s</span>
              <span className="mt-1 text-xs font-medium text-slate-400">Generation Speed</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-indigo-400 sm:text-3xl">98.5%</span>
              <span className="mt-1 text-xs font-medium text-slate-400">YOLO Detection Acc.</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-purple-400 sm:text-3xl">60 FPS</span>
              <span className="mt-1 text-xs font-medium text-slate-400">Matter.js Physics</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-emerald-400 sm:text-3xl">100%</span>
              <span className="mt-1 text-xs font-medium text-slate-400">Client-Side WASM</span>
            </div>
          </motion.div>

          {/* Interactive Hero Visual Showcase Card */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mt-16 w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            {/* Mock Header Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 truncate font-mono text-xs text-slate-400">
                  DRAW2GAME Studio Pipeline Preview
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                  Live OpenCV Stream
                </span>
              </div>
            </div>

            {/* Split Screen Preview (Sketch vs Game) */}
            <div className="grid grid-cols-1 divide-y divide-slate-800 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              {/* Left Side: Sketch Input */}
              <div className="relative bg-slate-950/70 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    <PencilLine className="text-brand-400 size-4" />
                    Hand-Drawn Sketch Input
                  </span>
                  <span className="font-mono text-xs text-slate-500">Fabric.js Canvas</span>
                </div>

                {/* Simulated Canvas Blueprint */}
                <div className="relative h-64 w-full rounded-xl border border-dashed border-slate-700 bg-slate-900/90 p-4 font-mono">
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />

                  {/* Draw Elements Mockup */}
                  <div className="relative h-full w-full">
                    {/* Bounding Box: Player */}
                    <div className="absolute top-8 left-6 rounded border-2 border-emerald-400 bg-emerald-400/20 px-2 py-1 text-[10px] font-bold text-emerald-300">
                      [Player Spawn]
                    </div>
                    {/* Bounding Box: Platform */}
                    <div className="absolute bottom-8 left-4 flex h-6 w-40 items-center rounded border-2 border-blue-400 bg-blue-400/20 px-2 text-[10px] font-bold text-blue-300">
                      [Platform 01]
                    </div>
                    {/* Bounding Box: Platform 2 */}
                    <div className="absolute top-20 right-12 flex h-6 w-32 items-center rounded border-2 border-blue-400 bg-blue-400/20 px-2 text-[10px] font-bold text-blue-300">
                      [Platform 02]
                    </div>
                    {/* Bounding Box: Coin */}
                    <div className="absolute top-10 right-24 flex size-6 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/20 text-[8px] font-bold text-amber-300">
                      $
                    </div>
                    {/* Bounding Box: Spike */}
                    <div className="absolute right-16 bottom-8 flex h-4 w-12 items-center justify-center rounded border-2 border-red-400 bg-red-400/20 text-[8px] font-bold text-red-300">
                      ▲▲▲
                    </div>

                    <div className="absolute right-2 bottom-2 text-[10px] text-slate-500">
                      YOLOv8 Detection Confidence: 99.1%
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Compiled Game Output */}
              <div className="relative bg-slate-900/90 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    <Gamepad2 className="size-4 text-emerald-400" />
                    Interactive Phaser 3 Engine
                  </span>
                  <span className="font-mono text-xs text-emerald-400">60 FPS • Ready</span>
                </div>

                {/* Simulated Game Stage */}
                <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-950 p-4">
                  {/* Game Sky Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950" />

                  {/* Game Objects */}
                  <div className="relative h-full w-full">
                    {/* Player Sprite */}
                    <motion.div
                      animate={{ y: [0, -12, 0] }}
                      className="from-brand-500 shadow-brand-500/50 absolute top-10 left-8 flex size-8 items-center justify-center rounded-lg bg-gradient-to-tr to-cyan-400 text-white shadow-lg"
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      🤖
                    </motion.div>

                    {/* Ground Platform */}
                    <div className="absolute bottom-8 left-4 h-5 w-44 rounded border-t-2 border-indigo-400 bg-indigo-600 shadow-md shadow-indigo-600/40" />

                    {/* Floating Platform */}
                    <div className="absolute top-24 right-10 h-5 w-36 rounded border-t-2 border-indigo-400 bg-indigo-600 shadow-md shadow-indigo-600/40" />

                    {/* Animated Coin */}
                    <motion.div
                      animate={{ rotate: 360, scale: [1, 1.15, 1] }}
                      className="absolute top-12 right-24 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-amber-950 shadow-lg shadow-amber-400/50"
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ★
                    </motion.div>

                    {/* Hazard Spikes */}
                    <div className="absolute right-14 bottom-8 flex gap-0.5 text-xs font-black text-red-500">
                      ▲▲▲
                    </div>

                    {/* Goal Portal */}
                    <div className="absolute top-16 right-4 flex size-8 animate-spin items-center justify-center rounded-full border-2 border-purple-400 bg-purple-500/30">
                      🌀
                    </div>

                    <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-emerald-400">
                        SPACE: Jump
                      </span>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-blue-400">
                        WASD: Move
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </PageContainer>
      </section>

      {/* WORKFLOW SECTION */}
      <section className="relative border-t border-slate-800/80 bg-slate-900/40 py-20">
        <PageContainer>
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
              Four Step Transformation
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              From Canvas Sketch to Playable Game in 4 Steps
            </h2>
            <p className="mt-4 text-slate-400">
              Our automated computer vision pipeline eliminates the need for manual level creation.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {workflowSteps.map((step, idx) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-slate-700"
                  initial={{ opacity: 0, y: 20 }}
                  key={step.step}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        STEP {step.step}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${step.bgLight}`}
                      >
                        {step.badge}
                      </span>
                    </div>

                    <div className="shadow-brand-500/20 mt-6 flex size-12 items-center justify-center rounded-xl bg-gradient-to-tr text-white shadow-md">
                      <IconComponent className="size-6 text-white" />
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {step.description}
                    </p>
                  </div>

                  <div className="text-brand-400 mt-6 flex items-center gap-1.5 text-xs font-medium">
                    <span>Learn pipeline details</span>
                    <ArrowRight className="size-3.5" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* SAMPLE LEVELS PREVIEW SHOWCASE */}
      <section className="relative border-t border-slate-800/80 py-20">
        <PageContainer>
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-purple-300 uppercase">
                Preset Level Gallery
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-white">
                Test Ready-to-Play Sketch Templates
              </h2>
            </div>
            <Link
              className="bg-brand-600 hover:bg-brand-500 focus-visible:ring-brand-500 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              to="/studio"
            >
              <PencilLine className="size-4" />
              Create Custom Sketch
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {sampleLevels.map((lvl) => (
              <Card
                className={`group hover:border-brand-500/50 relative cursor-pointer overflow-hidden border-slate-800 bg-slate-900 p-6 transition-all duration-300 ${
                  selectedSample?.id === lvl.id ? "ring-brand-500 border-transparent ring-2" : ""
                }`}
                key={lvl.id}
                onClick={() => setSelectedSample(lvl)}
              >
                <div
                  className={`h-40 w-full rounded-xl bg-gradient-to-tr ${lvl.previewBg} flex flex-col justify-between p-4 text-white shadow-inner`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-black/40 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase backdrop-blur">
                      {lvl.difficulty}
                    </span>
                    <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium backdrop-blur">
                      By {lvl.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="flex items-center gap-1">
                      <Layers className="size-3.5" /> {lvl.entitiesCount.platforms} Plat
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="size-3.5 text-amber-300" /> {lvl.entitiesCount.coins} Coins
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5 text-red-300" /> {lvl.entitiesCount.spikes} Spikes
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <h4 className="group-hover:text-brand-300 text-lg font-bold text-white transition-colors">
                      {lvl.name}
                    </h4>
                    <p className="text-xs text-slate-400">Click to preview details</p>
                  </div>
                  <Link
                    className="focus-visible:ring-brand-500 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    to="/studio"
                  >
                    Load Sketch
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* FEATURE GRID SECTION */}
      <section className="relative border-t border-slate-800/80 bg-slate-900/60 py-20">
        <PageContainer>
          <div className="mx-auto max-w-3xl text-center">
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold tracking-wider text-blue-300 uppercase">
              Core Capabilities
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Engineered for Speed, Precision, & Playability
            </h2>
            <p className="mt-4 text-slate-400">
              Every tool required to convert sketches into polished platformer levels is built right
              in.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-8 transition-all hover:border-slate-700"
                  initial={{ opacity: 0, y: 20 }}
                  key={feat.title}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                >
                  <div className="bg-brand-500/10 text-brand-400 border-brand-500/20 inline-flex size-12 items-center justify-center rounded-xl border">
                    <IconComp className="size-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{feat.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{feat.description}</p>
                </motion.div>
              );
            })}
          </div>
        </PageContainer>
      </section>

      {/* CALL TO ACTION BANNER */}
      <section className="relative border-t border-slate-800/80 py-20">
        <PageContainer>
          <div className="border-brand-500/30 from-brand-900/90 relative flex flex-col items-center overflow-hidden rounded-3xl border bg-gradient-to-r via-indigo-900/90 to-purple-950/90 p-8 text-center shadow-2xl sm:p-14">
            <div className="bg-brand-500/20 pointer-events-none absolute -top-24 -right-24 size-96 rounded-full blur-3xl" />

            <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-semibold text-white backdrop-blur">
              Ready to Create?
            </span>
            <h2 className="mt-6 max-w-2xl text-3xl font-extrabold text-white sm:text-5xl">
              Bring Your Hand-Drawn Game Ideas to Life Today
            </h2>
            <p className="mt-4 max-w-xl text-base text-slate-200">
              No game development experience needed. Draw your level, extract vision objects, and
              play immediately.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                className="focus-visible:ring-brand-500 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white px-8 text-base font-bold text-slate-950 shadow-xl transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                to="/studio"
              >
                <PencilLine className="size-5" />
                Launch Studio Canvas
              </Link>
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-400/40 px-8 text-base font-bold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:outline-none"
                to="/dashboard"
              >
                <Boxes className="size-5" />
                View Dashboard
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400">
        <PageContainer className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="bg-brand-600 grid size-8 place-items-center rounded-lg text-white shadow">
              <Gamepad2 className="size-4" />
            </span>
            <span className="font-bold tracking-tight text-white">DRAW2GAME</span>
            <span className="text-xs text-slate-500">© 2026</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-400" /> React 19 + TypeScript
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="size-3.5 text-blue-400" /> OpenCV.js + YOLO
            </span>
            <span className="flex items-center gap-1.5">
              <Gamepad2 className="size-3.5 text-purple-400" /> Phaser 3 + Matter.js
            </span>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
