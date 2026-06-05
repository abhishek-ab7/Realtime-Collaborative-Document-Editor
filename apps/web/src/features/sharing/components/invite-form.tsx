'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserPlus } from 'lucide-react';

interface InviteFormProps {
  onInvite: (email: string, role: 'EDITOR' | 'VIEWER') => Promise<boolean>;
  disabled?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteForm({ onInvite, disabled }: InviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'EDITOR' | 'VIEWER'>('EDITOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onInvite(trimmedEmail, role);
      if (success) {
        setEmail('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2" data-testid="invite-form">
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="Add people by email..."
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          disabled={disabled || isSubmitting}
          className="flex-1 text-sm"
          data-testid="invite-email-input"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as 'EDITOR' | 'VIEWER')}
          disabled={disabled || isSubmitting}
          className="h-9 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs text-[#334155] outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20"
          data-testid="invite-role-select"
        >
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </select>
        <Button
          type="submit"
          size="sm"
          disabled={disabled || isSubmitting || !email.trim()}
          className="gap-1.5 bg-[#4f46e5] text-white hover:bg-[#4338ca]"
          data-testid="invite-button"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Invite
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500" data-testid="invite-error">
          {error}
        </p>
      )}
    </form>
  );
}
