import { BotIcon } from 'lucide-react';

import { Button } from '@shared/components/ui/button';

import type { ChatSuggestion } from './ai-chat-panel.types';

type EmptyChatSuggestionsProps = {
  suggestions: ChatSuggestion[];
  disabled: boolean;
  onSelect: (suggestion: ChatSuggestion) => void;
};

export function EmptyChatSuggestions({
  suggestions,
  disabled,
  onSelect,
}: EmptyChatSuggestionsProps) {
  return (
    <section className="shrink-0 px-4 pb-36" aria-label="Suggested AI actions">
      <div className="space-y-2">
        <div className="space-y-1">
          <BotIcon className="size-10" />
          <h3 className="text-xl font-semibold tracking-tight">How can I help you today?</h3>
        </div>

        <div className="grid gap-1 -mx-2">
          {suggestions.map((suggestion) => {
            const SuggestionIcon = suggestion.icon;

            return (
              <Button
                key={suggestion.id}
                type="button"
                variant="ghost"
                className="h-10 justify-start gap-3 px-2 text-left text-sm font-normal"
                disabled={disabled}
                onClick={() => onSelect(suggestion)}
              >
                <SuggestionIcon
                  aria-hidden="true"
                  data-icon="inline-start"
                  className="size-4 shrink-0 text-foreground"
                />
                <span>{suggestion.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
