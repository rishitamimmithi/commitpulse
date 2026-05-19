"use client";

import React, { useRef } from "react";
import { Button } from "./ui/button";
import { Download } from "lucide-react";

interface CommitEmotion {
  dominant_emotion: string;
}

interface ProcessedCommit {
  author: string;
  message: string;
  emotions: CommitEmotion;
}

interface PosterProps {
  repoUrl: string;
  timeline: ProcessedCommit[];
  dnaFingerprints: Record<string, { assigned_band_instrument: string }>;
}

export default function PosterExport({ repoUrl, timeline, dnaFingerprints }: PosterProps) {
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateAndDownloadPoster = () => {
    const canvas = exportCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set high-res poster dimensions (Classic 1:1.414 Swiss Art Ratio)
    canvas.width = 600;
    canvas.height = 850;

    // 1. Base Layer: Premium Off-White Cardstock
    ctx.fillStyle = "#f6f5f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Fine structural framing borders
    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // 2. Header Block - Typography Hierarchy
    const cleanRepoName = repoUrl.split("/").pop()?.replace(".git", "").toUpperCase() || "REPOSITORY";
    
    ctx.fillStyle = "#111111";
    ctx.font = "900 44px Helvetica, Arial, sans-serif";
    ctx.fillText(cleanRepoName, 45, 90);

    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#e53e3e"; // Vibrant Swiss Crimson Red
    ctx.fillText("GIT-ORCHESTRA WORLD TOUR // ACOUSTIC ARCHITECTURE", 45, 125);

    // Solid Heavy Framing Rule
    ctx.fillStyle = "#111111";
    ctx.fillRect(45, 145, canvas.width - 90, 6);

    // 3. Lineup Grid (Headlining Developers)
    ctx.fillStyle = "#111111";
    ctx.font = "800 20px Helvetica, Arial, sans-serif";
    ctx.fillText("MAIN HEADLINERS:", 45, 195);

    let currentY = 235;
    Object.entries(dnaFingerprints).slice(0, 5).forEach(([name, profile]) => {
      // Small horizontal indicator line per artist
      ctx.strokeStyle = "rgba(17, 17, 17, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(45, currentY + 5);
      ctx.lineTo( canvas.width - 45, currentY + 5);
      ctx.stroke();

      ctx.fillStyle = "#111111";
      ctx.font = "bold 16px Helvetica, Arial, sans-serif";
      ctx.fillText(name.toUpperCase(), 45, currentY);

      ctx.fillStyle = "#4a5568";
      ctx.font = "italic 14px Georgia, serif";
      ctx.fillText(profile.assigned_band_instrument, canvas.width - 240, currentY);

      currentY += 40;
    });

    // 4. Abstract Central Art: The Code-Groove Blueprint
    const centerX = 300;
    const centerY = 510;
    
    // Draw concentric sonic rings mapping repository depth
    ctx.strokeStyle = "rgba(17, 17, 17, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 40 + i * 12, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Bold Geometric Design Accents (Constructivist Style)
    ctx.fillStyle = "#e53e3e";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#111111";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - 130, centerY);
    ctx.lineTo(centerX + 130, centerY);
    ctx.stroke();

    // 5. Tracklist Section (Recent Commits as Concert Setlist)
    ctx.fillStyle = "#111111";
    ctx.font = "800 18px Helvetica, Arial, sans-serif";
    ctx.fillText("SETLIST REPERTOIRE", 45, 665);
    
    ctx.fillRect(45, 678, canvas.width - 90, 2);

    let trackY = 715;
    timeline.slice(0, 4).forEach((commit, idx) => {
      ctx.fillStyle = "#2d3748";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`[TRACK 0${idx + 1}]  ${commit.message.substring(0, 42).toUpperCase()}...`, 45, trackY);
      
      // Right-aligned colored emotion badges
      ctx.fillStyle = "#e53e3e";
      ctx.font = "900 11px Helvetica, Arial, sans-serif";
      ctx.fillText(commit.emotions?.dominant_emotion.toUpperCase() || "ALIVE", canvas.width - 120, trackY);

      trackY += 24;
    });

    // 6. Technical Footer Stamp
    ctx.fillStyle = "#a0aec0";
    ctx.font = "10px monospace";
    ctx.fillText(`GENERATED AUTOMATICALLY VIA COMMITPULSE ENGINE v1.0 // ${new Date().getFullYear()}`, 45, 812);

    // Trigger Instant File Download Action
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${cleanRepoName.toLowerCase()}-concert-poster.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800/80 rounded-xl space-y-4 shadow-xl">
      <div>
        <h4 className="text-xs font-mono font-bold tracking-wider text-zinc-400 uppercase">🎟️ Gig Merchandise</h4>
        <p className="text-xs text-zinc-500 mt-1">Export a high-res minimalist Swiss art poster of your repository tour dataset.</p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          onClick={generateAndDownloadPoster}
          className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-bold gap-2 h-10 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Download Art Poster
        </Button>
      </div>

      {/* Hidden canvas rendering engine context */}
      <canvas ref={exportCanvasRef} className="hidden" />
    </div>
  );
}