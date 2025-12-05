import { GoogleGenAI, Type } from "@google/genai";
import { FileNode, NodeType, FileCategory, AssistantMessage } from "../types";

// Helper to get client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Proofreads text using the low-latency Flash model.
 */
export const proofreadText = async (text: string): Promise<{ corrected: string; summary: string }> => {
  const ai = getAiClient();
  // Using standard flash model which is reliable for text tasks
  const modelId = "gemini-2.5-flash"; 

  const prompt = `You are an expert editor. Proofread the following text. 
  Identify grammar, spelling, and punctuation errors. 
  Return the result in JSON format with two fields:
  1. "corrected": The full text with corrections applied.
  2. "summary": A brief bulleted list of the main changes made.
  
  Text to proofread:
  ${text}`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          corrected: { type: Type.STRING },
          summary: { type: Type.STRING },
        },
        required: ["corrected", "summary"]
      }
    }
  });

  const jsonStr = response.text || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse proofread response", e);
    return { corrected: text, summary: "Failed to process changes." };
  }
};

/**
 * Suggests an organized folder structure for a flat list of notes using Flash model.
 */
export const organizeContent = async (nodes: FileNode[]): Promise<{ moves: { nodeId: string; newCategory: string }[] }> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash"; 

  const fileList = nodes
    .filter(n => n.type === NodeType.FILE)
    .map(n => ({ id: n.id, title: n.title, preview: n.content?.substring(0, 100) }));

  if (fileList.length === 0) return { moves: [] };

  const prompt = `I have a list of messy files in a writing app. Help me organize them into categories.
  Available Categories: IDEA, PLANNING, CHARACTER, CHAPTER, OTHER.
  
  Analyze the title and preview content of each file and assign the best category.
  
  Files:
  ${JSON.stringify(fileList)}
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          moves: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nodeId: { type: Type.STRING },
                newCategory: { type: Type.STRING, enum: Object.keys(FileCategory) }
              },
              required: ["nodeId", "newCategory"]
            }
          }
        }
      }
    }
  });

  const jsonStr = response.text || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse organize response", e);
    return { moves: [] };
  }
};

/**
 * Takes a list of file titles and suggests a folder structure.
 * This is used for the "Smart Sort" feature in the sidebar.
 */
export const suggestFolderStructure = async (files: { id: string; title: string }[]): Promise<{ folders: { name: string; fileIds: string[] }[] }> => {
  const ai = getAiClient();
  const modelId = "gemini-2.5-flash";

  if (files.length === 0) return { folders: [] };

  const prompt = `I have a list of files. Group them into logical folders based on their names.
  For example, if files are "Chapter 1", "Chapter 2", "Hero Bio", "Villain Bio", group them into "Chapters" and "Characters".
  
  Files:
  ${JSON.stringify(files)}
  
  Return a JSON object with a 'folders' array. Each folder has a 'name' and a list of 'fileIds' that belong to it.
  Any file not fitting a specific group can be put in a "General" folder.`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          folders: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                fileIds: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "fileIds"]
            }
          }
        }
      }
    }
  });

  const jsonStr = response.text || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse folder structure response", e);
    return { folders: [] };
  }
}

/**
 * Analyzes book progress using Pro model for deep reasoning.
 */
export const analyzeBookProgress = async (
  bookTitle: string, 
  chapters: { title: string; wordCount: number }[]
): Promise<{ progress: number; estimatedCompletion: string; tone: string }> => {
  const ai = getAiClient();
  const modelId = "gemini-3-pro-preview";

  const prompt = `Analyze the progress of a book titled "${bookTitle}".
  Here are the current chapters and their word counts:
  ${JSON.stringify(chapters)}

  1. Guess the completion percentage based on standard novel lengths (approx 50k-80k words) and chapter structure.
  2. Estimate time to complete if the author writes 500 words/day.
  3. Analyze the titles to guess the genre/tone.
  
  Return JSON.`;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          progress: { type: Type.NUMBER, description: "Percentage 0-100" },
          estimatedCompletion: { type: Type.STRING, description: "e.g. '2 weeks'" },
          tone: { type: Type.STRING, description: "Genre or tone guess" }
        }
      }
    }
  });

  const jsonStr = response.text || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse analysis", e);
    return { progress: 0, estimatedCompletion: "Unknown", tone: "Unknown" };
  }
};

/**
 * Chat with the AI Assistant using current file context.
 */
export const chatWithAssistant = async (
  history: AssistantMessage[],
  newMessage: string,
  currentFileContext: string
): Promise<string> => {
  const ai = getAiClient();
  const modelId = "gemini-3-pro-preview"; 

  const systemInstruction = `You are a helpful, creative writing assistant for an author named 'Better Writer AI'. 
  Your goal is to help the user improve their story, suggest plot twists, specific edits, or brainstorm ideas.
  
  The user is currently working on the following text:
  ---
  ${currentFileContext.substring(0, 5000)}... (truncated if too long)
  ---

  Be concise, encouraging, and specific. Do not rewrite the whole chapter unless asked. Focus on the user's specific question.`;

  const chat = ai.chats.create({
    model: modelId,
    config: {
      systemInstruction,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "I couldn't generate a response.";
};