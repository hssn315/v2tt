
export class BrowserSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscription: ((text: string) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  
  // Track processed results to avoid duplication
  private lastProcessedIndex: number = 0;
  // Track last final transcript to perform string deduplication if index fails
  private lastTranscript: string = "";

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false; 
      this.recognition.lang = 'fa-IR';
      this.recognition.maxAlternatives = 1; 
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.lastProcessedIndex = 0;
        this.lastTranscript = "";
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            this.isListening = false;
            if (this.onDisconnect) this.onDisconnect();
          }
        } else {
          if (this.onDisconnect) this.onDisconnect();
        }
      };

      this.recognition.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        
        // Android Chrome bug fix: sometimes sends old results with new index
        // We double check index.
        if (resultIndex < this.lastProcessedIndex) return;

        for (let i = resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
             const transcript = result[0].transcript.trim();
             
             // Strict Deduplication:
             // If the new text is identical to the last processed text, ignore it.
             // This happens frequently on Android.
             if (transcript && transcript !== this.lastTranscript && this.onTranscription) {
                 this.onTranscription(transcript);
                 this.lastTranscript = transcript;
             }
             this.lastProcessedIndex = i + 1;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Browser Speech Error:", event.error);
        if (event.error === 'not-allowed') {
          if (this.onError) this.onError("دسترسی به میکروفون مسدود است.");
          this.isListening = false;
        }
        // Ignore 'no-speech'
      };
    }
  }

  connect(callbacks: {
    onTranscription: (text: string) => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onError: (error: string) => void;
  }) {
    if (!this.recognition) {
      callbacks.onError("مرورگر پشتیبانی نمی‌شود.");
      return;
    }

    this.onTranscription = callbacks.onTranscription;
    this.onDisconnect = callbacks.onDisconnect;
    this.onError = callbacks.onError;
    this.lastProcessedIndex = 0;
    this.lastTranscript = "";

    try {
      this.recognition.start();
      callbacks.onConnect();
    } catch (e) {
      callbacks.onError("خطا در شروع ضبط.");
    }
  }

  async disconnect() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

export class IoTypeSpeechService {
    private mediaRecorder: MediaRecorder | null = null;
    private chunks: Blob[] = [];
    private stream: MediaStream | null = null;
    private apiKey: string = "";

    setApiKey(key: string) {
        this.apiKey = key;
    }

    async start(callbacks: {
        onConnect: () => void;
        onError: (error: string) => void;
    }) {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Check supported mime types
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4'; // Safari
            }

            this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
            this.chunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.chunks.push(e.data);
                }
            };

            this.mediaRecorder.start();
            callbacks.onConnect();
        } catch (e) {
            console.error(e);
            callbacks.onError("دسترسی به میکروفون داده نشد.");
        }
    }

    async stop(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                resolve("");
                return;
            }

            this.mediaRecorder.onstop = async () => {
                try {
                    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
                    const blob = new Blob(this.chunks, { type: mimeType });
                    this.stopStream();
                    
                    const text = await this.uploadToIoType(blob, mimeType);
                    resolve(text);
                } catch (e: any) {
                    this.stopStream();
                    reject(e.message || "خطا در ارتباط با سرور");
                }
            };

            this.mediaRecorder.stop();
        });
    }

    private stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    private async uploadToIoType(audioBlob: Blob, mimeType: string): Promise<string> {
        const formData = new FormData();
        
        // Determine extension based on mimeType
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const filename = `recording.${ext}`;

        const file = new File([audioBlob], filename, { type: mimeType });
        
        // Required parameters based on documentation
        formData.append('type', 'file'); // MANDATORY
        formData.append('file', file);

        // We use a relative path '/iotype/...' which is proxied by Vite (dev) or Nginx (prod)
        // to avoid CORS issues.
        const response = await fetch('/iotype/transcription', {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const json = await response.json();

        if (json.status === 100 && json.result) {
            return json.result;
        } else {
            throw new Error(json.message || "خطای ناشناخته از سرور");
        }
    }
}
