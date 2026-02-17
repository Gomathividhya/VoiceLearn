
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

// --- Translation Service ---
export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  if (targetLanguage.toLowerCase() === 'english') return text;
  
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: `Translate the following text to ${targetLanguage}. Provide ONLY the translation, no extra text: "${text}"` }] }],
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
};

// --- Text-to-Speech ---
export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<Uint8Array | null> => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return decodeBase64(base64Audio);
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
  return null;
};

// --- Chat Service ---
export const sendMessageToTutor = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  const ai = getGeminiClient();
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are a helpful AI learning tutor. You explain concepts simply, encourage curiosity, and can help solve doubts from uploaded materials. Keep responses concise and structured.',
    }
  });
  
  const result = await chat.sendMessage({ message });
  return result.text;
};

// --- Helper Functions for Audio ---
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
