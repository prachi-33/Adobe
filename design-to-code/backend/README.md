# Backend Server for ArtMorph

## Quick Start

### Option 1: Using Python (Recommended)

1. **Install dependencies:**
```bash
cd backend
pip install fastapi uvicorn anthropic openai python-multipart
```

2. **Set API key (choose one):**
```bash
# For Claude (recommended)
export ANTHROPIC_API_KEY="your-key-here"

# OR for OpenAI
export OPENAI_API_KEY="your-key-here"
```

3. **Run the server:**
```bash
python server.py
```

The server will start at `http://localhost:8000`

### Option 2: Using Node.js

See `server.js` for a Node.js implementation.

```bash
npm install express multer cors @anthropic-ai/sdk
node server.js
```

## Testing Without API Keys

The server includes a mock generator that works without any API keys for testing purposes. It will generate a basic React component based on the metadata.

## Endpoints

### `POST /generate`

Generates TypeScript React code from design metadata.

**Request:**
- `image` (File): PNG blob of the design
- `metadata` (FormData): JSON string with node information
- `systemPrompt` (FormData): Instructions for the LLM

**Response:**
- Streaming text/plain response with generated code

### `GET /`

Health check - returns server status

### `GET /health`

Detailed health check showing configured API keys

## Environment Variables

- `ANTHROPIC_API_KEY`: Your Claude API key
- `OPENAI_API_KEY`: Your OpenAI API key

Only one is required. The server will try Anthropic first, then OpenAI, then fall back to mock generator.

## CORS Configuration

The server is configured to accept requests from:
- `https://localhost:5241` (local development)
- `https://new.express.adobe.com` (production Adobe Express)

## Production Deployment

For production, consider:
1. Using environment variables for API keys
2. Adding rate limiting
3. Implementing authentication
4. Using a production ASGI server (e.g., gunicorn with uvicorn workers)
5. Adding logging and monitoring

Example production command:
```bash
gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
