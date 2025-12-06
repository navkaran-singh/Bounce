/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_FIREBASE_API_KEY: string;
    readonly VITE_GEMINI_API_KEY: string;
    // Add other env variables here if you have them
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}