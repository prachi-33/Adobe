# ⚡ Quick Start Guide - ArtMorph

Get your design-to-code add-on running in 5 minutes!

## Step 1: Start the Add-on (1 minute)

```bash
cd design-to-code
npm run build && npm run start
```

✅ You should see: `Your add-on 'design-to-code' is hosted on: https://localhost:5241`

## Step 2: Load in Adobe Express (30 seconds)

Click this link: **[https://www.adobe.com/go/addon-cli](https://www.adobe.com/go/addon-cli)**

OR manually:
1. Open Adobe Express
2. Click Add-ons panel (puzzle piece icon)
3. Toggle "Add-on Development" ON
4. Click "Test your local add-on"

⚠️ **Chrome Users:** If you see a CORS error, allow "Local network access" permission

## Step 3: Start the Backend (2 minutes)

### Option A: With AI (Recommended)

```bash
cd backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY="your-api-key-here"
python server.py
```

### Option B: Mock Mode (No API Key Needed)

```bash
cd backend
pip install -r requirements.txt
python server.py
```

The mock mode will generate basic code without AI.

✅ You should see: `Server running at: http://localhost:8000`

## Step 4: Test It! (1 minute)

1. In Adobe Express, create a simple design (add a rectangle or text)
2. **Select** the element(s) you created
3. In the ArtMorph add-on panel, click **"🪄 Morph to Code"**
4. Watch the code generate in real-time!
5. Click **"📋 Copy"** to copy the generated code

## 🎉 That's It!

Your design should now be transformed into React + TypeScript code!

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "No selection found" | Select at least one element in Adobe Express first |
| "Backend error: Failed to fetch" | Make sure backend server is running on port 8000 |
| CORS error in Chrome | Allow local network access for new.express.adobe.com |
| Code not streaming | Check browser console for errors; ensure backend is responding |

## 📝 Example Workflow

1. **Design in Adobe Express:**
   - Create a button (rectangle + text)
   - Add some styling (color, size)
   - Add animation (when available)

2. **Select & Generate:**
   - Select your button components
   - Click "Morph to Code"

3. **Get Code:**
   - TypeScript React component
   - Tailwind CSS styling
   - Framer Motion animations
   - Production-ready!

## 🔗 Next Steps

- Read [README_ARTMORPH.md](./README_ARTMORPH.md) for detailed documentation
- Check [backend/README.md](./backend/README.md) for backend options
- See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details

---

**Happy morphing! Turn your designs into code!** ✨
