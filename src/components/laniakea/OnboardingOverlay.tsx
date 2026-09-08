"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  X,
  Telescope,
  RotateCw,
  MousePointerClick,
  Volume2,
  Camera,
  ArrowRight,
} from "lucide-react";

const STORAGE_KEY = "laniakea_onboarding_v1";

interface OnboardingOverlayProps {
  onTourStart: () => void;
}

/**
 * First-visit onboarding overlay.
 * Shows a brief tutorial with the key features.
 * Dismissed state is persisted in localStorage so it only shows once.
 */
export function OnboardingOverlay({ onTourStart }: OnboardingOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Check localStorage on mount (client-only, hydration-safe)
  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        // Small delay so the 3D scene renders first
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage might be unavailable
    }
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const handleStartTour = () => {
    handleDismiss();
    onTourStart();
  };

  if (!visible) return null;

  const steps = [
    {
      icon: Telescope,
      title: "Добро пожаловать в Ланиакею",
      description:
        "Интерактивная 3D-карта сверхскопления галактик, в котором находится наш Млечный Путь. ~18 000 галактик с реальными координатами из каталога Cosmicflows-2.",
      color: "text-amber-300",
    },
    {
      icon: RotateCw,
      title: "Управление камерой",
      description:
        "Левая кнопка мыши — вращать сцену. Колесо — зум. Правая кнопка — перемещение. Попробуйте повращать прямо сейчас!",
      color: "text-sky-300",
    },
    {
      icon: MousePointerClick,
      title: "Кликайте по объектам",
      description:
        "Нажмите на Великий аттрактор, Млечный Путь или любую яркую галактику, чтобы увидеть её описание с реальными координатами и характеристиками.",
      color: "text-emerald-300",
    },
    {
      icon: Volume2,
      title: "Аудио-тур голосом Дмитрий",
      description:
        "Включите аудио-тур — 7 точек интереса озвучиваются мужским голосом «Дмитрий». Клавиша Space переключает аудио.",
      color: "text-purple-300",
    },
    {
      icon: Camera,
      title: "Снимки и шеринг",
      description:
        "Кнопка «Снимок» (или клавиша S) сохраняет PNG. «Поделиться» копирует ссылку с текущим ракурсом. Горячие клавиши: ← → R M B L P.",
      color: "text-rose-300",
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0a0d1a] p-6 shadow-2xl">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 text-white/50 hover:text-white"
          onClick={handleDismiss}
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Progress dots */}
        <div className="mb-5 flex justify-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-amber-400"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              onClick={() => setStep(i)}
              aria-label={`Шаг ${i + 1}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Icon className={`h-8 w-8 ${currentStep.color}`} />
          </div>
          <h2 className="mb-2 text-lg font-bold text-white">
            {currentStep.title}
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-white/70">
            {currentStep.description}
          </p>

          {/* Navigation buttons */}
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/50 hover:text-white"
              onClick={handleDismiss}
            >
              Пропустить
            </Button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Назад
                </Button>
              )}
              {isLast ? (
                <Button
                  size="sm"
                  className="bg-amber-500 text-black hover:bg-amber-400"
                  onClick={handleStartTour}
                >
                  Начать тур
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-amber-500 text-black hover:bg-amber-400"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Далее
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Step counter */}
        <div className="mt-4 text-center text-[10px] text-white/30">
          {step + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}
