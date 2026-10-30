export const AudioService = {
  playTick: () => console.log('Audio: Tick'),
  playSuccess: () => console.log('Audio: Success'),
  speak: (text: string, muted: boolean) => {
    if (!muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  },
};
