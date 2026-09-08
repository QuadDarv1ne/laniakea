"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  NEIGHBOR_SUPERCLUSTERS,
  type NeighborSupercluster,
} from "./neighborSuperclusters";
import { Orbit, Scale, Ruler, Star, Weight } from "lucide-react";

interface ComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatMpc = (mpc: number) => {
  if (mpc === 0) return "внутри";
  return `${mpc} Мпк`;
};

const formatMly = (mpc: number) => {
  if (mpc === 0) return "—";
  return `(${(mpc * 3.262).toFixed(0)} млн св. лет)`;
};

export function ComparisonDialog({ open, onOpenChange }: ComparisonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border/60 bg-card/95 backdrop-blur-md sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Orbit className="h-5 w-5 text-amber-300" />
            Сравнение сверхскоплений
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Ланиакея в контексте соседних сверхскоплений галактик. Размеры,
            массы и расстояния — приблизительные, из опубликованных данных.
          </DialogDescription>
        </DialogHeader>

        {/* Comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 text-left text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Сверхскопление</th>
                <th className="pb-2 pr-3 font-medium">Расстояние</th>
                <th className="pb-2 pr-3 font-medium">Диаметр</th>
                <th className="pb-2 pr-3 font-medium">Галактик</th>
                <th className="pb-2 pr-3 font-medium">Масса (log M☉)</th>
              </tr>
            </thead>
            <tbody>
              {NEIGHBOR_SUPERCLUSTERS.map((sc) => (
                <tr
                  key={sc.key}
                  className="border-b border-border/20 hover:bg-white/5"
                >
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: sc.color,
                          boxShadow: `0 0 8px ${sc.color}`,
                        }}
                      />
                      <div>
                        <div className="font-semibold text-foreground">
                          {sc.name}
                          {sc.key === "laniakea" && (
                            <span className="ml-1.5 text-[10px] text-amber-300">
                              (мы здесь)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {sc.englishName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-foreground">
                      {formatMpc(sc.distanceMpc)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatMly(sc.distanceMpc)}
                    </div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="font-medium text-foreground">
                      {sc.diameterMpc} Мпк
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      ({(sc.diameterMpc * 3.262).toFixed(0)} млн св. лет)
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-foreground/80">
                    {sc.galaxyCount}
                  </td>
                  <td className="py-2 pr-3 font-mono text-foreground/80">
                    10<sup>{sc.massLog10}</sup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detailed cards */}
        <div className="mt-4 space-y-3">
          {NEIGHBOR_SUPERCLUSTERS.map((sc) => (
            <SuperclusterCard key={sc.key} sc={sc} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-center">
          <p className="text-[11px] leading-relaxed text-amber-100/70">
            🌌 Ланиакея — лишь одно из десятков известных сверхскоплений в
            местной Вселенной. Каждый из этих гигантских структур содержит
            тысячи галактик, связанных гравитацией в космическую паутину.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuperclusterCard({ sc }: { sc: NeighborSupercluster }) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: `${sc.color}40`,
        backgroundColor: `${sc.color}08`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{
              backgroundColor: sc.color,
              boxShadow: `0 0 10px ${sc.color}`,
            }}
          />
          <h3 className="text-sm font-bold text-foreground">{sc.name}</h3>
        </div>
        {sc.key === "laniakea" && (
          <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-medium text-amber-200">
            Наше сверхскопление
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {sc.description}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Ruler className="h-3 w-3 text-muted-foreground" />
          <span>{sc.diameterMpc} Мпк</span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Scale className="h-3 w-3 text-muted-foreground" />
          <span>
            10
            <sup>{sc.massLog10}</sup> M☉
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Star className="h-3 w-3 text-muted-foreground" />
          <span>{sc.galaxyCount} гал.</span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground/70">
          <Weight className="h-3 w-3 text-muted-foreground" />
          <span>
            {sc.distanceMpc === 0
              ? "внутри"
              : `${(sc.distanceMpc * 3.262).toFixed(0)} млн св.л.`}
          </span>
        </div>
      </div>
      {sc.features.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Особенности
          </p>
          <ul className="space-y-0.5">
            {sc.features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-[11px] text-foreground/70"
              >
                <span
                  className="mt-0.5 inline-block h-1 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: sc.color }}
                />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
