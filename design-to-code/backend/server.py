"""
ArtMorph Backend Server
A simple FastAPI server that receives canvas snapshots
and generates React TypeScript code using AI vision models.
"""

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from typing import AsyncGenerator
import base64
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import json
from datetime import date

# Path for persisted rate limit state
RATE_LIMIT_FILE = os.path.join(os.path.dirname(__file__), "rate_limit.json")


def _today_str() -> str:
  return date.today().isoformat()


def load_rate_limit_state() -> dict:
  """Load or initialize the rate limit JSON state."""
  default = {
    "last_reset": _today_str(),
    "counts": {
      "gemini": 0,
      "anthropic": 0,
      "openai": 0,
      "groq": 0
    }
  }

  try:
    if not os.path.exists(RATE_LIMIT_FILE):
      with open(RATE_LIMIT_FILE, "w", encoding="utf-8") as fh:
        json.dump(default, fh)
      return default

    with open(RATE_LIMIT_FILE, "r", encoding="utf-8") as fh:
      data = json.load(fh)

    # Reset counts if day changed
    if data.get("last_reset") != _today_str():
      data = default
      with open(RATE_LIMIT_FILE, "w", encoding="utf-8") as fh:
        json.dump(data, fh)

    # Ensure keys exist
    if "counts" not in data:
      data["counts"] = default["counts"]

    return data
  except Exception:
    # If anything goes wrong, return a fresh default (do not crash server)
    return default


def save_rate_limit_state(state: dict):
  try:
    with open(RATE_LIMIT_FILE, "w", encoding="utf-8") as fh:
      json.dump(state, fh)
  except Exception as e:
    print(f"[Backend] Failed saving rate limit state: {e}")


def try_reserve_provider(provider: str) -> bool:
  """Attempt to reserve 1 request for provider for today.
  Returns True if reserved (and persisted), False if limit reached.
  """
  state = load_rate_limit_state()

  limits = {
    "gemini": int(os.getenv("GEMINI_DAILY_LIMIT", "20")),
    "anthropic": int(os.getenv("ANTHROPIC_DAILY_LIMIT", "100")),
    "openai": int(os.getenv("OPENAI_DAILY_LIMIT", "1000")),
    "groq": int(os.getenv("GROQ_DAILY_LIMIT", "100")),
  }

  cur = state.get("counts", {})
  cur_val = cur.get(provider, 0)
  if cur_val >= limits.get(provider, 999999):
    return False

  # increment and persist
  cur[provider] = cur_val + 1
  state["counts"] = cur
  state["last_reset"] = _today_str()
  save_rate_limit_state(state)
  return True


app = FastAPI(title="ArtMorph Code Generator")

# Enable CORS for the Adobe Express add-on
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://localhost:5241",
        "https://new.express.adobe.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def generate_code_stream(image_base64: str, tier: str = "free") -> AsyncGenerator[str, None]:
    """
    Generate TypeScript React code using AI vision models.
    Streams the response character by character.
    
    Args:
        image_base64: Base64 encoded PNG image
        tier: User tier - 'free' (uses Groq) or 'paid' (uses Claude/Gemini/OpenAI)
    """
    
    system_prompt = """You are an expert frontend developer who converts designs into code.
Analyze the provided canvas screenshot and generate a complete, production-ready React component with TypeScript.

Requirements:
- Use React with TypeScript
- Use Tailwind CSS for all styling
- Use Framer Motion for smooth animations
- Recreate the design as accurately as possible
- Make it responsive and accessible
- Generate ONLY the code, no explanations
- Start with imports and end with export default
- Use semantic HTML elements
- Include proper TypeScript types and interfaces
"""
    
    user_prompt = "Generate a complete React component that recreates this canvas design."
    
    # Provider selection based on tier
    if tier == "free":
        # Free tier: only use Groq
        provider_priority = ["groq"]
        print("[Backend] Free tier - using Groq models")
    else:
        # Paid tier: use premium models (Claude, Gemini, OpenAI)
        provider_priority = [p.strip() for p in os.getenv("PROVIDER_PRIORITY", "anthropic,gemini,openai").split(",") if p.strip()]
        print(f"[Backend] Paid tier - provider priority: {provider_priority}")

    provider_used = None
    for provider in provider_priority:
        provider = provider.lower()

        # Skip if provider not configured via API key
        if provider == "anthropic" and not os.getenv("ANTHROPIC_API_KEY"):
            continue
        if provider == "gemini" and not os.getenv("GEMINI_API_KEY"):
            continue
        if provider == "openai" and not os.getenv("OPENAI_API_KEY"):
            continue
        if provider == "groq" and not os.getenv("GROQ_API_KEY"):
            continue

        # Enforce daily rate limits (reserve before calling provider)
        reserved = try_reserve_provider(provider)
        if not reserved:
            print(f"[Backend] Daily limit reached for provider {provider}; trying next.")
            continue

        # Try provider-specific logic
        if provider == "anthropic":
            try:
                print("[Backend] Using Anthropic Claude API")
                import anthropic

                client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
                with client.messages.stream(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4096,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "source": {
                                        "type": "base64",
                                        "media_type": "image/png",
                                        "data": image_base64,
                                    },
                                },
                                {
                                    "type": "text",
                                    "text": f"{system_prompt}\n\n{user_prompt}"
                                }
                            ],
                        }
                    ],
                ) as stream:
                    for text in stream.text_stream:
                        yield text
                provider_used = "anthropic"
                break
            except Exception as e:
                print(f"[Backend] Anthropic error: {e}")
                continue

        if provider == "gemini":
            try:
                import google.generativeai as genai
                genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
                model = genai.GenerativeModel('gemini-2.0-flash-exp')

                # Decode base64 image
                import io
                from PIL import Image
                image_data = base64.b64decode(image_base64)
                image = Image.open(io.BytesIO(image_data))

                print("[Backend] Sending request to Gemini...")
                response = model.generate_content(
                    [f"{system_prompt}\n\n{user_prompt}", image],
                    stream=True
                )

                print("[Backend] Streaming response from Gemini...")
                for chunk in response:
                    if chunk.text:
                        yield chunk.text
                print("[Backend] Gemini streaming complete")
                provider_used = "gemini"
                break
            except Exception as e:
                print(f"[Backend] Gemini error: {e}")
                continue

        if provider == "openai":
            try:
                print("[Backend] Using OpenAI API (Responses)")
                from openai import OpenAI

                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

                # Try streaming Responses API first for lower latency
                try:
                    with client.responses.stream(
                        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                        input=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"{user_prompt} (image provided as base64)"}
                        ],
                    ) as stream:
                        for event in stream:
                            # event may contain delta chunks; try to extract text safely
                            try:
                                if getattr(event, "type", None) == "response.delta":
                                    delta = getattr(event, "delta", None)
                                    if delta:
                                        # delta may contain "content" as a list of items
                                        content = delta.get("content") if isinstance(delta, dict) else None
                                        if content:
                                            if isinstance(content, list):
                                                for item in content:
                                                    text = item.get("text") or item.get("content")
                                                    if text:
                                                        yield text
                                            elif isinstance(content, str):
                                                yield content
                                elif getattr(event, "type", None) == "response.final":
                                    # final response may contain assembled output
                                    resp = getattr(event, "response", None)
                                    if resp:
                                        output = resp.get("output") if isinstance(resp, dict) else None
                                        if output:
                                            if isinstance(output, list):
                                                for item in output:
                                                    if isinstance(item, dict):
                                                        t = item.get("text") or item.get("content")
                                                        if t:
                                                            yield t
                                            elif isinstance(output, str):
                                                yield output
                            except Exception:
                                continue

                    provider_used = "openai"
                    break

                except Exception as stream_err:
                        print(f"[Backend] OpenAI streaming error, falling back: {stream_err}")
                        # fallback to non-streaming Responses API
                        resp = client.responses.create(
                            model=os.getenv("OPENAI_MODEL", "gpt-4o"),
                            input=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": f"{user_prompt} (image provided as base64)"}
                            ],
                            max_output_tokens=2000,
                        )

                        # Extract output text
                        try:
                            output = resp.output if hasattr(resp, "output") else resp.get("output")
                        except Exception:
                            output = None

                        if output:
                            if isinstance(output, list):
                                for item in output:
                                    if isinstance(item, dict):
                                        t = item.get("text") or item.get("content")
                                        if t:
                                            for ch in t:
                                                yield ch
                            elif isinstance(output, str):
                                for ch in output:
                                    yield ch

                        provider_used = "openai"
                        break

                except Exception as e:
                    print(f"[Backend] OpenAI error: {e}")
                    # continue to next provider
                    continue
            except Exception as e:
                print(f"[Backend] OpenAI outer error: {e}")
                continue

        if provider == "groq":
            try:
                print("[Backend] Using Groq API (free tier)")
                try:
                    from groq import Groq
                    
                    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
                    
                    # Groq model: meta-llama/llama-4-maverick-17b-128e-instruct
                    model_name = os.getenv("GROQ_MODEL", "meta-llama/llama-4-maverick-17b-128e-instruct")
                    
                    # Decode base64 image for Groq
                    import io
                    from PIL import Image
                    image_data = base64.b64decode(image_base64)
                    
                    # Groq expects image URL or base64 data URL
                    image_url = f"data:image/png;base64,{image_base64}"
                    
                    print(f"[Backend] Sending request to Groq ({model_name})...")
                    completion = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": f"{system_prompt}\n\n{user_prompt}"},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": image_url,
                                        },
                                    },
                                ],
                            }
                        ],
                        temperature=0.7,
                        max_tokens=4096,
                        top_p=1,
                        stream=True,
                        stop=None,
                    )
                    
                    print("[Backend] Streaming response from Groq...")
                    for chunk in completion:
                        if chunk.choices and len(chunk.choices) > 0:
                            delta = chunk.choices[0].delta
                            if hasattr(delta, "content") and delta.content:
                                yield delta.content
                    
                    print("[Backend] Groq streaming complete")
                    provider_used = "groq"
                    break
                    
                except Exception as e:
                    print(f"[Backend] Groq error: {e}")
                    # continue to next provider
                    continue
            except Exception as e:
                print(f"[Backend] Groq outer error: {e}")
                continue

    if not provider_used:
        print("[Backend] No provider available or all limits reached. Falling back to mock.")
        
        # Mock mode (no API keys)
        print("[Backend] Using mock mode - no API keys configured")
        mock_code = '''import React from 'react';
import { motion } from 'framer-motion';

interface CanvasDesignProps {
  className?: string;
}

const CanvasDesign: React.FC<CanvasDesignProps> = ({ className }) => {
  return (
    <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full"
      >
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4"
        >
          Canvas Snapshot
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 text-lg mb-8"
        >
          This component was generated from your Adobe Express canvas. 
          Configure API keys (ANTHROPIC_API_KEY or OPENAI_API_KEY) for AI-powered generation.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg"
          >
            Get Started
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gray-100 text-gray-800 py-4 px-8 rounded-xl font-semibold text-lg border-2 border-gray-200"
          >
            Learn More
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CanvasDesign;
'''
        
        # Simulate streaming
        for char in mock_code:
            yield char
            await asyncio.sleep(0.01)


@app.post("/generate")
async def generate_code_endpoint(
    image: UploadFile = File(...),
    tier: str = "free"
):
    """
    Main endpoint for code generation from canvas snapshot.
    
    Args:
        image: PNG blob of the entire canvas
        tier: User tier - 'free' (Groq models) or 'paid' (Claude/Gemini/OpenAI)
        
    Returns:
        Streaming response with generated TypeScript React code
    """
    print(f"[Backend] Received canvas snapshot: {image.filename} (tier: {tier})")
    
    # Read image bytes
    image_bytes = await image.read()
    print(f"[Backend] Image size: {len(image_bytes)} bytes")
    
    # Encode to base64 for API
    import base64
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    # Generate and stream the code
    return StreamingResponse(
        generate_code_stream(image_base64, tier=tier),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "ArtMorph Code Generator",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    api_keys = {
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "gemini": bool(os.getenv("GEMINI_API_KEY")),
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "groq": bool(os.getenv("GROQ_API_KEY"))
    }

    rate_state = load_rate_limit_state()

    return {
        "status": "healthy",
        "api_keys_configured": api_keys,
        "rate_limit_state": rate_state,
        "tiers": {
            "free": "Groq models (meta-llama/llama-4-maverick-17b-128e-instruct)",
            "paid": "Claude/Gemini/OpenAI (premium models)"
        },
        "recommendation": "Free tier uses Groq. Upgrade to paid (skippable) for Claude/Gemini/OpenAI. Set PROVIDER_PRIORITY to control which paid provider is used first"
    }


if __name__ == "__main__":
    import uvicorn
    
    print("""
    ╔═══════════════════════════════════════════╗
    ║   ArtMorph Backend Server                 ║
    ║   Ready to generate code!                 ║
    ╚═══════════════════════════════════════════╝
    
    Server running at: http://localhost:8000
    
    To use with AI models:
    - Set ANTHROPIC_API_KEY for Claude
    - OR set GEMINI_API_KEY for Google Gemini
    
    Without API keys, a mock generator will be used.
    """)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        log_level="info"
    )
