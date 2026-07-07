import { useKeyPress } from "ahooks";
import { Globe2Icon, LinkIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { OPEN_SHARE_EVENT } from "@/app/[workspaceSlug]/_components/workspace-shortcuts-provider";
import {
  Button,
  buttonVariants,
} from "@shared/components/ui/button";
import { Kbd } from "@shared/components/ui/kbd";
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from "@shared/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/components/ui/popover";
import { Separator } from "@shared/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@shared/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/components/ui/tooltip";
import { cn } from "@shared/lib/utils";

type ShareButtonProps = {
  isPublished: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  publishedPath?: string;
  onCopyPublishedLink: () => void | Promise<void>;
  onPublish: () => void;
  onUnpublish: () => void;
};

const SHARE_SHORTCUT = "\u21e7\u2318S";
const COPY_PUBLISHED_LINK_SHORTCUT = "\u21e7\u2318C";

export function ShareButton({
  isPublished,
  isPublishing,
  isUnpublishing,
  publishedPath,
  onCopyPublishedLink,
  onPublish,
  onUnpublish,
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const publicUrl =
    typeof window !== "undefined" && publishedPath
      ? `${window.location.origin}${publishedPath}`
      : "";

  useEffect(() => {
    const handleOpenShare = () => {
      setIsOpen((open) => !open);
    };

    window.addEventListener(OPEN_SHARE_EVENT, handleOpenShare);

    return () => {
      window.removeEventListener(OPEN_SHARE_EVENT, handleOpenShare);
    };
  }, []);

  useKeyPress(
    "meta.shift.c",
    (event) => {
      if (!isPublished) {
        return;
      }

      event.preventDefault();
      void onCopyPublishedLink();
    },
    {
      exactMatch: true,
    },
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className={cn(
                buttonVariants({ variant: "ghost", size: "default" }),
                "px-2 text-sm text-muted-foreground",
              )}
            >
              Share
            </PopoverTrigger>
          }
        />
        <TooltipContent>
          <span>Share and publish</span>
          <Kbd>{SHARE_SHORTCUT}</Kbd>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-104 gap-0 overflow-hidden p-0"
      >
        <Tabs defaultValue="publish" className="gap-0">
          <TabsList
            variant="line"
            className="h-auto w-full rounded-none border-b justify-start px-3"
          >
            <TabsTrigger value="publish" className="flex-none px-3 py-1">
              Publish
            </TabsTrigger>
            <Tooltip>
              <TooltipTrigger
                render={
                  <span className="inline-flex">
                    <TabsTrigger
                      value="share"
                      className="flex-none px-3 py-1"
                      disabled
                    >
                      Share
                    </TabsTrigger>
                  </span>
                }
              />
              <TooltipContent>Feature not available</TooltipContent>
            </Tooltip>
          </TabsList>
          <TabsContent value="publish" className="p-4 outline-none">
            {isPublished ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-sky-500/70" />
                      <span className="relative inline-flex size-2 rounded-full bg-sky-600" />
                    </span>
                    <span>Live on the web</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Anyone with the link can view this published page.
                  </p>
                </div>
                <InputGroup>
                  <InputGroupInput value={publicUrl} disabled />
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <InputGroupButton
                          size="icon-sm"
                          onClick={() => {
                            void onCopyPublishedLink();
                          }}
                        >
                          <LinkIcon className="size-4" />
                          <span className="sr-only">Copy link</span>
                        </InputGroupButton>
                      }
                    />
                    <TooltipContent>
                      <div className="flex flex-col gap-1">
                        <span>Copy published link</span>
                        <Kbd>{COPY_PUBLISHED_LINK_SHORTCUT}</Kbd>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </InputGroup>
                <Separator />
                <div className="flex items-center gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1"
                    disabled={isUnpublishing}
                    onClick={onUnpublish}
                  >
                    {isUnpublishing ? "Unpublishing..." : "Unpublish"}
                  </Button>
                  <Button
                    size="lg"
                    variant="publish"
                    className="flex-1"
                    disabled={!publicUrl}
                    onClick={() => {
                      if (!publicUrl) {
                        return;
                      }

                      window.open(publicUrl, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <Globe2Icon className="size-4" />
                    <span>View site</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <div className="space-y-2">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Globe2Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      Publish to web
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Publish a static website of this page.
                    </p>
                  </div>
                </div>
                <Button
                  variant="publish"
                  className="w-full"
                  disabled={isPublishing}
                  onClick={onPublish}
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
