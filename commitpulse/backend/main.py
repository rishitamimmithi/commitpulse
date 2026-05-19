import os
from datetime import datetime
from typing import List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

# Pydantic Schema for Structured Gemini Output
class CommitEmotion(BaseModel):
    confidence: float = Field(description="Score from 0.0 to 1.0 showing confidence or triumph")
    frustration: float = Field(description="Score from 0.0 to 1.0 showing annoyance or stress")
    fatigue: float = Field(description="Score from 0.0 to 1.0 showing burnout or exhaustion")
    dominant_emotion: str = Field(description="Single word summary: e.g., triumphant, panicked, focused, neutral")

# Helper function to get sentiment from Gemini
def analyze_commit_message(message: str) -> dict:
    if not client:
        return {"confidence": 0.5, "frustration": 0.0, "fatigue": 0.0, "dominant_emotion": "neutral"}
    
    try:
        prompt = f"Analyze the emotional sentiment of this developer git commit message: '{message}'"
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=CommitEmotion,
                temperature=0.1
            ),
        )
        import json
        return json.loads(response.text)
    except Exception:
        return {"confidence": 0.5, "frustration": 0.1, "fatigue": 0.0, "dominant_emotion": "neutral"}

@app.get("/api/commits")
def get_repo_analytics(repo_url: str):
    # Parse owner and repo name from URL
    url_cleaned = repo_url.replace("https://github.com/", "").replace(".git", "")
    parts = url_cleaned.split("/")
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail="Invalid GitHub repository URL format.")
    
    owner, repo = parts[0], parts[1]
    
    headers = {}
    token = os.getenv("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = f"token {token}"
        
    # 1. Fetch live commit sequence
    commits_api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=20"
    res = requests.get(commits_api_url, headers=headers)
    
    if res.status_code != 200:
        raise HTTPException(status_code=res.status_code, detail="Failed to fetch information from GitHub API.")
        
    raw_commits = res.json()
    processed_commits = []
    
    # Tracking structural dictionaries for Band Instrument DNA mapping
    authors_data = {}
    
    for c in raw_commits:
        sha = c["sha"]
        msg = c["commit"]["message"]
        author_name = c["commit"]["author"]["name"]
        date_str = c["commit"]["author"]["date"] # ISO format: 2026-05-19T18:00:00Z
        
        # Parse temporal characteristics
        dt = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%SZ")
        hour = dt.hour
        
        # Fetch detailed file metric specs per commit
        detail_url = f"https://api.github.com/repos/{owner}/{repo}/commits/{sha}"
        detail_res = requests.get(detail_url, headers=headers)
        
        additions, deletions, polyglot_count = 0, 0, 1
        if detail_res.status_code == 200:
            d_data = detail_res.json()
            additions = d_data.get("stats", {}).get("additions", 0)
            deletions = d_data.get("stats", {}).get("deletions", 0)
            
            # Find extensions to calculate Polyglot Index
            files = d_data.get("files", [])
            extensions = set(f["filename"].split(".")[-1] for f in files if "." in f["filename"])
            polyglot_count = max(1, len(extensions))

        # Core Mathematical Formulations
        churn = additions + deletions
        panic_score = 5 if (2 <= hour <= 5) else 0
        refactor_intensity = 1 if (churn > 0 and churn < 30) else 0
        
        # Run semantic processing via Gemini
        emotions = analyze_commit_message(msg)
        
        # Build state metrics dictionary
        commit_node = {
            "sha": sha[:7],
            "message": msg,
            "author": author_name,
            "hour": hour,
            "additions": additions,
            "deletions": deletions,
            "churn": churn,
            "polyglot_index": polyglot_count,
            "panic_score": panic_score,
            "refactor_intensity": refactor_intensity,
            "emotions": emotions
        }
        processed_commits.append(commit_node)
        
        # Aggregate stats to generate Author DNA
        if author_name not in authors_data:
            authors_data[author_name] = {"commits": 0, "total_churn": 0, "panic_points": 0, "refactors": 0}
        
        authors_data[author_name]["commits"] += 1
        authors_data[author_name]["total_churn"] += churn
        authors_data[author_name]["panic_points"] += panic_score
        authors_data[author_name]["refactors"] += refactor_intensity

    # Calculate Author DNA Signatures
    author_dna_profiles = {}
    for name, stats in authors_data.items():
        total = stats["commits"]
        v_velocity = total / len(processed_commits)
        v_churn = stats["total_churn"] / total
        v_panic = stats["panic_points"] / total
        v_refactor = stats["refactors"] / total
        
        # Assign Archetype Instrument
        if v_panic > 2.0:
            role = "The Night-Owl Sprinter (Electric Guitar)"
        elif v_refactor > 0.5:
            role = "The Clean Refactorer (Ambient Cello)"
        elif v_churn > 150:
            role = "The Full-Stack Polyglot (Polyphonic Synth)"
        else:
            role = "The Consistent Builder (Acoustic Drums)"
            
        author_dna_profiles[name] = {
            "dna_vector": [round(v_velocity, 2), round(v_churn, 2), round(v_panic, 2), round(v_refactor, 2)],
            "assigned_band_instrument": role
        }

    return {
        "emotional_arc_timeline": processed_commits,
        "author_dna_fingerprints": author_dna_profiles
    }