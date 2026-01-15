// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedCode, setGeneratedCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<"code" | "preview">("code");
    const [previewHtml, setPreviewHtml] = useState("");
    const [tier, setTier] = useState<"free" | "paid">("free");
    const [showPaywall, setShowPaywall] = useState(false);

    /**
     * Generate HTML preview from React code
     */
    const generatePreview = (code: string) => {
        // Create a complete HTML page with React, Tailwind, and Framer Motion
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/framer-motion@11/dist/framer-motion.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body { margin: 0; padding: 0; overflow: auto; }
        #root { min-height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module">
        const { motion } = Motion;
        
        ${code.replace('export default', 'const Component =')}
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(Component));
    </script>
</body>
</html>`;
        setPreviewHtml(html);
    };

    /**
     * Captures entire canvas and generates code
     */
    const handleGenerateCode = async () => {
        try {
            console.log('[UI] Starting canvas snapshot to code generation');
            setIsProcessing(true);
            setError(null);
            setGeneratedCode("");

            // Step 1: Capture entire page as PNG
            console.log('[UI] Creating canvas rendition...');
            let renditions;
            try {
                renditions = await addOnUISdk.app.document.createRenditions(
                    {
                        range: addOnUISdk.constants.Range.currentPage,
                        format: addOnUISdk.constants.RenditionFormat.png,
                        requestedSize: {
                            width: 2000,
                            height: 2000
                        }
                    } as any,
                    addOnUISdk.constants.RenditionIntent.export
                );
                console.log('[UI] Canvas rendition created:', renditions.length);
            } catch (err) {
                console.error('[UI] Error creating rendition:', err);
                throw new Error(`Failed to capture canvas: ${err instanceof Error ? err.message : String(err)}`);
            }

            if (renditions.length === 0) {
                throw new Error("Failed to create canvas snapshot");
            }

            const blob = renditions[0].blob;
            console.log('[UI] Canvas blob size:', blob.size);

            // Step 2: Send to backend
            const formData = new FormData();
            formData.append("image", blob, "canvas.png");

            console.log('[UI] Sending to backend with tier:', tier);
            const response = await fetch(`http://localhost:8000/generate?tier=${tier}`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Backend error: ${response.statusText}`);
            }

            // Step 3: Stream the response character-by-character
            console.log('[UI] Streaming response...');
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("Response body is not readable");
            }

            const decoder = new TextDecoder();
            let accumulatedCode = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                accumulatedCode += chunk;
                setGeneratedCode(accumulatedCode);
            }

            console.log('[UI] Code generation complete');
            
            // Generate preview HTML
            if (accumulatedCode) {
                generatePreview(accumulatedCode);
            }
            
            setIsProcessing(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
            setIsProcessing(false);
        }
    };

    return (
        // Please note that the below "<Theme>" component does not react to theme changes in Express.
        // You may use "addOnUISdk.app.ui.theme" to get the current theme and react accordingly.
        <Theme system="express" scale="medium" color="light">
            <div className="container">
                <div className="header">
                    <h1>🎨 ArtMorph</h1>
                    <p>Transform your Adobe Express canvas into React code</p>
                </div>

                <div className="controls">
                    <div className="tier-selector">
                        <div className="tier-options">
                            <button
                                className={`tier-btn ${tier === "free" ? "active" : ""}`}
                                onClick={() => {
                                    setTier("free");
                                    setShowPaywall(false);
                                }}
                            >
                                🆓 Free Tier
                                <span className="tier-desc">Groq Llama Vision</span>
                            </button>
                            <button
                                className={`tier-btn ${tier === "paid" ? "active" : ""}`}
                                onClick={() => {
                                    setShowPaywall(true);
                                }}
                            >
                                ⭐ Premium
                                <span className="tier-desc">Claude/Gemini/GPT</span>
                            </button>
                        </div>
                    </div>
                    
                    <Button 
                        size="m" 
                        variant="cta"
                        onClick={handleGenerateCode}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Generating..." : "📸 Snapshot to Code"}
                    </Button>
                </div>

                {showPaywall && (
                    <div className="paywall-modal">
                        <div className="paywall-content">
                            <h2>⭐ Upgrade to Premium</h2>
                            <p>Premium tier includes:</p>
                            <ul>
                                <li>🤖 Anthropic Claude (best quality)</li>
                                <li>✨ Google Gemini (fast & accurate)</li>
                                <li>🧠 OpenAI GPT-4o (vision capable)</li>
                            </ul>
                            <div className="paywall-actions">
                                <button
                                    className="paywall-btn primary"
                                    onClick={() => {
                                        setTier("paid");
                                        setShowPaywall(false);
                                    }}
                                >
                                    Try Premium (Skip Paywall)
                                </button>
                                <button
                                    className="paywall-btn secondary"
                                    onClick={() => setShowPaywall(false)}
                                >
                                    Stay Free
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="error-banner">
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {generatedCode && (
                    <div className="code-output">
                        <div className="code-header">
                            <div className="view-tabs">
                                <button
                                    className={`tab-btn ${activeView === "code" ? "active" : ""}`}
                                    onClick={() => setActiveView("code")}
                                >
                                    💻 Code
                                </button>
                                <button
                                    className={`tab-btn ${activeView === "preview" ? "active" : ""}`}
                                    onClick={() => setActiveView("preview")}
                                >
                                    👁️ Preview
                                </button>
                            </div>
                            <button
                                className="copy-btn"
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedCode);
                                    addOnUISdk.app.showModalDialog({
                                        variant: "information" as any,
                                        title: "Copied!",
                                        description: "Code copied to clipboard"
                                    });
                                }}
                            >
                                📋 Copy
                            </button>
                        </div>
                        
                        {activeView === "code" ? (
                            <SyntaxHighlighter
                                language="typescript"
                                style={vscDarkPlus}
                                customStyle={{
                                    maxHeight: "500px",
                                    borderRadius: "8px",
                                    fontSize: "12px"
                                }}
                                showLineNumbers
                            >
                                {generatedCode}
                            </SyntaxHighlighter>
                        ) : (
                            <div className="preview-container">
                                <iframe
                                    srcDoc={previewHtml}
                                    title="Component Preview"
                                    sandbox="allow-scripts"
                                    className="preview-iframe"
                                />
                            </div>
                        )}
                    </div>
                )}

                {!generatedCode && !error && !isProcessing && (
                    <div className="instructions">
                        <h3>How to use:</h3>
                        <ol>
                            <li>Create your design in Adobe Express</li>
                            <li>Click "Snapshot to Code" to capture the entire canvas</li>
                            <li>The AI will analyze your design and generate React code</li>
                            <li>Make sure your backend server is running on http://localhost:8000</li>
                        </ol>
                    </div>
                )}
            </div>
        </Theme>
    );
};

export default App;
