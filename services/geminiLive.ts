
export class BrowserSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscription: ((text: string) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor() {
    // بررسی پشتیبانی مرورگر (webkit برای سافاری/کروم و استاندارد)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // ضبط مداوم
      this.recognition.interimResults = true; // نتایج لحظه‌ای
      this.recognition.lang = 'fa-IR'; // زبان فارسی
      
      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onend = () => {
        // اگر کاربر خودش قطع نکرده باشد، تلاش برای اتصال مجدد (مخصوصاً برای iOS)
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // گاهی اوقات بلافاصله نمی‌توان دوباره شروع کرد
            this.isListening = false;
            if (this.onDisconnect) this.onDisconnect();
          }
        } else {
          if (this.onDisconnect) this.onDisconnect();
        }
      };

      this.recognition.onresult = (event: any) => {
        let newFinal = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            newFinal += event.results[i][0].transcript;
          }
        }

        if (newFinal && this.onTranscription) {
           this.onTranscription(newFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        if (event.error === 'not-allowed') {
          if (this.onError) this.onError("دسترسی به میکروفون مسدود است.");
          this.isListening = false;
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
