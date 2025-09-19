'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Palette, Type, Bell, Save, RefreshCw, Layout, Eye, Accessibility } from 'lucide-react';

interface SettingsState {
  theme: {
    primaryColor: string;
    mode: 'light' | 'dark' | 'auto';
    accentColor: string;
  };
  typography: {
    fontFamily: string;
    fontSize: string;
    fontWeight: string;
  };
  layout: {
    density: 'compact' | 'comfortable' | 'spacious';
    sidebarPosition: 'left' | 'right';
    borderRadius: string;
    animations: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    focusRings: boolean;
  };
  notifications: {
    todoDeadlines: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    deadlineAdvanceHours: number;
  };
}

const COLOR_PRESETS = [
  { name: 'Green (Default)', value: '#22c55e', accent: '#16a34a' },
  { name: 'Blue', value: '#3b82f6', accent: '#2563eb' },
  { name: 'Purple', value: '#8b5cf6', accent: '#7c3aed' },
  { name: 'Red', value: '#ef4444', accent: '#dc2626' },
  { name: 'Orange', value: '#f97316', accent: '#ea580c' },
  { name: 'Pink', value: '#ec4899', accent: '#db2777' },
  { name: 'Teal', value: '#14b8a6', accent: '#0d9488' },
  { name: 'Indigo', value: '#6366f1', accent: '#4f46e5' },
];

const FONT_FAMILIES = [
  { name: 'Inter (Default)', value: 'Inter, sans-serif', category: 'sans-serif' },
  { name: 'System Font', value: '-apple-system, BlinkMacSystemFont, sans-serif', category: 'sans-serif' },
  { name: 'Roboto', value: 'Roboto, sans-serif', category: 'sans-serif' },
  { name: 'Open Sans', value: 'Open Sans, sans-serif', category: 'sans-serif' },
  { name: 'Lato', value: 'Lato, sans-serif', category: 'sans-serif' },
  { name: 'Poppins', value: 'Poppins, sans-serif', category: 'sans-serif' },
  { name: 'Montserrat', value: 'Montserrat, sans-serif', category: 'sans-serif' },
  { name: 'Source Sans Pro', value: 'Source Sans Pro, sans-serif', category: 'sans-serif' },
  { name: 'Nunito', value: 'Nunito, sans-serif', category: 'sans-serif' },
  { name: 'Work Sans', value: 'Work Sans, sans-serif', category: 'sans-serif' },

  // Serif fonts
  { name: 'Times New Roman', value: 'Times New Roman, serif', category: 'serif' },
  { name: 'Georgia', value: 'Georgia, serif', category: 'serif' },
  { name: 'Merriweather', value: 'Merriweather, serif', category: 'serif' },
  { name: 'Playfair Display', value: 'Playfair Display, serif', category: 'serif' },
  { name: 'Crimson Text', value: 'Crimson Text, serif', category: 'serif' },
  { name: 'Libre Baskerville', value: 'Libre Baskerville, serif', category: 'serif' },

  // Monospace fonts
  { name: 'Fira Code', value: 'Fira Code, monospace', category: 'monospace' },
  { name: 'JetBrains Mono', value: 'JetBrains Mono, monospace', category: 'monospace' },
  { name: 'Source Code Pro', value: 'Source Code Pro, monospace', category: 'monospace' },
  { name: 'Monaco', value: 'Monaco, monospace', category: 'monospace' },
  { name: 'Consolas', value: 'Consolas, monospace', category: 'monospace' },

  // Handwritten and Cursive fonts
  { name: 'Caveat', value: 'Caveat, cursive', category: 'handwritten' },
  { name: 'Dancing Script', value: 'Dancing Script, cursive', category: 'cursive' },
  { name: 'Pacifico', value: 'Pacifico, cursive', category: 'cursive' },
  { name: 'Kalam', value: 'Kalam, cursive', category: 'handwritten' },
  { name: 'Indie Flower', value: 'Indie Flower, cursive', category: 'handwritten' },
  { name: 'Permanent Marker', value: 'Permanent Marker, cursive', category: 'handwritten' },
  { name: 'Shadows Into Light', value: 'Shadows Into Light, cursive', category: 'handwritten' },
  { name: 'Amatic SC', value: 'Amatic SC, cursive', category: 'handwritten' },
  { name: 'Satisfy', value: 'Satisfy, cursive', category: 'cursive' },
  { name: 'Great Vibes', value: 'Great Vibes, cursive', category: 'cursive' },
  { name: 'Cookie', value: 'Cookie, cursive', category: 'cursive' },
  { name: 'Lobster', value: 'Lobster, cursive', category: 'cursive' },

  // Decorative and Display fonts
  { name: 'Oswald', value: 'Oswald, sans-serif', category: 'display' },
  { name: 'Bebas Neue', value: 'Bebas Neue, cursive', category: 'display' },
  { name: 'Raleway', value: 'Raleway, sans-serif', category: 'display' },
  { name: 'Abril Fatface', value: 'Abril Fatface, cursive', category: 'display' },
];

const FONT_SIZES = [
  { name: 'Small', value: '14px' },
  { name: 'Medium (Default)', value: '16px' },
  { name: 'Large', value: '18px' },
  { name: 'Extra Large', value: '20px' },
];

export function SettingsClientPage() {
  const [settings, setSettings] = useState<SettingsState>({
    theme: {
      primaryColor: '#22c55e',
      mode: 'light',
      accentColor: '#16a34a',
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      fontWeight: '400',
    },
    layout: {
      density: 'comfortable',
      sidebarPosition: 'left',
      borderRadius: '8px',
      animations: true,
    },
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      focusRings: true,
    },
    notifications: {
      todoDeadlines: true,
      emailNotifications: false,
      pushNotifications: true,
      deadlineAdvanceHours: 24,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  };

  const applySettings = (settingsToApply: SettingsState) => {
    const root = document.documentElement;

    // Apply theme colors
    root.style.setProperty('--primary-green', settingsToApply.theme.primaryColor);
    root.style.setProperty('--primary-green-dark', settingsToApply.theme.accentColor);

    // Apply typography
    root.style.setProperty('--font-family', settingsToApply.typography.fontFamily);
    root.style.setProperty('--font-size', settingsToApply.typography.fontSize);
    root.style.setProperty('--font-weight', settingsToApply.typography.fontWeight);

    // Apply font styles to body
    document.body.style.fontFamily = settingsToApply.typography.fontFamily;
    document.body.style.fontSize = settingsToApply.typography.fontSize;
    document.body.style.fontWeight = settingsToApply.typography.fontWeight;

    // Apply layout settings
    root.style.setProperty('--border-radius', settingsToApply.layout.borderRadius);

    // Apply density
    const densityMap = {
      compact: { spacing: '0.5rem', padding: '0.75rem' },
      comfortable: { spacing: '1rem', padding: '1rem' },
      spacious: { spacing: '1.5rem', padding: '1.5rem' }
    };
    const density = densityMap[settingsToApply.layout.density];
    root.style.setProperty('--spacing', density.spacing);
    root.style.setProperty('--padding', density.padding);

    // Apply animations
    if (!settingsToApply.layout.animations || settingsToApply.accessibility.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.2s');
      root.style.setProperty('--transition-duration', '0.15s');
    }

    // Apply accessibility settings
    if (settingsToApply.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settingsToApply.accessibility.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    if (!settingsToApply.accessibility.focusRings) {
      root.classList.add('no-focus-rings');
    } else {
      root.classList.remove('no-focus-rings');
    }

    // Apply theme mode
    if (settingsToApply.theme.mode === 'dark') {
      root.classList.add('dark');
    } else if (settingsToApply.theme.mode === 'light') {
      root.classList.remove('dark');
    } else {
      // Auto mode - detect system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      applySettings(settings);
      setLastSaved(new Date());

      // Here you could also save to your backend/database if needed
      // await fetch('/api/user-settings', { method: 'POST', body: JSON.stringify(settings) });

    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: SettingsState = {
      theme: {
        primaryColor: '#22c55e',
        mode: 'light',
        accentColor: '#16a34a',
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        fontWeight: '400',
      },
      layout: {
        density: 'comfortable',
        sidebarPosition: 'left',
        borderRadius: '8px',
        animations: true,
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        focusRings: true,
      },
      notifications: {
        todoDeadlines: true,
        emailNotifications: false,
        pushNotifications: true,
        deadlineAdvanceHours: 24,
      },
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  const updateSettings = (section: keyof SettingsState, key: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const selectColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setSettings(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        primaryColor: preset.value,
        accentColor: preset.accent,
      },
    }));
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Settings</h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Customize your application appearance and behavior
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>

        {lastSaved && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p className="text-sm text-green-700 dark:text-green-300">
              Settings saved successfully at {lastSaved.toLocaleTimeString()}
            </p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Theme Mode</Label>
                <Select
                  value={settings.theme.mode}
                  onValueChange={(value: 'light' | 'dark' | 'auto') =>
                    updateSettings('theme', 'mode', value)
                  }
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Color Scheme</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {COLOR_PRESETS.map((preset) => (
                    <div
                      key={preset.name}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        settings.theme.primaryColor === preset.value
                          ? 'border-[var(--primary-green)] bg-[var(--primary-green)]/5'
                          : 'border-[var(--border)]'
                      }`}
                      onClick={() => selectColorPreset(preset)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.value }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <p className="text-sm font-medium">{preset.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Font Family</Label>
                <div className="space-y-4 mt-3">
                  {['sans-serif', 'serif', 'monospace', 'handwritten', 'cursive', 'display'].map((category) => {
                    const categoryFonts = FONT_FAMILIES.filter(f => f.category === category);
                    if (categoryFonts.length === 0) return null;

                    const categoryNames = {
                      'sans-serif': 'Sans Serif',
                      'serif': 'Serif',
                      'monospace': 'Monospace',
                      'handwritten': 'Handwritten',
                      'cursive': 'Cursive',
                      'display': 'Display'
                    };

                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-[var(--muted-foreground)] mb-2">
                          {categoryNames[category as keyof typeof categoryNames]}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {categoryFonts.map((font) => (
                            <div
                              key={font.value}
                              className={`p-2 border rounded cursor-pointer transition-all hover:bg-[var(--muted)] ${
                                settings.typography.fontFamily === font.value
                                  ? 'border-[var(--primary-green)] bg-[var(--primary-green)]/5'
                                  : 'border-[var(--border)]'
                              }`}
                              onClick={() => updateSettings('typography', 'fontFamily', font.value)}
                              style={{ fontFamily: font.value }}
                            >
                              <p className="text-sm font-medium">{font.name}</p>
                              <p className="text-xs text-[var(--muted-foreground)]" style={{ fontFamily: font.value }}>
                                The quick brown fox
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Font Size</Label>
                <Select
                  value={settings.typography.fontSize}
                  onValueChange={(value) => updateSettings('typography', 'fontSize', value)}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Font Weight</Label>
                <Select
                  value={settings.typography.fontWeight}
                  onValueChange={(value) => updateSettings('typography', 'fontWeight', value)}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="400">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Layout & Interface Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout & Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Density</Label>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-3">
                  Control spacing and padding throughout the interface
                </p>
                <Select
                  value={settings.layout.density}
                  onValueChange={(value: 'compact' | 'comfortable' | 'spacious') =>
                    updateSettings('layout', 'density', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable (Default)</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Border Radius</Label>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-3">
                  Roundness of buttons, cards, and other elements
                </p>
                <Select
                  value={settings.layout.borderRadius}
                  onValueChange={(value) => updateSettings('layout', 'borderRadius', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0px">Sharp (0px)</SelectItem>
                    <SelectItem value="4px">Minimal (4px)</SelectItem>
                    <SelectItem value="8px">Default (8px)</SelectItem>
                    <SelectItem value="12px">Rounded (12px)</SelectItem>
                    <SelectItem value="16px">Very Rounded (16px)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Animations</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Enable smooth transitions and animations
                  </p>
                </div>
                <Switch
                  checked={settings.layout.animations}
                  onCheckedChange={(checked) =>
                    updateSettings('layout', 'animations', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Accessibility className="w-5 h-5" />
                Accessibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">High Contrast</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  checked={settings.accessibility.highContrast}
                  onCheckedChange={(checked) =>
                    updateSettings('accessibility', 'highContrast', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Reduced Motion</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Disable animations and transitions
                  </p>
                </div>
                <Switch
                  checked={settings.accessibility.reducedMotion}
                  onCheckedChange={(checked) =>
                    updateSettings('accessibility', 'reducedMotion', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Focus Rings</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Show focus indicators for keyboard navigation
                  </p>
                </div>
                <Switch
                  checked={settings.accessibility.focusRings}
                  onCheckedChange={(checked) =>
                    updateSettings('accessibility', 'focusRings', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Todo Deadline Notifications</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Get notified when todo deadlines are approaching
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.todoDeadlines}
                  onCheckedChange={(checked) =>
                    updateSettings('notifications', 'todoDeadlines', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) =>
                    updateSettings('notifications', 'emailNotifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Show browser notifications
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={(checked) =>
                    updateSettings('notifications', 'pushNotifications', checked)
                  }
                />
              </div>

              <div>
                <Label className="text-base font-medium">Deadline Advance Notice</Label>
                <p className="text-sm text-[var(--muted-foreground)] mt-1 mb-3">
                  How many hours before a deadline should you be notified?
                </p>
                <Select
                  value={settings.notifications.deadlineAdvanceHours.toString()}
                  onValueChange={(value) =>
                    updateSettings('notifications', 'deadlineAdvanceHours', parseInt(value))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="6">6 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before (1 day)</SelectItem>
                    <SelectItem value="48">48 hours before (2 days)</SelectItem>
                    <SelectItem value="72">72 hours before (3 days)</SelectItem>
                    <SelectItem value="168">1 week before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}