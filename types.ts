
export interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface LiveConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface AudioVisualizerProps {
  isRecording: boolean;
}

export type RecognitionMode = 'browser' | 'server';

export interface AppSettings {
  ioTypeApiKey: string;
}
