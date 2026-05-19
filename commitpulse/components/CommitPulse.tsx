"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { ArrowRight, Plus, Minus, AlertCircle, Play, Disc } from "lucide-react";
import { useGitSynth } from "./useGitSynth"; 
import VinylVisualizer from "./VinylVisualizer";
import PosterExport from "./PosterExport";

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

interface AuthorDNA {
  dna_vector: number[];
  assigned_band_instrument: string;
}

interface AnalyticsPayload {
  emotional_arc_timeline: ProcessedCommit[];
  author_dna_fingerprints: Record<string, AuthorDNA>;
}

export default function CommitPulse() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [timeline, setTimeline] = useState<ProcessedCommit[]>([]);
  const [dnaFingerprints, setDnaFingerprints] = useState<Record<string, AuthorDNA>>({});
  
  // Day 4 tracking state for needle synchronization
  const [activeSha, setActiveSha] = useState<string | null>(null);

  const { playCommitSound } = useGitSynth();

  const handleFetchCommits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl) return;

    setLoading(true);
    setError("");
    setTimeline([]);
    setDnaFingerprints({});
    setActiveSha(null);

    try {
      const response = await fetch(`http://localhost:8000/api/commits?repo_url=${encodeURIComponent(repoUrl)}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to process repository data.");
      }
      
      const data: AnalyticsPayload = await response.json();
      setTimeline(data.emotional_arc_timeline || []);
      setDnaFingerprints(data.author_dna_fingerprints || {});
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Sound play coordinator that flashes visual layers at the same time
  const handleSelectAndPlayCommit = (commit: ProcessedCommit) => {
    setActiveSha(commit.sha);
    playCommitSound(commit);
  };

  // Symphony orchestra sequential automatic timing driver loop
  const triggerMasterSymphony = () => {
    if (timeline.length === 0) return;
    timeline.forEach((commit, index) => {
      setTimeout(() => {
        setActiveSha(commit.sha);
        playCommitSound(commit);
      }, index * 550);
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="text-center mb-12 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          Day 5 Vintage Poster & Sharing Engine Live
        </div>
        <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
          CommitPulse
        </h1>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          Your code has emotions. Listen to them. Input a public repository URL to play its acoustic composition.
        </p>
      </div>

      {/* Input Search Form */}
      <form onSubmit={handleFetchCommits} className="flex gap-3 max-w-2xl mx-auto mb-12">
        <Input
          type="url"
          placeholder="https://github.com/rishitamimmithi/TOC.git"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 text-zinc-100 placeholder:text-zinc-600 h-12"
          required
        />
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold h-12 px-6 gap-2 shrink-0">
          {loading ? "Analyzing..." : "Pulse Check"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      {/* Error Alert Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto bg-red-950/30 border border-red-900 text-red-400 rounded-xl mb-8">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading Skeleton Placeholder State */}
      {loading && (
        <div className="max-w-3xl mx-auto space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-48 bg-zinc-800" />
                <Skeleton className="h-4 w-24 bg-zinc-800" />
              </div>
              <Skeleton className="h-4 w-full bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* TWO COLUMN INTERACTIVE PANEL LAYOUT */}
      {timeline.length > 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start mb-12">
          
          {/* Left Block Side Column: Neon Grooved Canvas */}
          <div className="lg:col-span-2 lg:sticky lg:top-6 space-y-4">
            <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">
              Acoustic Audio Disc
            </h3>
            
            <VinylVisualizer 
              timeline={timeline}
              activeSha={activeSha}
              onSelectCommit={handleSelectAndPlayCommit}
            />
            
            {/* Play controls container under disk */}
            <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <Disc className={`w-4 h-4 text-emerald-400 ${activeSha ? 'animate-spin' : ''}`} />
                {activeSha ? `Playing Track: ${activeSha}` : "Needle Deck Idle"}
              </div>
              <Button 
                onClick={triggerMasterSymphony} 
                className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold px-4 py-2 text-xs gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                <Play className="w-3 h-3 fill-zinc-950" /> Play Symphony
              </Button>
            </div>

            {/* Poster Export Engine */}
            <PosterExport 
              repoUrl={repoUrl}
              timeline={timeline}
              dnaFingerprints={dnaFingerprints}
            />
          </div>

          {/* Right Block Side Column: Developer Instrument Lineup and Code Tracks */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* The Git-Orchestra Band Lineup Section */}
            {Object.keys(dnaFingerprints).length > 0 && (
              <Card className="bg-zinc-900/30 border-zinc-800/80">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                    🎹 The Git-Orchestra Lineup
                  </CardTitle>
                </CardHeader>
                <div className="p-4 pt-0 space-y-2.5">
                  {Object.entries(dnaFingerprints).map(([name, profile]) => (
                    <div key={name} className="flex justify-between items-center border-b border-zinc-900 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-zinc-200 text-xs">{name}</p>
                        <p className="text-[11px] text-emerald-400 font-mono">{profile.assigned_band_instrument}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-mono">
                          DNA: [{profile.dna_vector.join(", ")}]
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Commits List Tracker */}
            <div className="space-y-3">
              <h2 className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">
                Repository Audio Tracklist ({timeline.length})
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-auto pr-1">
                {timeline.map((commit) => {
                  const isActive = activeSha === commit.sha;
                  return (
                    <Card 
                      key={commit.sha} 
                      onClick={() => handleSelectAndPlayCommit(commit)}
                      className={`cursor-pointer bg-zinc-900 border-zinc-800/60 transition-all duration-200 group relative overflow-hidden ${
                        isActive ? "border-emerald-500 bg-emerald-950/10 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30" : "hover:border-zinc-700 hover:bg-zinc-900/60"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 animate-pulse" />
                      )}
                      <CardHeader className="p-4 flex flex-col sm:flex-row items-start justify-between space-y-0 gap-4">
                        <div className="space-y-1.5 max-w-md">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${
                              isActive ? "bg-emerald-500 text-zinc-950 font-bold" : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700"
                            }`}>
                              {commit.sha}
                            </span>
                            <span className="font-bold text-zinc-200 text-xs">{commit.author}</span>
                            
                            {commit.panic_score > 0 && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/40">
                                🚨 Panic Mode
                              </span>
                            )}
                            {commit.refactor_intensity > 0 && (
                              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-900/40">
                                🔧 Refactor
                              </span>
                            )}
                          </div>
                          <CardTitle className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                            {commit.message}
                          </CardTitle>
                        </div>

                        {/* Emotional Metrics Panel */}
                        <div className="flex items-center gap-4 text-right justify-between sm:justify-end border-t border-zinc-800/20 sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto shrink-0">
                          <div className="font-mono text-[11px]">
                            <span className="flex items-center text-emerald-500 gap-0.5 justify-end">
                              <Plus className="w-3 h-3" /> {commit.additions}
                            </span>
                            <span className="flex items-center text-red-500 gap-0.5 justify-end">
                              <Minus className="w-3 h-3" /> {commit.deletions}
                            </span>
                          </div>

                          <div className={`px-2.5 py-1 rounded-md bg-zinc-950 border min-w-[95px] text-center transition-colors ${
                            isActive ? "border-emerald-500/30 bg-zinc-950" : "border-zinc-800"
                          }`}>
                            <p className="text-[8px] uppercase text-zinc-500 font-semibold tracking-wide">Gemini Mood</p>
                            <p className="text-xs font-bold text-amber-400 capitalize">{commit.emotions.dominant_emotion}</p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}