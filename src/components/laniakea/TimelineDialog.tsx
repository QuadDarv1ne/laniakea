"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIMELINE_EVENTS, type TimelineEvent } from "./timelineData";
import {
  Telescope,
  Microscope,
  Lightbulb,
  MapIcon,
  Tag,
  ChevronRight,
  Navigation,
  Plane,
} from "lucide-react";

interface TimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user clicks a fly-to-enabled event. Closes the dialog. */
  onFlyTo?: (target: NonNullable<TimelineEvent["flyTo"]>) => void;
}

const CATEGORY_META: Record<
  TimelineEvent["category"],
  { label: string; color: string; Icon: typeof Telescope }
> = {
  discovery: {
    label: "Открытие",
    color: "text-amber-300 border-amber-400/30 bg-amber-400/10",
    Icon: Telescope,
  },
  measurement: {
    label: "Измерение",
    color: "text-sky-300 border-sky-400/30 bg-sky-400/10",
    Icon: Microscope,
  },
  theory: {
    label: "Теория",
    color: "text-purple-300 border-purple-400/30 bg-purple-400/10",
    Icon: Lightbulb,
  },
  mapping: {
    label: "Картирование",
    color: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
    Icon: MapIcon,
  },
  naming: {
    label: "Название",
    color: "text-rose-300 border-rose-400/30 bg-rose-400/10",
    Icon: Tag,
  },
};

// Map flyTo keys to human-readable labels for the button
const FLY_TO_LABELS: Record<string, string> = {
  overview: "Обзор Ланиакеи",
  milkyway: "Млечный Путь",
  greatAttractor: "Великий аттрактор",
  hydraCentaurus: "Гидра-Центавр",
  pavoIndus: "Павлин-Индеец",
  southern: "Южное сверхскопление",
  local: "Местное сверхскопление",
};

export function TimelineDialog({
  open,
  onOpenChange,
  onFlyTo,
}: TimelineDialogProps) {
  const handleEventClick = (event: TimelineEvent) => {
    if (event.flyTo) {
      onFlyTo?.(event.flyTo);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border/60 bg-card/95 backdrop-blur-md sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Таймлайн открытий
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            От закона Хаббла (1929) до открытия Ланиакеи (2014) — 85 лет
            исследований. Нажмите на событие с иконкой{" "}
            <Plane className="inline h-3 w-3" /> чтобы пролететь к
            соответствующей точке на 3D-карте.
          </DialogDescription>
        </DialogHeader>

        {/* Horizontal scrollable timeline strip — clickable */}
        <div className="mb-4 -mx-2 overflow-x-auto px-2 pb-2">
          <div className="flex min-w-max items-end gap-1">
            {TIMELINE_EVENTS.map((event, i) => {
              const meta = CATEGORY_META[event.category];
              const Icon = meta.Icon;
              const clickable = !!event.flyTo;
              return (
                <button
                  key={i}
                  className={`flex flex-col items-center gap-1 rounded-md p-1 transition-colors ${
                    clickable
                      ? "cursor-pointer hover:bg-white/10"
                      : "cursor-default"
                  }`}
                  onClick={() => handleEventClick(event)}
                  title={
                    clickable
                      ? `${event.year}: ${event.title} → Пролететь к «${FLY_TO_LABELS[event.flyTo!]}»`
                      : `${event.year}: ${event.title}`
                  }
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${meta.color} ${
                      clickable ? "ring-1 ring-white/20" : ""
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`text-[9px] ${
                      clickable ? "text-white/70" : "text-white/40"
                    }`}
                  >
                    {event.year}
                  </span>
                  {clickable && (
                    <Plane className="h-2.5 w-2.5 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed vertical timeline */}
        <div className="relative space-y-4 pl-4">
          {/* Vertical line */}
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-amber-400/40 via-sky-400/40 to-rose-400/40" />

          {TIMELINE_EVENTS.map((event, i) => {
            const meta = CATEGORY_META[event.category];
            const Icon = meta.Icon;
            const clickable = !!event.flyTo;
            return (
              <div key={i} className="relative">
                {/* Dot on the timeline */}
                <div
                  className={`absolute -left-[13px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background ${meta.color.split(" ")[0]}`}
                  style={{ backgroundColor: "currentColor" }}
                >
                  <div
                    className={`h-2 w-2 rounded-full ${meta.color.split(" ")[0]}`}
                  />
                </div>

                {/* Event content */}
                <div
                  className={`rounded-lg border p-3 transition-colors ${
                    clickable
                      ? "cursor-pointer border-emerald-400/30 bg-emerald-400/5 hover:bg-emerald-400/10"
                      : "border-border/40 bg-background/30"
                  }`}
                  onClick={() => clickable && handleEventClick(event)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold text-amber-200">
                      {event.year}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {clickable && (
                        <Badge
                          variant="outline"
                          className="border-emerald-400/40 text-[9px] text-emerald-300"
                        >
                          <Navigation className="mr-0.5 h-2.5 w-2.5" />
                          Полёт
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={`border-current text-[10px] ${meta.color}`}
                      >
                        <Icon className="mr-1 h-3 w-3" />
                        {meta.label}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold leading-tight text-foreground">
                    {event.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                  {event.person && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground/70">
                      <ChevronRight className="h-3 w-3" />
                      <span className="font-medium">{event.person}</span>
                      {event.source && (
                        <span className="text-muted-foreground">
                          · {event.source}
                        </span>
                      )}
                    </div>
                  )}
                  {clickable && event.flyTo && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 border-emerald-400/40 bg-emerald-400/10 px-2 text-[10px] text-emerald-200 hover:bg-emerald-400/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                      >
                        <Plane className="mr-1 h-2.5 w-2.5" />
                        Пролететь к «{FLY_TO_LABELS[event.flyTo]}»
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-center">
          <p className="text-[11px] leading-relaxed text-amber-100/70">
            🌌 От первых доказательств существования других галактик (1924) до
            осознания, что мы живём в сверхскоплении Ланиакея (2014), прошло 90
            лет. Каждый шаг расширял наше представление о масштабах Вселенной.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
