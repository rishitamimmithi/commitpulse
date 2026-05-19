"use client";

import React, { useRef, useEffect, useState } from "react";

interface CommitEmotion {
  confidence: number;
  frustration: number;
  fatigue: number;
  dominant_emotion: string;
}

interface ProcessedCommit {
  sha: string;
  message: string;
  author: string;
  hour: number;
  additions: number;
  deletions: number;
  churn: number;
  polyglot_index: number;
  panic_score: number;
  refactor_intensity: number;
  emotions: CommitEmotion;
}

interface VisualizerProps {
  timeline: ProcessedCommit[];
  activeSha: string | null;
  onSelectCommit: (commit: ProcessedCommit) => void;
}

export default function VinylVisualizer({ timeline, activeSha, onSelectCommit }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState(0);

  // Get color profiles matching Gemini emotional traits
  const getEmotionColor = (emotion: string): string => {
    switch (emotion.toLowerCase()) {
      case "triumphant": return "#10b981"; // Emerald green
      case "focused":    return "#06b6d4"; // Cyan blue
      case "panicked":   return "#ef4444"; // Aggressive Red
      case "exhausted":  return "#f59e0b"; // Tired Amber
      default:           return "#64748b"; // Neutral Slate
    }
  };

  // Continuous loop animation to rotate the vinyl record disk
  useEffect(() => {
    let animationFrameId: number;
    const updateRotation = () => {
      setRotation((prev) => (prev + 0.005) % (Math.PI * 2));
      animationFrameId = requestAnimationFrame(updateRotation);
    };
    animationFrameId = requestAnimationFrame(updateRotation);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Re-draw canvas whenever the dataset or active index changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;
    const minRadius = 40; // Size of center center ring hole label

    // Clear Canvas base layout view
    ctx.clearRect(0, 0, width, height);

    // Save context state to apply global vinyl body disk background spin
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);
    ctx.translate(-centerX, -centerY);

    // 1. Draw Master Black Vinyl Disc Base Body
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#09090b";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#18181b";
    ctx.stroke();

    // 2. Map Concentric Circles (The Commits Grooves)
    const totalGrooves = timeline.length;
    const radiusStep = (maxRadius - minRadius) / Math.max(1, totalGrooves);

    timeline.forEach((commit, index) => {
      const radius = maxRadius - index * radiusStep;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      
      // Is this commit currently active? Glow neon bright!
      const isActive = activeSha === commit.sha;
      ctx.lineWidth = isActive ? 4 : 1.5;
      ctx.strokeStyle = isActive ? getEmotionColor(commit.emotions.dominant_emotion) : "#27272a";
      ctx.stroke();

      // Subtle atmospheric edge rings 
      if (isActive) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = getEmotionColor(commit.emotions.dominant_emotion);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }
    });

    // 3. Draw Center Record Custom Graphic Sticker Label Cover
    ctx.beginPath();
    ctx.arc(centerX, centerY, minRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#1e1b4b";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#4338ca";
    ctx.stroke();

    // Small metal center spindle record pin drop point hole
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#27272a";
    ctx.fill();

    ctx.restore(); // Restore base un-rotated position coordinate state

    // 4. Draw Tone-Arm/Needle overlaying steady from top right
    ctx.save();
    ctx.strokeStyle = "#a1a1aa";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    // Draw core base pivot box point
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(width - 40, 20, 20, 20);

    // Draw structural metallic frame rod line arm toward the inner vinyl disk track
    ctx.beginPath();
    ctx.moveTo(width - 30, 30);
    ctx.lineTo(centerX + 60, centerY - 60);
    
    // If a node is currently actively running, draw needle head dropping directly down on track
    const trackingOffset = activeSha ? 10 : 0;
    ctx.lineTo(centerX + 45 + trackingOffset, centerY - 45 + trackingOffset);
    ctx.stroke();
    ctx.restore();

  }, [timeline, rotation, activeSha]);

  // Click tracking event listener logic inside canvas bounds area maps
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - canvas.width / 2;
    const y = e.clientY - rect.top - canvas.height / 2;
    const clickedRadius = Math.sqrt(x * x + y * y);

    const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
    const minRadius = 40;

    if (clickedRadius >= minRadius && clickedRadius <= maxRadius) {
      const radiusStep = (maxRadius - minRadius) / timeline.length;
      const calculatedIndex = Math.floor((maxRadius - clickedRadius) / radiusStep);
      const safeIndex = Math.max(0, Math.min(timeline.length - 1, calculatedIndex));
      
      onSelectCommit(timeline[safeIndex]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-2xl border border-zinc-900 shadow-2xl max-w-md mx-auto">
      <canvas
        ref={canvasRef}
        width={340}
        height={340}
        onClick={handleCanvasClick}
        className="cursor-pointer transition-transform duration-300 active:scale-95"
      />
      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 font-mono bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
        Interactive Vinyl Interface Grid: Tap ring tracks to scrub audio
      </div>
    </div>
  );
}