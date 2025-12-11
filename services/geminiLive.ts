
export class BrowserSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscription: ((text: string) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private finalTranscript: string = '';

  constructor() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Keep listening even after user pauses
      this.recognition.interimResults = true; // Show results while talking
      this.recognition.lang = 'fa-IR'; // Set language to Persian
      
      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onend = () => {
        // If it stops but we didn't explicitly stop it (e.g. iOS silence timeout), restart it
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
        let interimTranscript = '';
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (newFinal || interimTranscript) {
           // We send back the new chunk. The App component will append it.
           // Note: Web Speech API logic differs from streaming. 
           // Usually we want to return just the *new* valid text.
           // However, for simplicity in the UI, we trigger the callback.
           
           if (this.onTranscription) {
             // Sending interim results for real-time feel
             // In a real app you might want to manage state better to avoid duplication,
             // but here we simply pass the interim + final logic handled by the component or just raw text.
             // For this implementation, let's send the latest finalize chunk if available, or interim.
             
             if (newFinal) {
                 this.onTranscription(newFinal + ' ');
             }
           }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        if (event.error === 'not-allowed') {
          if (this.onError) this.onError("دسترسی به میکروفون مسدود است.");
          this.isListening = false;
        } else if (event.error === 'no-speech') {
          // Ignore no-speech errors, just wait
        } else {
          // if (this.onError) this.onError("خطا در شناسایی صدا: " + event.error);
        }
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
      callbacks.onError("مرورگر شما از تبدیل صدا به متن پشتیبانی نمی‌کند. لطفاً از کروم یا سافاری استفاده کنید.");
      return;
    }

    this.onTranscription = callbacks.onTranscription;
    this.onDisconnect = callbacks.onDisconnect;
    this.onError = callbacks.onError;

    try {
      this.recognition.start();
      this.isListening = true;
      callbacks.onConnect();
    } catch (e) {
      console.error(e);
      callbacks.onError("امکان شروع ضبط وجود ندارد.");
    }
  }

  async disconnect() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
