import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { SaveStatus } from '../save-status';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';

vi.mock('@/features/collaboration/providers/collaboration-provider', () => ({
  useCollaborationContext: vi.fn(),
}));

describe('SaveStatus', () => {
  it('renders offline state when disconnected', () => {
    vi.mocked(useCollaborationContext).mockReturnValue({
      connectionStatus: 'disconnected',
      saveStatus: 'idle',
    } as ReturnType<typeof useCollaborationContext>);

    render(<SaveStatus />);
    expect(screen.getByText('Offline — saved locally')).toBeInTheDocument();
  });

  it('renders idle state when saved', () => {
    vi.mocked(useCollaborationContext).mockReturnValue({
      connectionStatus: 'connected',
      saveStatus: 'idle',
    } as ReturnType<typeof useCollaborationContext>);

    render(<SaveStatus />);
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  it('renders saving state', () => {
    vi.mocked(useCollaborationContext).mockReturnValue({
      connectionStatus: 'connected',
      saveStatus: 'saving',
    } as ReturnType<typeof useCollaborationContext>);

    render(<SaveStatus />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useCollaborationContext).mockReturnValue({
      connectionStatus: 'connected',
      saveStatus: 'error',
    } as ReturnType<typeof useCollaborationContext>);

    render(<SaveStatus />);
    expect(screen.getByText('Save failed')).toBeInTheDocument();
  });
});
