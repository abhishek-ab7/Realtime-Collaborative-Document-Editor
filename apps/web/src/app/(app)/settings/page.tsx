'use client';

import { useTypedSession } from '@/features/auth/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Settings as SettingsIcon,
  User,
  Mail,
  ShieldAlert,
  Monitor,
  Keyboard,
  Sliders,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useTypedSession();

  // Appearance States
  const [fontSize, setFontSize] = useState('16px');
  const [lineSpacing, setLineSpacing] = useState('1.75');

  // Editor States
  const [spellCheck, setSpellCheck] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [presenceCursors, setPresenceCursors] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('collabdoc-theme');
    document.documentElement.classList.remove('dark');
    Promise.resolve().then(() => {
      setFontSize(localStorage.getItem('collabdoc-font-size') || '16px');
      setLineSpacing(localStorage.getItem('collabdoc-line-spacing') || '1.75');
      setSpellCheck(localStorage.getItem('collabdoc-spell-check') !== 'false');
      setAutoSave(localStorage.getItem('collabdoc-auto-save') !== 'false');
      setPresenceCursors(localStorage.getItem('collabdoc-presence-cursors') !== 'false');
    });
  }, []);

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    localStorage.setItem('collabdoc-font-size', size);
    toast.success(`Font size set to ${size}`);
  };

  const handleLineSpacingChange = (spacing: string) => {
    setLineSpacing(spacing);
    localStorage.setItem('collabdoc-line-spacing', spacing);
    toast.success(`Line spacing updated`);
  };

  const handleToggle = (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    toast.success('Editor preference updated');
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#131b2e]">
          <SettingsIcon className="h-6 w-6 text-indigo-600" />
          Settings
        </h1>
        <p className="text-sm text-slate-500">
          Manage your profile, theme appearance, and custom editor options.
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#131b2e]">Profile Details</CardTitle>
          <CardDescription>
            Your personal profile details synchronized from Google OAuth.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              src={user.image}
              name={user.name}
              size={64}
              color="var(--color-brand-primary)"
            />
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">{user.name}</h3>
              <p className="text-xs font-semibold text-slate-400">Collaborator</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex-grow">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Full Name
                </p>
                <p className="font-semibold text-slate-700">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex-grow">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Email Address
                </p>
                <p className="font-semibold text-slate-700">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <ShieldAlert className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex-grow">
                <p className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                  Account Status
                </p>
                <p className="font-bold text-emerald-600">Synced & Verified via OAuth</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#131b2e]">
            <Monitor className="h-5 w-5 text-indigo-500" />
            Appearance
          </CardTitle>
          <CardDescription>Customize how the editor and interface look.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-700">Editor Font Size</label>
              <p className="text-xs text-slate-400">
                Set the default text size for the editor canvas
              </p>
            </div>
            <select
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
              className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#4f46e5] focus:outline-none sm:w-44"
            >
              <option value="14px">Small (14px)</option>
              <option value="16px">Medium (16px)</option>
              <option value="18px">Large (18px)</option>
              <option value="20px">Extra Large (20px)</option>
            </select>
          </div>

          {/* Line Spacing */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label className="text-sm font-semibold text-slate-700">Line Spacing</label>
              <p className="text-xs text-slate-400">Adjust spacing density of paragraphs</p>
            </div>
            <select
              value={lineSpacing}
              onChange={(e) => handleLineSpacingChange(e.target.value)}
              className="w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-[#4f46e5] focus:outline-none sm:w-44"
            >
              <option value="1.4">Compact (1.4)</option>
              <option value="1.75">Normal (1.75)</option>
              <option value="2.2">Relaxed (2.2)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Editor Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#131b2e]">
            <Sliders className="h-5 w-5 text-indigo-500" />
            Editor Options
          </CardTitle>
          <CardDescription>Configure writing behavior and features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Spell check */}
          <div className="flex items-center justify-between py-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Enable Spell Check</span>
              <span className="text-xs text-slate-400">Flag typos and grammatical errors</span>
            </div>
            <button
              onClick={() => handleToggle('collabdoc-spell-check', !spellCheck, setSpellCheck)}
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                spellCheck ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  spellCheck ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Auto-save */}
          <div className="flex items-center justify-between border-t border-slate-100 py-2 pt-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Show Auto-Save Status</span>
              <span className="text-xs text-slate-400">
                Display connectivity and save labels in header
              </span>
            </div>
            <button
              onClick={() => handleToggle('collabdoc-auto-save', !autoSave, setAutoSave)}
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                autoSave ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Presence Cursors */}
          <div className="flex items-center justify-between border-t border-slate-100 py-2 pt-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">Display Presence Cursors</span>
              <span className="text-xs text-slate-400">
                Show active markers and labels of other users
              </span>
            </div>
            <button
              onClick={() =>
                handleToggle('collabdoc-presence-cursors', !presenceCursors, setPresenceCursors)
              }
              className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors ${
                presenceCursors ? 'bg-indigo-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  presenceCursors ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold text-[#131b2e]">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>Control the editor efficiently using format keys.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-500">
              <thead className="bg-slate-50 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">macOS</th>
                  <th className="px-4 py-3">Windows / Linux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Toggle Bold</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      ⌘ + B
                    </kbd>
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      Ctrl + B
                    </kbd>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Toggle Italic</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      ⌘ + I
                    </kbd>
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      Ctrl + I
                    </kbd>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Toggle Underline</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      ⌘ + U
                    </kbd>
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      Ctrl + U
                    </kbd>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Command Palette</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      ⌘ + K
                    </kbd>
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      Ctrl + K
                    </kbd>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Slash Command Menu</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      /
                    </kbd>{' '}
                    (at block start)
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      /
                    </kbd>{' '}
                    (at block start)
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Undo Action</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      ⌘ + Z
                    </kbd>
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      Ctrl + Z
                    </kbd>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-700">Redo Action</td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      ⌘ + ⇧ + Z
                    </kbd>
                  </td>
                  <td className="px-4 py-3">
                    <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5">
                      Ctrl + Y
                    </kbd>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
