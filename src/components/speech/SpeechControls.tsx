import { Play, Pause, Square, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useSpeechStore, useSettingsStore } from '@/stores';
import { useEffect } from 'react';

const SPEED_PRESETS = [0.5, 1, 1.25, 1.5, 2] as const;

export function SpeechControls() {
  const { voices, isPlaying, isPaused, isSupported, play, pause, stop, changeRate, changeVoice } = useSpeechSynthesis();
  const { selectedVoiceURI, rate, setVoice, setRate } = useSpeechStore();
  const { defaultVoiceURI, defaultRate, setDefaultVoice, setDefaultRate } = useSettingsStore();

  // Initialize voice and rate from persisted settings
  useEffect(() => {
    const enUSVoices = voices.filter(v => v.lang === 'en-US');

    // Initialize voice from persisted settings or pick a default
    if (enUSVoices.length > 0 && !selectedVoiceURI) {
      if (defaultVoiceURI) {
        // Use persisted voice if it's still available
        const voiceExists = enUSVoices.some(v => v.voiceURI === defaultVoiceURI);
        if (voiceExists) {
          setVoice(defaultVoiceURI);
        } else {
          // Fallback to system default or first available
          const fallbackVoice = enUSVoices.find(v => v.default) || enUSVoices[0];
          setVoice(fallbackVoice.voiceURI);
          setDefaultVoice(fallbackVoice.voiceURI);
        }
      } else {
        // No persisted voice, pick a default
        const defaultVoice = enUSVoices.find(v => v.default) || enUSVoices[0];
        setVoice(defaultVoice.voiceURI);
        setDefaultVoice(defaultVoice.voiceURI);
      }
    }
  }, [voices, selectedVoiceURI, defaultVoiceURI, setVoice, setDefaultVoice]);

  // Initialize rate from persisted settings
  useEffect(() => {
    if (defaultRate && defaultRate !== rate) {
      setRate(defaultRate);
    }
    // Only run on mount and when defaultRate changes from storage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultRate]);

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
            changeVoice(value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {voices
              .filter((voice) => voice.lang === 'en-US')
              .map((voice) => (
                <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Speed:
        </span>
        <div className="flex items-center gap-1">
          {SPEED_PRESETS.map((preset) => (
            <Button
              key={preset}
              variant={rate === preset ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setRate(preset);
                setDefaultRate(preset);
                changeRate(preset);
              }}
              className="h-8 px-3 text-xs"
            >
              {preset}x
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
