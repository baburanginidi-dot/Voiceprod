
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionState, Stage, KnowledgeFile } from '../types';
import { PCM_WORKLET_PROCESSOR_CODE } from '../constants';

// Hardcoded for demo purposes as per instructions to use process.env.API_KEY logic
const API_KEY = process.env.API_KEY || '';

// MOCK KNOWLEDGE CONTENT FOR RAG SIMULATION
const MOCK_KNOWLEDGE_BASE: Record<string, string> = {
  'fee': `
    [RETRIEVED DOCUMENT: FEE STRUCTURE]
    - Full Program Fee: ₹40,000 + GST
    - Upfront Payment Discount: 5% off (Net: ₹38,000 + GST)
    - EMI Option 1: ₹5,000/month for 9 months (No Cost EMI for first 6 months)
    - EMI Option 2: ₹3,500/month for 12 months (Standard Interest)
    - Refund Policy: Full refund within first 7 days if unsatisfied.
  `,
  'loan': `
    [RETRIEVED DOCUMENT: LOAN AGREEMENT]
    - Lending Partners: Propelld, Liquiloans.
    - Eligibility: Income > ₹15,000/month or Co-borrower required.
    - CIBIL Check: Hard enquiry will be performed.
    - Documents Needed: PAN, Aadhaar, Last 3 months bank statement.
    - Sign Process: OTP based e-sign via Aadhaar.
  `,
  'kyc': `
    [RETRIEVED DOCUMENT: KYC GUIDELINES]
    - Acceptable IDs: Aadhaar Card (Front/Back), PAN Card.
    - Verification Method: Video KYC or OTP Validation.
    - Common Rejection Reasons: Blurry text, glare on card, mismatched name.
    - Status: Verification typically takes 2-4 hours.
  `,
  'syllabus': `
    [RETRIEVED DOCUMENT: SYLLABUS CCBP 4.0]
    - Module 1: Frontend (HTML, CSS, JS, React)
    - Module 2: Backend (Node.js, Express, Python, SQL)
    - Module 3: System Design & DSA
    - Projects: clone of Netflix, Amazon, and a personal Portfolio.
    - Placement Support: Mock interviews, resume building included.
  `
};

export class GeminiLiveService {
  private client: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private sessionPromise: Promise<any> | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private workletNode: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  
  // Callbacks
  private onStateChange: (state: ConnectionState) => void;
  private onVolumeChange: (volume: number) => void;
  private onPromotion: (stageId: number) => void;
  private onSpeakingChange: (isSpeaking: boolean) => void;

  constructor(
    onStateChange: (state: ConnectionState) => void,
    onVolumeChange: (volume: number) => void,
    onPromotion: (stageId: number) => void,
    onSpeakingChange: (isSpeaking: boolean) => void
  ) {
    this.client = new GoogleGenAI({ apiKey: API_KEY });
    this.onStateChange = onStateChange;
    this.onVolumeChange = onVolumeChange;
    this.onPromotion = onPromotion;
    this.onSpeakingChange = onSpeakingChange;
  }

  public async connect(stage: Stage, globalInstruction: string, knowledgeFiles: KnowledgeFile[] = []) {
    if (!API_KEY) {
      console.error("API Key is missing");
      this.onStateChange(ConnectionState.ERROR);
      return;
    }

    try {
      this.onStateChange(ConnectionState.CONNECTING);

      // 1. Setup Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Setup Output Analyser for Avatar Animation
      if (this.outputAudioContext) {
        this.outputAnalyser = this.outputAudioContext.createAnalyser();
        this.outputAnalyser.fftSize = 256;
        this.outputAnalyser.connect(this.outputAudioContext.destination);
      }

      // 2. Define Tool
      const promotionTool: FunctionDeclaration = {
        name: 'promote_student_to_next_stage',
        description: 'Call this function ONLY when the user has satisfactorily met the validation criteria based on the conversation to move them to the next learning module.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING, description: "The reason why the student passed." }
          },
          required: ['reason']
        }
      };

      // 3. BUILD RAG CONTEXT
      // Since we don't have a backend vector DB, we simulate RAG by checking filenames
      // and injecting pre-defined content blocks if keywords match.
      let retrievedContext = "";
      
      if (knowledgeFiles.length > 0) {
        retrievedContext += "\n\nRETRIEVED KNOWLEDGE BASE (Use this information to answer user questions):\n";
        
        knowledgeFiles.forEach(file => {
          const name = file.filename.toLowerCase();
          let contentFound = false;
          
          // Check against mock content
          for (const [key, content] of Object.entries(MOCK_KNOWLEDGE_BASE)) {
             if (name.includes(key)) {
                retrievedContext += content;
                contentFound = true;
                break;
             }
          }
          
          // Fallback if no specific content matches, just let agent know file exists
          if (!contentFound) {
             retrievedContext += `\n[FILE AVAILABLE: ${file.filename}]\n(You have access to this file. If asked specific details not in system prompt, politely invent plausible details based on the file name context.)`;
          }
        });
      }

      // 4. Construct Full Prompt
      const fullSystemInstruction = `
GLOBAL SYSTEM INSTRUCTION:
${globalInstruction}

CURRENT STAGE: ${stage.title}

STAGE INSTRUCTION:
${stage.system_instruction}

${retrievedContext}

HIDDEN VALIDATION CRITERIA:
${stage.validation_criteria}
      `.trim();

      console.log("Generated System Instruction with RAG:", fullSystemInstruction);

      // 5. Connect to Live API
      this.sessionPromise = this.client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: fullSystemInstruction,
          tools: [{ functionDeclarations: [promotionTool] }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: this.handleOnOpen.bind(this),
          onmessage: this.handleOnMessage.bind(this),
          onclose: () => this.onStateChange(ConnectionState.DISCONNECTED),
          onerror: (err) => {
            console.error("Gemini Error:", err);
            this.onStateChange(ConnectionState.ERROR);
          }
        }
      });

    } catch (error) {
      console.error("Connection failed:", error);
      this.onStateChange(ConnectionState.ERROR);
    }
  }

  public async disconnect() {
    // Stop Media Stream Tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Close Input Audio Context safely
    if (this.inputAudioContext) {
      if (this.inputAudioContext.state !== 'closed') {
        try {
          await this.inputAudioContext.close();
        } catch (e) {
          console.warn("Error closing input audio context:", e);
        }
      }
      this.inputAudioContext = null;
    }

    // Close Output Audio Context safely
    if (this.outputAudioContext) {
      if (this.outputAudioContext.state !== 'closed') {
        try {
          await this.outputAudioContext.close();
        } catch (e) {
          console.warn("Error closing output audio context:", e);
        }
      }
      this.outputAudioContext = null;
    }

    // Stop Animation Loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Stop active sources
    this.sources.forEach(source => {
      try {
        source.stop();
      } catch(e) {
        // Ignore already stopped sources
      }
    });
    this.sources.clear();
    
    this.onStateChange(ConnectionState.DISCONNECTED);
  }

  private async handleOnOpen() {
    this.onStateChange(ConnectionState.CONNECTED);
    
    // Setup Microphone Stream
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (!this.inputAudioContext) return;

      // Add AudioWorklet
      const blob = new Blob([PCM_WORKLET_PROCESSOR_CODE], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await this.inputAudioContext.audioWorklet.addModule(url);

      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.inputAudioContext, "pcm-processor");

      this.workletNode.port.onmessage = (event) => {
        const float32Data = event.data as Float32Array;
        
        // Only update volume from Mic if AI is NOT speaking
        if (this.sources.size === 0) {
          let sum = 0;
          for(let i = 0; i < float32Data.length; i++) {
            sum += float32Data[i] * float32Data[i];
          }
          const rms = Math.sqrt(sum / float32Data.length);
          this.onVolumeChange(Math.min(rms * 8, 1)); 
        }

        // Convert Float32 to Int16 for Gemini
        const int16Data = this.float32ToInt16(float32Data);
        const base64Data = this.arrayBufferToBase64(int16Data.buffer);

        this.sessionPromise?.then(session => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          });
        });
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.inputAudioContext.destination); // Keep chain alive

    } catch (err) {
      console.error("Mic Error:", err);
      this.onStateChange(ConnectionState.ERROR);
    }
  }

  private monitorOutputVolume() {
    if (!this.outputAnalyser || this.sources.size === 0) return;

    const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
    this.outputAnalyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for(let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const normVolume = Math.min(average / 100, 1); // Normalize for visualization
    
    this.onVolumeChange(normVolume);
    
    this.animationFrameId = requestAnimationFrame(() => this.monitorOutputVolume());
  }

  private async handleOnMessage(message: LiveServerMessage) {
    // Handle Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio && this.outputAudioContext && this.outputAnalyser) {
      
      // If this is the first chunk of a response, start monitoring loop
      if (this.sources.size === 0) {
         this.onSpeakingChange(true);
         this.monitorOutputVolume();
      }

      const audioData = this.base64ToArrayBuffer(base64Audio);
      const audioBuffer = await this.decodeAudioData(audioData, this.outputAudioContext);
      
      this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      // Connect to Analyser instead of destination directly (Analyser is connected to destination)
      source.connect(this.outputAnalyser);
      
      source.onended = () => {
        this.sources.delete(source);
        if (this.sources.size === 0) {
           this.onSpeakingChange(false);
           if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
           this.onVolumeChange(0); // Reset volume
        }
      };
      
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);
    }

    // Handle Tool Calls (Promotion)
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        if (fc.name === 'promote_student_to_next_stage') {
          console.log("Promotion triggered:", fc.args);
          this.onPromotion(1); // Increment stage
          
          // Respond to tool
          this.sessionPromise?.then(session => {
            session.sendToolResponse({
              functionResponses: {
                id: fc.id,
                name: fc.name,
                response: { result: "Promotion successful" }
              }
            });
          });
        }
      }
    }
    
    // Handle Interruption
    if (message.serverContent?.interrupted) {
        this.sources.forEach(source => source.stop());
        this.sources.clear();
        this.nextStartTime = 0;
        this.onSpeakingChange(false);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        this.onVolumeChange(0);
    }
  }

  // Helpers
  private float32ToInt16(float32: Float32Array): Int16Array {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async decodeAudioData(
      data: ArrayBuffer,
      ctx: AudioContext
    ): Promise<AudioBuffer> {
      // Raw PCM 16-bit 24kHz decoding
      const dataView = new DataView(data);
      const numChannels = 1;
      const sampleRate = 24000; // Gemini output rate
      const numSamples = data.byteLength / 2;
      
      const buffer = ctx.createBuffer(numChannels, numSamples, sampleRate);
      const channelData = buffer.getChannelData(0); // Mono
  
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true); // Little endian
        channelData[i] = int16 / 32768.0;
      }
  
      return buffer;
  }
}
