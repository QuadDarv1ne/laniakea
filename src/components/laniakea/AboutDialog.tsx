"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Ruler, Sparkles, Scale, Calendar, Database, User } from "lucide-react";
import { INFO_INTRO, LANIAKEA_FACTS } from "./data";

const ICONS = {
  ruler: Ruler,
  sparkles: Sparkles,
  scale: Scale,
  calendar: Calendar,
  database: Database,
  user: User,
} as const;

interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border/60 bg-card/95 backdrop-blur-md sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-2">
            <span className="text-xl font-bold">{INFO_INTRO.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {INFO_INTRO.subtitle}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground/85">
            {INFO_INTRO.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {LANIAKEA_FACTS.map((f) => {
            const Icon = ICONS[f.icon] ?? Sparkles;
            return (
              <div
                key={f.label}
                className="rounded-lg border border-border/50 bg-background/40 p-3"
              >
                <Icon className="mb-1.5 h-4 w-4 text-amber-400" />
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {f.label}
                </p>
                <p className="text-sm font-semibold leading-tight">
                  {f.value}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-1 space-y-1 text-xs text-muted-foreground">
          <p>
            Источники: prokosmos.ru, naked-science.ru · Данные: Cosmicflows-2,
            радиотелескоп Грин-Бэнк (2014).
          </p>
          <p>
            Это схематическая визуализация — реальные координаты галактик
            заменены репрезентативными точками для наглядности структуры.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
