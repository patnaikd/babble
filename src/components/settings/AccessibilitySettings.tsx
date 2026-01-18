import { useSettingsStore } from '@/stores';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export function AccessibilitySettings() {
  const {
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
    theme,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setLetterSpacing,
    setTheme,
  } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Typography Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Typography</h3>

        {/* Font Family */}
        <div className="space-y-2 mb-4">
          <Label>Font Family</Label>
          <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Default</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="OpenDyslexic">OpenDyslexic (Dyslexia-friendly)</SelectItem>
              <SelectItem value="Lexend">Lexend</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <Label>Font Size</Label>
            <span className="text-sm text-muted-foreground">{fontSize}px</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={([v]) => setFontSize(v)}
            min={14}
            max={28}
            step={1}
          />
        </div>

        {/* Line Height */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <Label>Line Height</Label>
            <span className="text-sm text-muted-foreground">{lineHeight}</span>
          </div>
          <Slider
            value={[lineHeight]}
            onValueChange={([v]) => setLineHeight(v)}
            min={1}
            max={2.5}
            step={0.1}
          />
        </div>

        {/* Letter Spacing */}
        <div className="space-y-2">
          <Label>Letter Spacing</Label>
          <Select value={letterSpacing} onValueChange={(v) => setLetterSpacing(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="wide">Wide</SelectItem>
              <SelectItem value="extra-wide">Extra Wide</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Display Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Display</h3>

        {/* Theme */}
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="high-contrast">High Contrast</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Dyslexia Tips */}
      <div className="bg-muted p-4 rounded-lg">
        <h4 className="font-medium mb-2">Tips for Dyslexia</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Try OpenDyslexic font for easier reading</li>
          <li>Increase line height to 1.5 or higher</li>
          <li>Use wider letter spacing</li>
          <li>Adjust font size to your comfort level</li>
          <li>Use the TTS feature to listen while reading</li>
        </ul>
      </div>
    </div>
  );
}
