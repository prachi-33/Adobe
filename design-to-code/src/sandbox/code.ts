import addOnSandboxSdk from "add-on-sdk-document-sandbox";

const { runtime } = addOnSandboxSdk.instance;

function start(): void {
    // Simplified - we don't need sandbox APIs anymore
    // All rendition creation happens in UI runtime
    const sandboxApi = {
        ping: () => "pong"
    };

    runtime.exposeApi(sandboxApi);
}

start();
