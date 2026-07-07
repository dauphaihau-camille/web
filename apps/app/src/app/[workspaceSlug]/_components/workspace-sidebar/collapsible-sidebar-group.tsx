"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronRightIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { cn } from "@shared/lib/utils";

export function CollapsibleSidebarGroup({
  label,
  children,
  actions,
  defaultExpanded = true,
}: {
  label: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultExpanded?: boolean;
}) {
  const contentId = useId();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <SidebarGroup className="space-y-0.5 py-0.5">
      <div className="group/sidebar-group-header flex items-center gap-2 rounded-md pl-2 pr-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
        <SidebarGroupLabel
          render={<button type="button" />}
          className={cn(
            "h-7 flex-1 cursor-pointer justify-start gap-1 px-0 font-semibold text-inherit hover:bg-transparent hover:text-inherit active:bg-transparent active:text-inherit",
            "focus-visible:ring-2",
          )}
          aria-controls={contentId}
          aria-expanded={isExpanded}
          onClick={() => {
            setIsExpanded((current) => !current);
          }}
        >
          <span>{label}</span>
          <ChevronRightIcon
            className={cn(
              "!size-3 opacity-0 transition-all group-hover/sidebar-group-header:opacity-100",
              isExpanded ? "rotate-90" : "",
            )}
          />
        </SidebarGroupLabel>
        {actions ? (
          <div className="pointer-events-none flex items-center gap-1 opacity-0 transition-opacity group-hover/sidebar-group-header:pointer-events-auto group-hover/sidebar-group-header:opacity-100">
            {actions}
          </div>
        ) : null}
      </div>
      <SidebarGroupContent id={contentId} hidden={!isExpanded}>
        {children}
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
