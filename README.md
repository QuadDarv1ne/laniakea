<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Three.js-0.185-black?style=for-the-badge&logo=three.js" alt="Three.js">
</p>

<h1 align="center">🌌 Ланиакея</h1>

<p align="center">
  <strong>Интерактивная 3D-карта сверхскопления галактик</strong><br>
  Interactive 3D map of the Laniakea supercluster of galaxies
</p>

<p align="center">
  <a href="#русский">Русский</a> · <a href="#english">English</a>
</p>

---

<a id="русский"></a>

## О проекте

**Ланиакея** — одностраничное приложение на **Next.js 16 + React 19 + TypeScript +
Three.js**, визуализирующее сверхскопление галактик Ланиакея в 3D. Модель построена
по мотивам каталога собственных движений галактик **Cosmicflows** (Tully et al. 2014)
и показывает четыре региона сверхскопления, Великий аттрактор, положение Млечного Пути
и потоки галактик к гравитационному центру.

Сцена работает целиком в браузере: данные отдаются статически, внешние сервисы не
требуются. Эмбиент синтезируется процедурно через Web Audio API, без аудиофайлов.

> 📖 [Полная документация на русском →](README_RU.md)

## Что внутри

- **Тур из 7 точек** — Обзор Ланиакеи · Млечный Путь · Великий аттрактор · Гидра-Центавр ·
  Павлин-Индеец · Южное сверхскопление · Местное сверхскопление
- **Закадровый голос на русском** с субтитрами: Yandex SpeechKit либо резервный
  Web Speech API, если ключи не заданы
- **~18 000 галактик** с сверхгалактическими координатами и **20 именованных объектов**
  с публикационными координатами
- **4 региона**, Великий аттрактор, анимированные потоки, **фон из 4 000 звёзд**
- **Постобработка**: Bloom, Vignette, SMAA
- **Мини-карта**, **масштабная линейка в Мпк**, панель слоёв, легенда
- **Таймлайн открытий** (15 событий, 1924–2014) и **сравнение с 5 сверхскоплениями**
- **Скриншот в PNG**, **ссылка на текущий вид**, **экспорт тура в JSON**
- Горячие клавиши с поддержкой русской и латинской раскладки

## Стек

| Слой | Технологии |
|---|---|
| **Фреймворк** | Next.js 16 · React 19 · TypeScript 5 |
| **3D** | Three.js 0.185 · @react-three/fiber · drei · postprocessing |
| **Стиль** | Tailwind CSS 4 · OKLCH |
| **UI** | shadcn/ui · Radix UI · Lucide Icons |
| **Сборка** | Bun · вывод `standalone` · Caddy |

## Быстрый старт

```bash
git clone https://github.com/QuadDarv1ne/laniakea.git
cd laniakea
bun install
bun dev
# → http://localhost:3000
```

База данных не требуется. Переменные окружения необязательны.

---

<a id="english"></a>

## About

**Laniakea** is a single-page **Next.js 16 + React 19 + TypeScript + Three.js** app that
renders the Laniakea supercluster of galaxies in 3D. The model follows the Cosmicflows
peculiar-velocity catalogue (Tully et al. 2014) and shows the four regions of the
supercluster, the Great Attractor, the position of the Milky Way, and the galaxy flows
toward the gravitational centre.

The scene runs entirely in the browser: data is served statically and no external
service is required. The ambient soundtrack is synthesised procedurally with the
Web Audio API, without any audio files.

> 📖 [Full English documentation →](README_EN.md)

## Highlights

- **Guided tour of 7 stops** — Overview · Milky Way · Great Attractor · Hydra-Centaurus ·
  Pavo-Indus · Southern Supercluster · Local Supercluster
- **Russian voice-over** with subtitles: Yandex SpeechKit, falling back to the browser
  Web Speech API when no keys are configured
- **~18,000 galaxies** in supergalactic coordinates plus **20 named objects** with
  published coordinates
- **4 regions**, the Great Attractor, animated flows, **4,000 background stars**
- **Postprocessing**: Bloom, Vignette, SMAA
- **Mini-map**, **scale ruler in Mpc**, layer panel, legend
- **Timeline of discoveries** (15 events, 1924–2014) and **comparison of 5 superclusters**
- **PNG screenshot**, **shareable view URL**, **tour export to JSON**

## Quick start

```bash
git clone https://github.com/QuadDarv1ne/laniakea.git
cd laniakea
bun install
bun dev
# → http://localhost:3000
```

No database is required and environment variables are optional.

## License

See [LICENSE](LICENSE).
