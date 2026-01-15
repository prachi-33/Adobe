# ArtMorph - Design to Code Add-on

An Adobe Express Add-on that transforms your designs into production-ready React + TypeScript code using AI.

## 🎯 Features

- **Metadata Extraction**: Automatically captures position, dimensions, opacity, and rotation from selected nodes
- **PNG Rendition**: Creates high-quality 2x resolution PNG exports of your selection
- **Streaming AI Response**: Real-time code generation with a "typing" effect
- **Syntax Highlighting**: Beautiful code display with react-syntax-highlighter
- **Animation Mapping**: Maps Adobe Express animations to Framer Motion equivalents (when animation APIs become available)
- **Tailwind CSS**: Generated code uses Tailwind for styling based on exact coordinates

## 📁 Project Structure

```
design-to-code/
├── src/
│   ├── ui/
│   │   └── components/
│   │       ├── App.tsx          # Main React UI component
│   │       └── App.css          # Styling
│   ├── sandbox/
│   │   └── code.ts              # Document Sandbox logic
│   └── models/
│       └── DocumentSandboxApi.ts # Type definitions
├── package.json
└── README_ARTMORPH.md
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd design-to-code
npm install
```

### 2. Start the Add-on

```bash
npm run build
npm run start
```

The add-on will be hosted at `https://localhost:5241`

### 3. Load in Adobe Express

1. Open Adobe Express
2. Go to Add-ons panel
3. Enable "Add-on Development" mode
4. Click "Test your local add-on"
5. Navigate to `https://localhost:5241` or use the deep link: `https://www.adobe.com/go/addon-cli`

### 4. Set Up Backend Server

You need a backend server running on `http://localhost:8000` that accepts:
- **POST** `/generate`
- **FormData** with:
  - `image`: PNG blob
  - `metadata`: JSON string with node metadata
  - `systemPrompt`: Instructions for the LLM

See the [Backend Implementation](#backend-implementation) section below.

## 🔧 How It Works

### Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   UI Runtime    │◄───────►│ Document Sandbox │
│   (App.tsx)     │         │    (code.ts)     │
└────────┬────────┘         └──────────────────┘
         │
         │ HTTP POST
         ▼
┌─────────────────┐
│  AI Backend     │
│  (localhost:8000)│
└─────────────────┘
```

### Flow

1. **User selects elements** in Adobe Express
2. **Clicks "Morph to Code"** button
3. **Sandbox extracts metadata**:
   - Position (x, y)
   - Dimensions (width, height)
   - Opacity
   - Rotation
   - Node type
4. **UI creates PNG rendition** at 2x resolution using `createRenditions()`
5. **FormData sent to backend** with image + metadata
6. **AI streams back TypeScript code** character-by-character
7. **Code displayed** with syntax highlighting

## 💻 Backend Implementation

### Option 1: Python FastAPI Example

```python
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import anthropic  # or openai

app = FastAPI()

# Enable CORS for localhost:5241
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://localhost:5241"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/generate")
async def generate_code(
    image: UploadFile = File(...),
    metadata: str = Form(...),
    systemPrompt: str = Form(...)
):
    # Parse metadata
    nodes = json.loads(metadata)
    
    # Read image
    image_data = await image.read()
    
    # Prepare prompt for LLM
    user_prompt = f"""
Based on this design:

Metadata:
{json.dumps(nodes, indent=2)}

Create a TypeScript React component with:
- Framer Motion for animations
- Tailwind CSS for styling
- Exact positioning from metadata
"""

    # Stream response from LLM
    async def generate():
        # Using Claude as example
        client = anthropic.Anthropic(api_key="your-key")
        
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4000,
            messages=[
                {"role": "system", "content": systemPrompt},
                {"role": "user", "content": user_prompt}
            ]
        ) as stream:
            for text in stream.text_stream:
                yield text

    return StreamingResponse(generate(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Option 2: Node.js Express Example

```javascript
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const upload = multer();

app.use(cors({
    origin: 'https://localhost:5241'
}));

app.post('/generate', upload.single('image'), async (req, res) => {
    const { metadata, systemPrompt } = req.body;
    const nodes = JSON.parse(metadata);
    
    const userPrompt = `
Based on this design:

Metadata:
${JSON.stringify(nodes, null, 2)}

Create a TypeScript React component with:
- Framer Motion for animations
- Tailwind CSS for styling
- Exact positioning from metadata
`;

    const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    const stream = await client.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]
    });

    for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && 
            chunk.delta.type === 'text_delta') {
            res.write(chunk.delta.text);
        }
    }

    res.end();
});

app.listen(8000, () => {
    console.log('Server running on http://localhost:8000');
});
```

## 📝 Code Structure

### App.tsx Key Features

- **State Management**: `isProcessing`, `generatedCode`, `error`
- **Streaming Implementation**: Uses ReadableStream + TextDecoder for character-by-character updates
- **Error Handling**: Comprehensive try-catch with user-friendly error messages
- **Copy to Clipboard**: One-click code copying with confirmation dialog

### Sandbox (code.ts) Key Features

- **Selection Validation**: Ensures user has selected at least one element
- **Metadata Extraction**: Captures all visual properties from selected nodes
- **Future-Ready**: Placeholders for animation metadata when APIs become available

## 🎨 Styling

The UI uses:
- **Spectrum Web Components** for buttons and theme
- **Adobe Clean** font family
- **Custom CSS** for layout and polish
- **VS Code Dark Plus** theme for syntax highlighting

## 🔮 Future Enhancements

When Adobe Express exposes Animation/Timeline APIs:

```typescript
// Future metadata extraction
animations: {
    preset: node.animationPreset,  // e.g., 'Fade', 'Pop', 'Drift'
    duration: node.animationDuration,  // in milliseconds
    delay: node.animationDelay,
    easing: node.animationEasing
}
```

Mapping to Framer Motion:

```typescript
const animationMap = {
    'Fade': { initial: { opacity: 0 }, animate: { opacity: 1 } },
    'Pop': { initial: { scale: 0 }, animate: { scale: 1 } },
    'Drift': { initial: { x: -20, opacity: 0 }, animate: { x: 0, opacity: 1 } }
};
```

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors from Chrome:
1. Go to `chrome://settings/content/all`
2. Search for `new.express.adobe.com`
3. Allow "Local network access"

### Backend Connection Failed

Ensure:
- Backend server is running on `http://localhost:8000`
- CORS is properly configured
- `/generate` endpoint accepts FormData

### No Selection Error

Make sure to:
1. Select at least one element in Adobe Express before clicking "Morph to Code"
2. Elements must be on the current artboard

## 📚 Resources

- [Adobe Express Add-on SDK Documentation](https://developer.adobe.com/express/add-ons/docs/)
- [Document Sandbox APIs](https://developer.adobe.com/express/add-ons/docs/references/document-sandbox/)
- [Spectrum Web Components](https://opensource.adobe.com/spectrum-web-components/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 📄 License

MIT

---

**Built with ❤️ using Adobe Express Add-on SDK**
