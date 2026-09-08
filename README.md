<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Three.js-0.185-black?style=for-the-badge&logo=three.js" alt="Three.js">
</p>

<h1 align="center">🎓 Maestria</h1>

<p align="center">
  <strong>by Maestro7IT</strong><br>
  Образовательная LMS-платформа · Educational LMS Platform
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#русский">Русский</a>
</p>

---

<a id="english"></a>

## About

**Maestria** is a full-featured Learning Management System (LMS) built on **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4**. It provides tools for creating, taking, and managing online courses, tracking student progress, and analytics.

The project is developed by **Maestro7IT** under the direction of **Dupley Maxim Igorevich** and is designed for use in the Russian Federation with full compliance with RF legislation on education and personal data protection.

> 📖 [Full English documentation →](README_EN.md)

## Key Features

### For Students
- **34 courses** in programming, web development, Data Science, game dev, and more
- Step-by-step lesson viewer (Step Viewer) with interactive elements
- Tests and assignments with auto-grading
- Learning progress tracking and completion certificates
- Achievement system, notifications, and favorite courses

### For Teachers
- **Course Editor** — create and edit course materials
- Module and lesson management
- Student statistics and review moderation

### For Administrators
- **Secured admin panel** (`#admin`) with 9 sections: Dashboard, Users, Tests, Materials, Finance, Courses, Reports, Logs, Settings
- **4 SVG chart types**: Line, Bar, Donut, Sparkline
- User management (roles, blocking, 2FA)
- Financial analytics and platform activity logs

### Platform Features
- **Laniakea 3D Scene** — interactive supercluster galaxy visualization (Three.js + React Three Fiber)
- **3 themes**: Light, Dark, Amber (oklch colors)
- **3 languages**: Russian 🇷🇺 · English 🇬🇧 · 中文 🇨🇳
- Custom cursor with smooth follow (pointer:fine)
- 10 legal pages compliant with RF legislation
- Responsive design (mobile · tablet · desktop)

## Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 · React 19 · TypeScript 5 |
| **Styling** | Tailwind CSS 4 · Tailwind Animate · OKLCH |
| **3D** | Three.js · @react-three/fiber · drei · postprocessing |
| **UI** | shadcn/ui (40+ components) · Radix UI · Lucide Icons |
| **State** | Zustand · React Query · TanStack Table |
| **Forms** | React Hook Form · Zod v4 |
| **Database** | Prisma ORM · SQLite |
| **Auth** | NextAuth.js v4 (2FA) |
| **i18n** | next-intl (ru / en / zh) |
| **Build** | Bun · Caddy |

## Installation & Setup

```bash
# Clone
git clone https://github.com/Maestro7IT/laniakea.git
cd laniakea

# Install
bun install

# Setup database
bun db:generate
bun db:push

# Run
bun dev
# → http://localhost:3000
```

See [README_EN.md](README_EN.md) for full instructions.

## Admin Panel

Route: `#admin` (admin role only)

**Login password**: `admin` or `Maestria2026`

## License

| Component | License |
|---|---|
| **User Content** | [CC BY-SA 4.0](LICENSE) |
| **Platform Software** | © Maestro7IT, all rights reserved |

## Contacts

- **Email**: maksimqwe42@mail.ru
- **Address**: Moscow, Russian Federation
- **Platform**: [maestria.ru](https://maestria.ru)

---

<a id="русский"></a>

## О проекте

**Maestria** — это современная образовательная платформа (LMS), разработанная на стеке **Next.js 16 + React 19 + TypeScript + Tailwind CSS 4**. Платформа предоставляет полный набор инструментов для создания, прохождения и управления онлайн-курсами, отслеживания прогресса студентов и аналитики.

Проект **Maestro7IT** создан под руководством **Дуплея Максима Игоревича** и предназначен для использования на территории Российской Федерации с полным соответствием законодательству РФ в сфере образования и защиты персональных данных.

> 📖 [Полная документация на русском →](README_RU.md)

## Ключевые возможности

### Для студентов
- **34 курса** по программированию, веб-разработке, Data Science, геймдеву и другим направлениям
- **Пошаговый просмотр уроков** (Step Viewer) с интерактивными элементами
- **Тесты и задания** с автоматической проверкой
- **Прогресс обучения** и сертификаты по завершении
- **Система достижений**, уведомления и избранные курсы

### Для преподавателей
- **Редактор курсов** — создание и редактирование материалов
- Управление модулями и уроками
- Статистика по студентам и модерация отзывов

### Для администраторов
- **Закрытая панель администратора** (`#admin`) — 9 секций: Дашборд · Пользователи · Тесты · Материалы · Финансы · Курсы · Жалобы · Логи · Настройки
- **4 типа SVG-графиков**: линейный, столбчатый, кольцевая диаграмма, спарклайн
- Управление пользователями (роли, блокировка, 2FA)
- Финансовая аналитика и журнал действий

### Визуальные и платформенные функции
- **3D-сцена «Ланиакея»** — интерактивная визуализация сверхскопления галактик (Three.js + React Three Fiber)
- **3 темы**: светлая, тёмная, янтарная (oklch-цвета)
- **3 языка**: Русский 🇷🇺 · English 🇬🇧 · 中文 🇨🇳
- Кастомный курсор с плавным следованием
- 10 юридических страниц по законодательству РФ
- Адаптивный дизайн (мобильные · планшеты · десктоп)

## Установка и запуск

```bash
# Клонирование
git clone https://github.com/Maestro7IT/laniakea.git
cd laniakea

# Установка
bun install

# Настройка базы данных
bun db:generate
bun db:push

# Запуск
bun dev
# → http://localhost:3000
```

См. [README_RU.md](README_RU.md) для полной инструкции.

## Админ-панель

Маршрут: `#admin` (только роль `admin`)

**Пароль для входа**: `admin` или `Maestria2026`

## Лицензия

| Компонент | Лицензия |
|---|---|
| **Пользовательский контент** | [CC BY-SA 4.0](LICENSE) |
| **Программное обеспечение платформы** | © Maestro7IT, все права защищены |

## Контакты

- **Email**: maksimqwe42@mail.ru
- **Адрес**: г. Москва, Российская Федерация
- **Платформа**: [maestria.ru](https://maestria.ru)

---

<p align="center">
  <strong>Maestria</strong> · Maestro7IT · Moscow, Russia
</p>
