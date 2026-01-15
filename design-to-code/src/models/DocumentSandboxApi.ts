// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
// Now simplified - we don't need sandbox APIs since createRenditions is available in UI runtime

export interface DocumentSandboxApi {
    ping(): Promise<string>;
}
