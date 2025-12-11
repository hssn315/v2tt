import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface LiveServiceCallbacks {
  onTranscription: (text: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onError: (error: string) => void;
}

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private TARGET_SAMPLE_RATE = 16000;

  constructor() {
    // Initialization deferred to connect()
  }

  async connect(callbacks: LiveServiceCallbacks) {
    try {
      const apiKey = process.env.API_KEY || 'AIzaSyCXyEqGFycn9KUqVDNLgecIvRtw_r-0sMw';
      
      if (!apiKey) {
        throw new Error("API Key is missing.");
      }

      this.ai = new GoogleGenAI({ apiKey });

      // 2. Mobile Browser Compatibility Check
      // We do not force sampleRate here anymore, allowing the browser to pick the native one (e.g. 44100 or 48000)
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass();

      // Resume context if suspended (iOS/Android Policy)
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }
      
      // 3. Get Microphone Stream
      // Removing explicit sampleRate from getUserMedia helps with iOS compatibility
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // 4. Connect to Gemini Live
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            callbacks.onConnect();
            this.startAudioStream(callbacks);
          },
          onmessage: (message: LiveServerMessage) => {
            const outputText = message?.serverContent?.outputTranscription?.text;
            if (outputText) {
               callbacks.onTranscription(outputText);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error("Gemini Live Error:", e);
            callbacks.onError("خطا در ارتباط با هوش مصنوعی. لطفاً اینترنت خود را چک کنید.");
          },
          onclose: (e: CloseEvent) => {
            callbacks.onDisconnect();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO], 
          outputAudioTranscription: {},
          systemInstruction: "شما یک دستیار هوشمند تبدیل گفتار به نوشتار هستید. وظیفه شما فقط شنیدن دقیق صدا و تبدیل آن به متن فارسی سلیس و صحیح است. هرچه می‌شنوید را بنویسید و اشتباهات گرامری یا املایی گوینده را در متن خروجی اصلاح کنید. به هیچ عنوان به سوالات پاسخ ندهید، نظر ندهید و مکالمه نکنید. فقط نقش ماشین‌تایپ را ایفا کنید.",
        },
      };

      if (this.ai && this.ai.live) {
          this.sessionPromise = this.ai.live.connect(config);
      } else {
          throw new Error("خطا در راه‌اندازی سرویس هوش مصنوعی.");
      }

    } catch (error: any) {
      console.error("Connection Error:", error);
      let errorMessage = "خطا در برقراری ارتباط";
      
      if (error.message && error.message.includes("API Key")) {
          errorMessage = "کلید API تنظیم نشده است.";
      } else if (error.message && error.message.includes("not found") || error.name === 'NotAllowedError') {
          errorMessage = "دسترسی به میکروفون داده نشد.";
      } else if (error.message) {
          errorMessage = error.message;
      }
      
      callbacks.onError(errorMessage);
    }
  }

  private startAudioStream(callbacks: LiveServiceCallbacks) {
    if (!this.inputAudioContext || !this.mediaStream || !this.sessionPromise) return;

    try {
        this.source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
        
        // Use a larger buffer size (4096) for better mobile performance to prevent audio glitches
        this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (e) => {
          if (!this.sessionPromise) return;

          const inputData = e.inputBuffer.getChannelData(0);
          
          // Downsample logic: Convert from Device Rate (e.g. 48000) to Model Rate (16000)
          // This is crucial for mobile devices that don't support native 16k recording
          const currentSampleRate = this.inputAudioContext!.sampleRate;
          const downsampledData = this.downsampleBuffer(inputData, currentSampleRate, this.TARGET_SAMPLE_RATE);
          
          const pcmBlob = this.createBlob(downsampledData);
          
          this.sessionPromise.then((session) => {
            if (session && typeof session.sendRealtimeInput === 'function') {
                session.sendRealtimeInput({ media: pcmBlob });
            }
          }).catch(err => {
              // Suppress minor stream errors
          });
        };

        this.source.connect(this.processor);
        this.processor.connect(this.inputAudioContext.destination);
    } catch (e) {
        console.error("Audio Stream Error:", e);
        callbacks.onError("خطا در پردازش صدا");
    }
  }

  /**
   * Converts audio from the browser's native sample rate to 16000Hz required by Gemini
   */
  private downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
    if (outputRate === inputRate) {
      return buffer;
    }
    const sampleRateRatio = inputRate / outputRate;
    const newLength = Math.round(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      
      // Averaging allows for smoother downsampling than just dropping samples
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Scale Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const uint8 = new Uint8Array(int16.buffer);
    
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    const base64 = btoa(binary);

    return {
      data: base64,
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  async disconnect() {
    try {
        if (this.processor) {
          this.processor.disconnect();
          this.processor = null;
        }
        if (this.source) {
          this.source.disconnect();
          this.source = null;
        }
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop());
          this.mediaStream = null;
        }
        if (this.inputAudioContext) {
          if (this.inputAudioContext.state !== 'closed') {
              await this.inputAudioContext.close();
          }
          this.inputAudioContext = null;
        }
        
        if (this.sessionPromise) {
            const session = await this.sessionPromise;
            if (session && typeof session.close === 'function') {
                session.close();
            }
        }
    } catch (e) {
        console.warn("Disconnect Error:", e);
    } finally {
        this.sessionPromise = null; 
        this.ai = null;
    }
  }
}