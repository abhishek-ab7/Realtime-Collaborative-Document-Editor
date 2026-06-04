'use client';

import { useTypedSession } from '@/features/auth/hooks/use-session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings, User, Mail, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useTypedSession();

  if (!user) return null;

  const initials =
    user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#131b2e]">
          <Settings className="h-6 w-6 text-slate-400" />
          Settings
        </h1>
        <p className="text-sm text-slate-500">Manage your account profile and configurations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Your personal profile info synced from Google OAuth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
              <AvatarFallback className="bg-[var(--color-brand-primary)] text-lg text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-slate-400">Collaborator</p>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-slate-400" />
              <div className="flex-grow">
                <p className="text-xs font-medium text-slate-400 uppercase">Full Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-400" />
              <div className="flex-grow">
                <p className="text-xs font-medium text-slate-400 uppercase">Email Address</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <ShieldAlert className="h-4 w-4 text-slate-400" />
              <div className="flex-grow">
                <p className="text-xs font-medium text-slate-400 uppercase">Account Security</p>
                <p className="font-medium text-emerald-500">Synced & Verified via Google</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
