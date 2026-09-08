"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Globe2,
  Atom,
  Orbit,
  X,
  Info,
  Eye,
  Tag,
  MapPin,
  Sparkle,
  Sun,
  Database,
  Move,
} from "lucide-react";
import {
  REGIONS,
  GREAT_ATTRACTOR,
  NEIGHBOR,
  MILKY_WAY,
  type RegionKey,
} from "./data";
import type { SelectionState } from "./LaniakeaScene";
import { GALAXY_TYPE_COLORS } from "./realGalaxies";

interface InfoPanelProps {
  selection: SelectionState;
  onClose: () => void;
}

export function InfoPanel({ selection, onClose }: InfoPanelProps) {
  if (selection.type === "none") return null;

  let title = "";
  let subtitle = "";
  let description = "";
  let color = "#ffffff";
  let members: string[] = [];
  let distance = "";

  if (selection.type === "region" && selection.key) {
    const r = REGIONS.find((x) => x.key === selection.key);
    if (r) {
      title = r.name;
      subtitle = r.englishName;
      description = r.description;
      color = r.color;
      members = r.members;
      distance = r.distance;
    }
  } else if (selection.type === "greatAttractor") {
    title = GREAT_ATTRACTOR.name;
    subtitle = "Гравитационный центр Ланиакеи";
    description = GREAT_ATTRACTOR.description;
    color = "#ffb347";
    distance = GREAT_ATTRACTOR.distance;
    members = [
      "Скопление Norma (Abell 3627)",
      "Расположен в Сверхскоплении Гидры-Центавра",
      "Скорость притяжения ~600 км/с",
    ];
  } else if (selection.type === "milkyWay") {
    title = MILKY_WAY.name;
    subtitle = "Наша Галактика — мы здесь";
    description = MILKY_WAY.description;
    color = "#a8d8ff";
    distance = MILKY_WAY.distance;
    members = [
      "Спиральная галактика с перемычкой",
      "~100–400 млрд звёзд",
      "Диаметр ~100 000 св. лет",
      "Спутники: Магеллановы Облака",
    ];
  } else if (selection.type === "neighbor") {
    title = NEIGHBOR.name;
    subtitle = NEIGHBOR.englishName;
    description = NEIGHBOR.description;
    color = NEIGHBOR.color;
    distance = NEIGHBOR.distance;
    members = [
      "Цепь Персея-Пегаса",
      "Не входит в состав Ланиакеи",
      "Ближайший крупный сосед",
    ];
  } else if (selection.type === "galaxy" && selection.galaxy) {
    const g = selection.galaxy;
    title = g.name;
    const typeNames: Record<string, string> = {
      spiral: "Спиральная галактика",
      elliptical: "Эллиптическая галактика",
      lenticular: "Линзовидная галактика",
      irregular: "Неправильная галактика",
      cluster_core: "Ядро скопления галактик",
      group: "Группа галактик",
    };
    subtitle = typeNames[g.type] || "Галактика";
    description = `Реальные координаты из каталога Cosmicflows-2 (Tully et al., 2014). Сверхгалактические координаты: долгота ${g.sgl.toFixed(1)}°, широта ${g.sgb.toFixed(1)}°.`;
    color = GALAXY_TYPE_COLORS[g.type];
    distance = `${(g.distance * 3.262).toFixed(1)} млн св. лет (${g.distance.toFixed(1)} Мпк)`;
    members = [
      g.velocity !== undefined
        ? `Лучевая скорость: ${Math.round(g.velocity)} км/с`
        : "Скорость не определена",
      g.magnitude !== undefined
        ? `Абсолютная звёздная величина: ${g.magnitude.toFixed(1)}`
        : "Яркость не задана",
      `Тип: ${typeNames[g.type]}`,
    ];
  }

  return (
    <Card className="w-full border-border/60 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 12px ${color}`,
              }}
            />
            <CardTitle className="text-base font-semibold leading-tight">
              {title}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground/90">
          {description}
        </p>
        {distance && (
          <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background/40 px-2 py-1.5">
            <MapPin className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Расстояние:
            </span>
            <span className="text-xs font-medium text-foreground/90">
              {distance}
            </span>
          </div>
        )}
        {members.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Tag className="h-3 w-3" />
              Состав
            </p>
            <div className="flex flex-wrap gap-1.5">
              {members.map((m) => (
                <Badge
                  key={m}
                  variant="secondary"
                  className="text-xs font-normal"
                >
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ControlPanelProps {
  visibleRegions: Record<RegionKey, boolean>;
  showNeighbor: boolean;
  showFlows: boolean;
  showLaniakeaBoundary: boolean;
  showLabels: boolean;
  useRealGalaxies: boolean;
  enableBloom: boolean;
  enableParallax: boolean;
  onToggleRegion: (key: RegionKey, value: boolean) => void;
  onToggleNeighbor: (value: boolean) => void;
  onToggleFlows: (value: boolean) => void;
  onToggleBoundary: (value: boolean) => void;
  onToggleLabels: (value: boolean) => void;
  onToggleRealGalaxies: (value: boolean) => void;
  onToggleBloom: (value: boolean) => void;
  onToggleParallax: (value: boolean) => void;
}

export function ControlPanel({
  visibleRegions,
  showNeighbor,
  showFlows,
  showLaniakeaBoundary,
  showLabels,
  useRealGalaxies,
  enableBloom,
  enableParallax,
  onToggleRegion,
  onToggleNeighbor,
  onToggleFlows,
  onToggleBoundary,
  onToggleLabels,
  onToggleRealGalaxies,
  onToggleBloom,
  onToggleParallax,
}: ControlPanelProps) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="h-4 w-4" />
          Слои карты
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2.5">
          {/* Real data toggle */}
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/5 p-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                <Label
                  htmlFor="toggle-real"
                  className="cursor-pointer text-xs font-medium"
                >
                  Реальные данные галактик
                </Label>
              </div>
              <Switch
                id="toggle-real"
                checked={useRealGalaxies}
                onCheckedChange={onToggleRealGalaxies}
              />
            </div>
            {useRealGalaxies && (
              <p className="mt-1 text-[10px] leading-tight text-emerald-300/70">
                Cosmicflows-2, Tully et al. 2014 · ~8000 галактик с реальными
                сверхгалактическими координатами
              </p>
            )}
          </div>

          {/* Bloom toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-amber-300" />
              <Label htmlFor="toggle-bloom" className="cursor-pointer text-xs">
                Эффект свечения (Bloom)
              </Label>
            </div>
            <Switch
              id="toggle-bloom"
              checked={enableBloom}
              onCheckedChange={onToggleBloom}
            />
          </div>

          {/* Parallax toggle */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Move className="h-3.5 w-3.5 text-sky-300" />
              <Label
                htmlFor="toggle-parallax"
                className="cursor-pointer text-xs"
              >
                Параллакс мышью
              </Label>
            </div>
            <Switch
              id="toggle-parallax"
              checked={enableParallax}
              onCheckedChange={onToggleParallax}
            />
          </div>

          <div className="my-1 border-t border-border/40" />

          {!useRealGalaxies &&
            REGIONS.map((r) => (
              <div
                key={r.key}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: r.color,
                      boxShadow: `0 0 8px ${r.color}`,
                    }}
                  />
                  <Label
                    htmlFor={`toggle-${r.key}`}
                    className="cursor-pointer truncate text-xs"
                  >
                    {r.name}
                  </Label>
                </div>
                <Switch
                  id={`toggle-${r.key}`}
                  checked={visibleRegions[r.key]}
                  onCheckedChange={(v) => onToggleRegion(r.key, v)}
                />
              </div>
            ))}

          <div className="my-1 border-t border-border/40" />

          {!useRealGalaxies && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Atom className="h-3.5 w-3.5" style={{ color: "#9d4edd" }} />
                <Label
                  htmlFor="toggle-neighbor"
                  className="cursor-pointer text-xs"
                >
                  Сосед: Персей-Рыбы
                </Label>
              </div>
              <Switch
                id="toggle-neighbor"
                checked={showNeighbor}
                onCheckedChange={onToggleNeighbor}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Orbit className="h-3.5 w-3.5 text-amber-400" />
              <Label htmlFor="toggle-flows" className="cursor-pointer text-xs">
                Потоки к аттрактору
              </Label>
            </div>
            <Switch
              id="toggle-flows"
              checked={showFlows}
              onCheckedChange={onToggleFlows}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
              <Label
                htmlFor="toggle-boundary"
                className="cursor-pointer text-xs"
              >
                Граница Ланиакеи
              </Label>
            </div>
            <Switch
              id="toggle-boundary"
              checked={showLaniakeaBoundary}
              onCheckedChange={onToggleBoundary}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-emerald-400" />
              <Label htmlFor="toggle-labels" className="cursor-pointer text-xs">
                Подписи в 3D
              </Label>
            </div>
            <Switch
              id="toggle-labels"
              checked={showLabels}
              onCheckedChange={onToggleLabels}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface LegendCardProps {
  onShowInfo: () => void;
  useRealGalaxies?: boolean;
}

export function LegendCard({ onShowInfo, useRealGalaxies }: LegendCardProps) {
  return (
    <Card className="border-border/60 bg-card/80 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-amber-400" />
          Легенда
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {useRealGalaxies ? (
          // Real mode legend - galaxy types by color
          <>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              Типы галактик
            </p>
            <LegendItem color="#9ec5ff" label="Спиральные (молодые, голубые)" />
            <LegendItem color="#ffd47a" label="Эллиптические (старые, жёлтые)" />
            <LegendItem color="#ffe9b8" label="Линзовидные (S0)" />
            <LegendItem color="#80c8ff" label="Неправильные" />
            <LegendItem color="#ff8855" label="Ядра скоплений" />
            <LegendItem color="#c8d8ff" label="Группы галактик" />
          </>
        ) : (
          // Schematic mode legend - regions
          <>
            {REGIONS.map((r) => (
              <div key={r.key} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: r.color,
                    boxShadow: `0 0 8px ${r.color}`,
                  }}
                />
                <span className="text-foreground/80">{r.name}</span>
              </div>
            ))}
          </>
        )}
        <div className="my-1 border-t border-border/40" />
        <div className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full bg-amber-300"
            style={{ boxShadow: "0 0 8px #ffb347" }}
          />
          <span className="text-foreground/80">Великий аттрактор</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: "#a8d8ff",
              boxShadow: "0 0 10px #a8d8ff",
            }}
          />
          <span className="font-medium text-foreground/90">
            Млечный Путь — мы здесь
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 h-8 w-full text-xs"
          onClick={onShowInfo}
        >
          <Info className="mr-1.5 h-3.5 w-3.5" />
          О сверхскоплении
        </Button>
      </CardContent>
    </Card>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}
