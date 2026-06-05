'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { PRESENCE_COLORS } from '@collabdoc/shared';
import { usePresence } from '../hooks/use-presence';

export function PresenceAvatars() {
  const { onlineUsers } = usePresence();
  const maxVisible = 5;
  const visible = onlineUsers.slice(0, maxVisible);
  const overflow = onlineUsers.length - maxVisible;

  return (
    <TooltipProvider>
      <div
        className="animate-in fade-in flex items-center -space-x-2 duration-300"
        data-testid="presence-avatars"
      >
        {visible.map((user, index) => {
          const color = PRESENCE_COLORS[index % PRESENCE_COLORS.length];
          const initials = user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <Tooltip key={user.userId}>
              <TooltipTrigger
                render={
                  <div
                    className="relative cursor-help rounded-full transition-all duration-200 hover:z-10 hover:scale-110"
                    style={{
                      outline: `2px solid ${color}`,
                      outlineOffset: '0px',
                    }}
                  />
                }
              >
                <Avatar className="h-7 w-7 border-2 border-white">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                  <AvatarFallback
                    className="text-[10px] font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <div className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-white bg-green-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{user.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {overflow > 0 && (
          <div className="z-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
            +{overflow}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
