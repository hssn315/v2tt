
export class BrowserSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscription: ((text: string) => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  
  // متغیرهای جدید برای جلوگیری از تکرار
  private lastProcessedIndex: number = 0;
  private lastTranscript: string = "";

  constructor() {
    // بررسی پشتیبانی مرورگر (webkit برای سافاری/کروم و استاندارد)
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // ضبط مداوم
      this.recognition.interimResults = true; // نتایج لحظه‌ای (برای دقت بهتر موتور لازم است اما ما فقط نهایی را می‌گیریم)
      this.recognition.lang = 'fa-IR'; // زبان فارسی
      // تنظیمات برای دقت بیشتر
      this.recognition.maxAlternatives = 1; 
      
      this.recognition.onstart = () => {
        this.isListening = true;
        this.lastProcessedIndex = 0;
        this.lastTranscript = "";
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
        // حلقه روی نتایج
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // اگر این نتیجه قبلاً پردازش شده است، رد شو (جلوگیری از باگ اندروید)
          if (i < this.lastProcessedIndex) continue;

          const result = event.results[i];
          
          if (result.isFinal) {
            const transcript = result[0].transcript.trim();
            
            // جلوگیری از تکرار: اگر متن دقیقاً همان متن قبلی است، نادیده بگیر
            // گاهی اوقات موتور همان جمله را دوباره می‌فرستد
            if (transcript.length > 0 && transcript !== this.lastTranscript) {
                if (this.onTranscription) {
                    this.onTranscription(transcript);
                }
                this.lastTranscript = transcript;
            }
            
            // به‌روزرسانی اندیس پردازش شده
            this.lastProcessedIndex = i + 1;
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error", event.error);
        if (event.error === 'not-allowed') {
          if (this.onError) this.onError("دسترسی به میکروفون مسدود است.");
          this.isListening = false;
        } else if (event.error === 'no-speech') {
            // خطا نیست، فقط سکوت بوده
            return; 
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
    
    // ریست کردن وضعیت
    this.lastProcessedIndex = 0;
    this.lastTranscript = "";

    try {
      this.recognition.start();
      callbacks.onConnect();
    } catch (e) {
      console.error(e);
      callbacks.onError("امکان شروع ضبط وجود ندارد. شاید میکروفون درگیر است.");
    }
  }

  async disconnect() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}
