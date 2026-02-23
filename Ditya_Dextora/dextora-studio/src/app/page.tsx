"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Video, Film, Wand2, ChevronRight, Play, Loader2, Sparkles, Activity, Layers, ArrowRight } from "lucide-react";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ---------------------------------------------------------------------------
// FEATURE CARDS COMPONENTS
// ---------------------------------------------------------------------------

const DiagnosticShuffler = () => {
  const [items, setItems] = useState([
    { id: 1, label: "Script Generation", icon: <Film className="w-5 h-5 text-[#7B61FF]" /> },
    { id: 2, label: "Scene Planning", icon: <Layers className="w-5 h-5 text-[#38bdf8]" /> },
    { id: 3, label: "Visual Direction", icon: <Sparkles className="w-5 h-5 text-white" /> },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems(current => {
        const newItems = [...current];
        const last = newItems.pop()!;
        newItems.unshift(last);
        return newItems;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0A0A14] border border-white/10 rounded-cinematic p-8 h-[360px] flex flex-col relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#7B61FF]/10 blur-[60px] group-hover:bg-[#7B61FF]/20 transition-all duration-700" />
      <h3 className="text-2xl font-bold mb-2 font-heading">Scene Intelligence Engine</h3>
      <p className="text-sm text-gray-400 font-data mb-8">System: Gemini Video Architect</p>

      <div className="flex-1 relative w-full h-full flex flex-col items-center justify-center -mt-6">
        {items.map((item, i) => {
          const isTop = i === 0;
          return (
            <div
              key={item.id}
              className={`absolute w-full max-w-[240px] p-4 rounded-2xl border backdrop-blur-md flex items-center gap-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isTop
                  ? 'border-[#7B61FF]/40 bg-[#7B61FF]/10 z-30 transform translate-y-0 scale-100 opacity-100 shadow-[0_10px_30px_rgba(123,97,255,0.2)]'
                  : i === 1
                    ? 'border-white/10 bg-white/5 z-20 transform -translate-y-4 scale-95 opacity-60'
                    : 'border-white/5 bg-white/5 z-10 transform -translate-y-8 scale-90 opacity-20'}`}
            >
              <div className="p-2 bg-black/50 rounded-lg">{item.icon}</div>
              <span className="font-semibold">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TelemetryTypewriter = () => {
  const [text, setText] = useState("");
  const fullText = "Generating cinematic visuals...\nApplying motion animation...\nRendering composition...\nExporting media to proxy...";

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        setTimeout(() => { currentIndex = 0; setText(""); }, 2000);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0A0A14] border border-white/10 rounded-cinematic p-8 h-[360px] flex flex-col relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#38bdf8]/10 blur-[60px] group-hover:bg-[#38bdf8]/20 transition-all duration-700" />
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-2xl font-bold font-heading">Cinematic Render Engine</h3>
        <span className="flex items-center gap-2 text-xs font-data text-[#38bdf8] uppercase">
          <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
          Live Feed
        </span>
      </div>
      <p className="text-sm text-gray-400 font-data mb-8">System: Veo Core & Remotion</p>

      <div className="flex-1 bg-black/40 rounded-2xl border border-white/5 p-6 font-data text-sm leading-relaxed overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#38bdf8]/30 to-transparent"></div>
        <p className="whitespace-pre-wrap text-gray-300">
          {text}<span className="inline-block w-2 h-4 bg-[#38bdf8] ml-1 animate-blink align-middle"></span>
        </p>
      </div>
    </div>
  );
};

const ProtocolScheduler = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  // A simple simulated cursor animation
  useEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

      tl.set(".cursor", { x: 50, y: 150, opacity: 0 })
        .to(".cursor", { opacity: 1, duration: 0.3 })
        .to(".cursor", { x: 120, y: 80, duration: 1, ease: "power2.inOut" })
        .to(".cursor-click", { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to(".cell-4", { backgroundColor: "rgba(123,97,255,0.2)", borderColor: "#7B61FF", duration: 0.2 }, "-=0.1")
        .to(".cursor", { x: 220, y: 140, duration: 0.8, ease: "power2.inOut", delay: 0.2 })
        .to(".cursor-click", { scale: 0.8, duration: 0.1, yoyo: true, repeat: 1 })
        .to(".render-btn", { backgroundColor: "#7B61FF", color: "white", duration: 0.2 }, "-=0.1")
        .to(".cursor", { opacity: 0, duration: 0.3, delay: 0.5 });
    }, gridRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="bg-[#0A0A14] border border-white/10 rounded-cinematic p-8 h-[360px] flex flex-col relative overflow-hidden group shadow-2xl" ref={gridRef}>
      <h3 className="text-2xl font-bold mb-2 font-heading">Animation Timeline</h3>
      <p className="text-sm text-gray-400 font-data mb-6">System: Automated Keyframes</p>

      <div className="flex-1 relative flex flex-col justify-center gap-4 align-center">
        {/* Track rows */}
        <div className="flex gap-2 w-full justify-between">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={`track1-${i}`} className={`w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-xs text-gray-600 font-data cell-${i}`}>
              {i}
            </div>
          ))}
        </div>
        <div className="flex gap-2 w-full justify-between">
          <div className="h-10 w-full rounded-lg border border-white/5 bg-white-[0.02] flex items-center px-4 overflow-hidden relative">
            <div className="absolute left-0 top-0 h-full w-[40%] bg-gradient-to-r from-[#38bdf8]/10 to-[#38bdf8]/30 border-r border-[#38bdf8]/50"></div>
            <span className="text-[10px] text-gray-500 font-data z-10">B-Roll Track</span>
          </div>
        </div>

        <div className="mt-2 text-center">
          <button className="render-btn px-6 py-2 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-gray-400 transition-colors">
            INITIATE RENDERING
          </button>
        </div>

        {/* SVG Cursor */}
        <div className="cursor absolute top-0 left-0 w-6 h-6 z-50 pointer-events-none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
          <svg className="cursor-click" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 3L19.5 10.5L12 12.75L9 21L4.5 3Z" fill="white" stroke="black" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// MAIN PAGE STRUCTURE
// ---------------------------------------------------------------------------

export default function Home() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const philosophyRef = useRef<HTMLDivElement>(null);
  const protocolRef = useRef<HTMLDivElement>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Core GSAP Animations
  useEffect(() => {
    let ctx = gsap.context(() => {

      // 1. Hero Entrance
      const heroTl = gsap.timeline();
      heroTl.from(".hero-line-1", { y: 40, opacity: 0, duration: 1, ease: "power3.out" })
        .from(".hero-line-2", { y: 40, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.8")
        .from(".hero-sub", { y: 20, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.6")
        .from(".hero-cta", { y: 20, opacity: 0, duration: 1, ease: "power3.out" }, "-=0.8");

      // 2. Navbar morphing on scroll
      ScrollTrigger.create({
        trigger: "body",
        start: "100px top",
        onEnter: () => {
          gsap.to(navRef.current, { backgroundColor: "rgba(10,10,20,0.6)", backdropFilter: "blur(24px)", borderBottomColor: "rgba(255,255,255,0.08)", duration: 0.3 });
          gsap.to(".nav-btn", { backgroundColor: "#7B61FF", color: "white", duration: 0.3 });
        },
        onLeaveBack: () => {
          gsap.to(navRef.current, { backgroundColor: "transparent", backdropFilter: "blur(0px)", borderBottomColor: "transparent", duration: 0.3 });
          gsap.to(".nav-btn", { backgroundColor: "rgba(255,255,255,0.1)", color: "white", duration: 0.3 });
        }
      });

      // 3. Manifesto / Philosophy Reveal
      gsap.from(".manifesto-neutral", {
        scrollTrigger: {
          trigger: philosophyRef.current,
          start: "top 70%",
        },
        y: 30, opacity: 0, duration: 1, ease: "power3.out"
      });

      gsap.from(".manifesto-bold", {
        scrollTrigger: {
          trigger: philosophyRef.current,
          start: "top 60%",
        },
        y: 40, opacity: 0, duration: 1.2, ease: "power3.out"
      });

      // 4. Stacking Archive Cards
      const cards = gsap.utils.toArray('.archive-card');
      cards.forEach((card: any, i) => {
        ScrollTrigger.create({
          trigger: card,
          start: "top 100px",
          end: "+=1000",
          pin: true,
          pinSpacing: false,
        });

        if (i < cards.length - 1) {
          gsap.to(card, {
            scale: 0.9,
            opacity: 0.3,
            filter: "blur(20px)",
            scrollTrigger: {
              trigger: cards[i + 1] as Element,
              start: "top 90%",
              end: "top 20%",
              scrub: true,
            }
          });
        }
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">

      {/* ------------------ A. NAVBAR ------------------ */}
      <header
        ref={navRef}
        className="fixed top-0 left-0 w-[calc(100%-48px)] mx-6 mt-6 py-4 px-8 rounded-full z-50 flex items-center justify-between border border-transparent transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B61FF] to-[#38bdf8] flex items-center justify-center shadow-[0_0_15px_rgba(123,97,255,0.4)]">
            <Video className="text-white w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">Dextora Studio</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-data text-gray-400">
          <a href="#engine" className="hover:text-white hover:-translate-y-[1px] transition-all">Engine</a>
          <a href="#features" className="hover:text-white hover:-translate-y-[1px] transition-all">Features</a>
          <a href="#reels" className="hover:text-white hover:-translate-y-[1px] transition-all">Reels</a>
        </nav>
        <button
          onClick={() => setIsModalOpen(true)}
          className="nav-btn px-6 py-2.5 rounded-full bg-white/10 hover:scale-105 text-white font-bold text-sm transition-all border border-white/10"
        >
          Start Creating
        </button>
      </header>

      {/* ------------------ B. HERO SECTION ------------------ */}
      <section ref={heroRef} className="relative w-full h-[100dvh] flex items-end pb-24 px-8 lg:px-20 overflow-hidden">
        {/* Background Image & Gradient Overlays */}
        <div className="absolute inset-0 w-full h-full z-[-2]">
          <img
            src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2500&auto=format&fit=crop"
            alt="Cinematic Editing Studio"
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A14] via-[#0A0A14]/80 to-transparent z-[-1]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A14] via-[#0A0A14]/50 to-transparent z-[-1]"></div>

        <div className="max-w-4xl z-10 w-full">
          <h1 className="flex flex-col gap-2">
            <span className="hero-line-1 text-5xl md:text-7xl font-bold font-heading tracking-tighter text-white uppercase opacity-90">
              Create Videos Beyond
            </span>
            <span className="hero-line-2 text-7xl md:text-9xl font-drama italic text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#38bdf8] pb-4">
              Automation.
            </span>
          </h1>
          <p className="hero-sub mt-6 text-xl md:text-2xl text-gray-400 max-w-2xl font-heading leading-relaxed">
            Dextora Studio allows anyone to create cinematic AI videos and reels instantly. Experience the power of professional rendering.
          </p>
          <div className="hero-cta mt-10">
            <button
              onClick={() => setIsModalOpen(true)}
              className="magnetic-btn px-10 py-5 bg-[#7B61FF] text-white rounded-full font-bold text-lg flex items-center gap-3 shadow-[0_0_30px_rgba(123,97,255,0.3)] hover:shadow-[0_0_50px_rgba(123,97,255,0.5)] border border-white/10"
            >
              Start Creating <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ------------------ C. FEATURES ------------------ */}
      <section id="features" className="w-full max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DiagnosticShuffler />
        <TelemetryTypewriter />
        <ProtocolScheduler />
      </section>

      {/* ------------------ D. PHILOSOPHY ------------------ */}
      <section ref={philosophyRef} className="relative w-full py-40 px-8 flex flex-col items-center justify-center text-center overflow-hidden bg-[#05050A]">
        {/* Organic Parallax Background */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-screen pointer-events-none">
          <img
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2500&auto=format&fit=crop"
            alt="Neon microscopic liquid"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-5xl z-10">
          <h2 className="manifesto-neutral text-2xl md:text-3xl text-gray-500 font-heading mb-6 max-w-3xl mx-auto leading-relaxed">
            Most video tools require manual editing, complex timelines, and tedious keyframing.
          </h2>
          <h2 className="manifesto-bold text-5xl md:text-7xl font-drama italic text-white leading-tight">
            We focus on: <span className="text-[#38bdf8]">Automated</span> cinematic creation.
          </h2>
        </div>
      </section>

      {/* ------------------ E. PROTOCOL STACKING ------------------ */}
      <section id="engine" className="w-full relative pb-40 pt-20">

        {/* Card 1 */}
        <div className="archive-card h-[100vh] w-full flex items-center justify-center sticky top-0 px-8">
          <div className="w-full max-w-6xl h-[70vh] rounded-[3rem] border border-white/10 bg-[#0A0A14] shadow-2xl overflow-hidden relative flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <div className="flex-1 p-16 flex flex-col justify-center border-r border-white/5 relative z-10">
              <span className="font-data text-[#7B61FF] uppercase text-sm font-bold tracking-widest mb-6">Step 01</span>
              <h3 className="text-5xl font-bold font-heading mb-6">Intelligence Engine</h3>
              <p className="text-xl text-gray-400 leading-relaxed font-heading">
                AI generates your script and structures complex scenes automatically using Gemini Pro.
              </p>
            </div>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/50">
              {/* Decorative Geometric Animation */}
              <div className="w-64 h-64 border border-[#7B61FF]/30 rounded-full animate-spin-slow flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-t-[#38bdf8] border-transparent scale-110" style={{ animationDirection: 'reverse' }}></div>
                <div className="w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
                  <Activity className="w-12 h-12 text-[#7B61FF]" />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#0A0A14] pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="archive-card h-[100vh] w-full flex items-center justify-center sticky top-0 px-8">
          <div className="w-full max-w-6xl h-[70vh] rounded-[3rem] border border-white/10 bg-[#0A0A14] shadow-2xl overflow-hidden relative flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <div className="flex-1 p-16 flex flex-col justify-center border-r border-white/5 relative z-10 bg-[#0D0D18]">
              <span className="font-data text-[#38bdf8] uppercase text-sm font-bold tracking-widest mb-6">Step 02</span>
              <h3 className="text-5xl font-bold font-heading mb-6">Cinematic Visuals</h3>
              <p className="text-xl text-gray-400 leading-relaxed font-heading">
                AI generates impossibly beautiful cinematic visual assets using Veo and Imagen integration.
              </p>
            </div>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black/80">
              <div className="absolute inset-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-[#38bdf8] shadow-[0_0_20px_#38bdf8] blur-[1px] opacity-80" style={{ animation: 'scan 4s ease-in-out infinite alternate' }} />
              <style dangerouslySetInnerHTML={{
                __html: `
                 @keyframes scan { 0% { transform: translateY(0); } 100% { transform: translateY(70vh); } }
               `}} />
              <Video className="w-20 h-20 text-white/10" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="archive-card h-[100vh] w-full flex items-center justify-center sticky top-0 px-8">
          <div className="w-full max-w-6xl h-[70vh] rounded-[3rem] border border-white/10 bg-[#0A0A14] shadow-2xl overflow-hidden relative flex flex-col md:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.8)]">
            <div className="flex-1 p-16 flex flex-col justify-center border-r border-white/5 relative z-10 bg-[#0F0F1A]">
              <span className="font-data text-white uppercase text-sm font-bold tracking-widest mb-6">Step 03</span>
              <h3 className="text-5xl font-bold font-heading mb-6">Remotion Rendering</h3>
              <p className="text-xl text-gray-400 leading-relaxed font-heading">
                Compose, animate, and export your video automatically using the Remotion programmatic engine.
              </p>
            </div>
            <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
              <svg viewBox="0 0 500 200" className="w-full h-full opacity-60">
                <path d="M 0 100 Q 50 10 100 100 T 200 100 T 300 100 T 400 100 T 500 100" fill="transparent" stroke="#7B61FF" strokeWidth="4" className="stroke-dash" />
              </svg>
              <style dangerouslySetInnerHTML={{
                __html: `
                 .stroke-dash { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: dash 3s linear infinite; }
                 @keyframes dash { to { stroke-dashoffset: 0; } }
               `}} />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------ F. REELS PREVIEW ------------------ */}
      <section id="reels" className="w-full py-32 px-8 flex flex-col items-center justify-center relative border-t border-white/5 bg-[#05050A]">
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-20">
          <div className="w-[800px] h-[800px] bg-[#38bdf8] blur-[200px] rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="z-10 text-center mb-16 max-w-3xl">
          <h2 className="text-5xl font-bold font-heading mb-6">Vertical Format Native</h2>
          <p className="text-lg text-gray-400">Generate Instagram Reels or TikToks utilizing our avatar intelligence layer perfectly cropped and animated.</p>
        </div>

        <div className="w-[320px] h-[580px] rounded-[3rem] border-[8px] border-black shadow-[0_20px_60px_rgba(56,189,248,0.3)] bg-[#0A0A14] relative overflow-hidden z-10">
          {/* Simulated 9:16 Video Content */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 z-20 pointer-events-none"></div>
          <img src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover scale-105" alt="Avatar simulation" />
          <div className="absolute bottom-6 left-6 right-6 z-30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">@dextora_ai</span>
            </div>
            <p className="text-sm font-semibold mb-4 leading-tight">Here's how AI is transforming cinematic video creation 🎬🚀</p>
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-2/3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------ G. CTA & FOOTER ------------------ */}
      <section className="w-full pt-40 pb-20 px-8 flex flex-col items-center bg-[#0A0A14] rounded-t-[4rem] relative overflow-hidden -mt-10 border-t border-white/10 z-20">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#7B61FF]/10 z-0 pointer-events-none" />

        <h2 className="text-6xl md:text-8xl font-bold font-heading mb-12 text-center z-10 leading-tight">
          Ready to <span className="font-drama italic text-transparent bg-clip-text bg-gradient-to-r from-[#7B61FF] to-[#38bdf8]">Launch?</span>
        </h2>

        <button
          onClick={() => setIsModalOpen(true)}
          className="magnetic-btn px-12 py-6 bg-white text-black rounded-full font-bold text-xl flex items-center gap-4 z-10 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all group"
        >
          Launch Dextora Studio <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
        </button>

        <div className="w-full max-w-7xl mt-40 grid grid-cols-1 md:grid-cols-4 gap-12 border-t border-white/10 pt-12 z-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Video className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-xl font-heading">Dextora Studio</span>
            </div>
            <p className="text-gray-500 text-sm max-w-sm">The cinematic creation engine powered by AI. Generate videos and reels instantly without keyframing.</p>
          </div>
          <div className="flex flex-col gap-4 text-sm font-data">
            <span className="text-white font-bold mb-2">Platform</span>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Workspace</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">API Documentation</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Models</a>
          </div>
          <div className="flex flex-col justify-between items-start md:items-end col-span-1 border-l border-white/5 pl-8">
            <div className="flex items-center gap-3 bg-black border border-[#10b981]/30 py-2 px-4 rounded-full">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse"></span>
              <span className="text-xs font-data text-[#10b981] font-bold">SYSTEM OPERATIONAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl pointer-events-none" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-[#0A0A14] border border-white/10 rounded-[2rem] p-10 max-w-md w-full relative z-[101] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#7B61FF]/20 blur-[60px]" />
            <h3 className="text-3xl font-bold font-heading mb-4">Initialize Studio</h3>
            <p className="text-gray-400 font-data text-sm mb-8">Access the cinematic engine to begin generating content.</p>
            <div className="flex flex-col gap-4 relative z-10">
              <button onClick={() => router.push('/studio')} className="w-full py-4 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:scale-[1.02] transition-transform">
                CONNECT WORKSPACE
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full py-4 rounded-xl border border-white/10 bg-transparent text-white font-bold text-sm tracking-wide hover:bg-white/5 transition-colors">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
