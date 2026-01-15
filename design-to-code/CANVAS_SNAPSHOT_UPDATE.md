# Canvas Snapshot Update

## Changes Made

The add-on has been simplified to use a **canvas snapshot approach** instead of element selection metadata extraction.

### What Changed

#### Before (Selection-based):
1. User selects elements on canvas
2. Sandbox extracts metadata (position, size, rotation, etc.)
3. UI creates rendition of selection
4. Both metadata + image sent to backend
5. AI generates code from metadata structure

#### After (Canvas snapshot):
1. User clicks "Snapshot to Code" 
2. UI captures entire current page as PNG (2000x2000px)
3. Only the canvas image sent to backend
4. AI vision model analyzes the screenshot and generates code

### Benefits

- ✅ **No more selection errors** - eliminates "cannot read property 'type' of undefined"
- ✅ **Simpler workflow** - no need to select specific elements
- ✅ **Better AI analysis** - vision models can see the complete design context
- ✅ **Faster execution** - fewer API calls between sandbox and UI
- ✅ **Cleaner codebase** - removed complex metadata extraction logic

### Files Modified

1. **src/sandbox/code.ts** - Simplified to empty API (no longer needed)
2. **src/models/DocumentSandboxApi.ts** - Removed metadata interfaces
3. **src/ui/components/App.tsx** - Updated to capture canvas snapshot via `createRenditions()`
4. **backend/server.py** - Simplified to accept only image (no metadata)

### How to Use

1. **Start the backend:**
   ```bash
   cd backend
   python server.py
   ```

2. **Build and run add-on:**
   ```bash
   npm run build
   npm run start
   ```

3. **In Adobe Express:**
   - Create your design
   - Open ArtMorph add-on
   - Click "📸 Snapshot to Code"
   - Wait for AI to generate React code

### API Configuration

The backend supports multiple AI providers:

- **Anthropic Claude** (recommended): Set `ANTHROPIC_API_KEY` environment variable
- **OpenAI GPT-4 Vision**: Set `OPENAI_API_KEY` environment variable  
- **Mock mode**: If no API keys set, returns demo component

### Technical Details

**Canvas Capture:**
```typescript
const renditions = await addOnUISdk.app.document.createRenditions(
  {
    range: addOnUISdk.constants.Range.currentPage,
    format: addOnUISdk.constants.RenditionFormat.png,
    requestedSize: { width: 2000, height: 2000 }
  },
  addOnUISdk.constants.RenditionIntent.export
);
```

**Backend Processing:**
```python
@app.post("/generate")
async def generate_code_endpoint(image: UploadFile = File(...)):
    # Encode image to base64
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    
    # Stream AI-generated code
    return StreamingResponse(generate_code_stream(image_base64), ...)
```

### Next Steps

- Test with various canvas designs
- Configure AI API keys for production-quality code generation
- Customize system prompt in `backend/server.py` for specific code styles
