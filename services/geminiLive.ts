
export class BrowserSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscription: ((text: string) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  
  // Track processed results to avoid duplication
  private lastProcessedIndex: number = 0;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false; // Only final results to reduce jitter/duplication
      this.recognition.lang = 'fa-IR';
      this.recognition.maxAlternatives = 1; 
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.lastProcessedIndex = 0;
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
        
        // Prevent processing old results (Android bug fix)
        if (resultIndex < this.lastProcessedIndex) return;

        for (let i = resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
             const transcript = result[0].transcript.trim();
             if (transcript && this.onTranscription) {
                 this.onTranscription(transcript);
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
        // Ignore 'no-speech' as it just means silence
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
            this.mediaRecorder = new MediaRecorder(this.stream);
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
                const blob = new Blob(this.chunks, { type: 'audio/webm' });
                this.stopStream();
                
                try {
                    const text = await this.uploadToIoType(blob);
                    resolve(text);
                } catch (e: any) {
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

    private async uploadToIoType(audioBlob: Blob): Promise<string> {
        const formData = new FormData();
        // Convert Blob to File (IoType usually expects a file)
        const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        formData.append('file', file);

        const response = await fetch('https://www.iotype.com/developer/transcription', {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        });

        const json = await response.json();

        if (json.status === 100 && json.result) {
            return json.result;
        } else {
            throw new Error(json.message || "خطای ناشناخته از سرور");
        }
    }
}
