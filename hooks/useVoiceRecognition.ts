import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    transcript: string;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    const startListening = useCallback(() => {
        setError(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Browser not supported.');
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // CHANGED TO TRUE: Helps keep connection open while testing
        recognition.interimResults = true; // Crucial for seeing text *while* speaking
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log("🎤 Microphone started");
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            // DEBUG LOG: See if we get *any* data
            console.log("⚡ Event Result Fired", event.results);

            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const currentText = finalTranscript || interimTranscript;
            console.log("📝 Transcript:", currentText);
            setTranscript(currentText);
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'aborted') return;
            console.error("❌ Speech Error:", event.error);
            setError(event.error);
        };

        recognition.onend = () => {
            console.log("🛑 Microphone stopped");
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    return { isListening, transcript, error, startListening, stopListening, resetTranscript };
};