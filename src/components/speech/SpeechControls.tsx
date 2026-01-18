import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useSpeechStore, useSettingsStore } from '@/stores';
import { useEffect } from 'react';

export function SpeechControls() {
  const { voices, isPlaying, isPaused, isSupported, play, pause, stop } = useSpeechSynthesis();
  const { selectedVoiceURI, rate, setVoice, setRate } = useSpeechStore();
  const { defaultVoiceURI, defaultRate, setDefaultVoice, setDefaultRate } = useSettingsStore();

  // Set default voice when voices load
  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceURI && !defaultVoiceURI) {
      const defaultVoice = voices.find(v => v.default) || voices[0];
      setVoice(defaultVoice.voiceURI);
      setDefaultVoice(defaultVoice.voiceURI);
    } else if (defaultVoiceURI && !selectedVoiceURI) {
      setVoice(defaultVoiceURI);
    }
  }, [voices, selectedVoiceURI, defaultVoiceURI, setVoice, setDefaultVoice]);

  // Set default rate
  useEffect(() => {
    if (rate === 1 && defaultRate !== 1) {
      setRate(defaultRate);
    }
  }, [rate, defaultRate, setRate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space' && e.ctrlKey) {
        e.preventDefault();
        if (isPlaying) {
          pause();
        } else {
          play();
        }
      } else if (e.code === 'Escape' && isPlaying) {
        stop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, play, pause, stop]);

  if (!isSupported) {
    return (
      <div className="h-16 border-b bg-muted/50 flex items-center justify-center px-4">
        <p className="text-muted-foreground">
          Text-to-speech is not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="h-16 border-b bg-muted/50 flex items-center gap-4 px-4 flex-shrink-0">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isPlaying ? "secondary" : "default"}
                size="icon"
                onClick={isPlaying && !isPaused ? pause : play}
                className="h-10 w-10"
              >
                {isPlaying && !isPaused ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPlaying && !isPaused ? 'Pause (Ctrl+Space)' : 'Play (Ctrl+Space)'}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={stop}
                disabled={!isPlaying && !isPaused}
                className="h-10 w-10"
              >
                <Square className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Stop (Escape)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Voice Selector */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedVoiceURI || ''}
          onValueChange={(value) => {
            setVoice(value);
            setDefaultVoice(value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {voices.map((voice) => (
              <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-3 min-w-[180px]">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Speed: {rate.toFixed(1)}x
        </span>
        <Slider
          value={[rate]}
          onValueChange={([value]) => {
            setRate(value);
            setDefaultRate(value);
          }}
          min={0.5}
          max={2}
          step={0.1}
          className="w-24"
        />
      </div>
    </div>
  );
}
