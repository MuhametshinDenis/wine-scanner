# UI Package

Общий UI-пакет проекта находится в `packages/ui` и используется приложениями монорепозитория через workspace-пакет `@repo/ui`.

UI-пакет содержит переиспользуемые React-компоненты, общие стили, Tailwind CSS-конфигурацию на уровне CSS, utility-функции и hooks.

Основная идея:

- UI-компоненты хранятся в `packages/ui`;
- приложения не дублируют UI-компоненты;
- стили подключаются из `@repo/ui/globals.css`;
- компоненты импортируются через `@repo/ui/components/...`;
- внутри самого UI-пакета используются package imports (`#components`, `#lib`, `#hooks`);
- новые shadcn-компоненты добавляются непосредственно в `packages/ui`.

---

## Структура

```text
.
├── apps/
│   └── web/
│       ├── src/
│       │   ├── components/      # App-specific components
│       │   ├── hooks/           # App-specific hooks
│       │   ├── lib/             # App-specific utilities
│       │   ├── App.tsx
│       │   └── main.tsx
│       │
│       ├── components.json
│       ├── tsconfig.json
│       ├── tsconfig.app.json
│       └── vite.config.ts
│
├── packages/
│   └── ui/
│       ├── src/
│       │   ├── components/      # Shared UI components
│       │   ├── hooks/           # Shared UI hooks
│       │   ├── lib/             # Shared utilities
│       │   │   └── utils.ts
│       │   └── styles/
│       │       └── globals.css  # Shared global styles
│       │
│       ├── components.json      # shadcn configuration
│       ├── package.json
│       └── tsconfig.json
│
├── docs/
│   └── ui/
│       └── README.md
│
├── package.json
└── turbo.json
```

---

# `@repo/ui`

Пакет объявлен как:

```json
{
  "name": "@repo/ui"
}
```

Приложения подключают его как обычную workspace-зависимость:

```json
{
  "dependencies": {
    "@repo/ui": "workspace:*"
  }
}
```

UI-пакет не требует отдельной сборки перед использованием. Vite напрямую обрабатывает исходные `.tsx`, `.ts` и `.css` файлы через package exports.

---

# Package exports

`packages/ui/package.json` предоставляет следующие subpath exports:

```json
{
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./components/*": "./src/components/*.tsx",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts"
  }
}
```

Поэтому компоненты используются следующим образом:

```tsx
import { Button } from "@repo/ui/components/button";
```

Стили:

```tsx
import "@repo/ui/globals.css";
```

Utilities:

```tsx
import { cn } from "@repo/ui/lib/utils";
```

Hooks:

```tsx
import { useSomething } from "@repo/ui/hooks/use-something";
```

Root barrel-файл вроде:

```text
packages/ui/src/index.ts
```

не используется и не требуется.

---

# Добавление нового компонента

## Рекомендуемый способ

Новые shadcn-компоненты добавляются из `packages/ui`.

Перейдите в UI-пакет:

```bash
cd packages/ui
```

После этого используйте shadcn CLI:

```bash
pnpm dlx shadcn@latest add button
```

Например:

```bash
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
```

После выполнения CLI компонент появится в:

```text
packages/ui/src/components/
```

Например:

```text
packages/ui/src/components/
├── button.tsx
├── card.tsx
└── dialog.tsx
```

---

## Добавление нескольких компонентов

Можно добавить несколько компонентов за один запуск:

```bash
pnpm dlx shadcn@latest add button card dialog
```

CLI использует:

```text
packages/ui/components.json
```

и автоматически размещает компоненты в нужных директориях.

---

# Добавление компонента из `apps/web`

Также CLI можно запускать непосредственно из приложения:

```bash
cd apps/web
pnpm dlx shadcn@latest add button
```

Конфигурация:

```text
apps/web/components.json
```

настроена так, чтобы UI-компоненты направлялись в `@repo/ui`.

Однако **предпочтительным местом для добавления shared-компонентов является `packages/ui`**.

Используйте `apps/web` для CLI только если компонент должен быть локальным для конкретного приложения.

---

# Shared vs App-specific components

Важно разделять компоненты на две категории.

## Shared UI

Компонент используется или потенциально может использоваться несколькими приложениями.

Хранить в:

```text
packages/ui/src/components/
```

Примеры:

```text
Button
Card
Dialog
Input
Select
DropdownMenu
Tooltip
```

Использование:

```tsx
import { Button } from "@repo/ui/components/button";
```

---

## App-specific

Компонент содержит логику, относящуюся только к конкретному приложению.

Хранить в:

```text
apps/web/src/components/
```

Например:

```text
apps/web/src/components/
├── header.tsx
├── product-card.tsx
├── checkout-form.tsx
└── wine-search.tsx
```

Такой компонент не должен автоматически переноситься в `packages/ui`.

---

# Импорты внутри `packages/ui`

Внутри UI-пакета используются package imports, определённые в `package.json`:

```json
{
  "imports": {
    "#components/*": "./src/components/*.tsx",
    "#lib/*": "./src/lib/*.ts",
    "#hooks/*": "./src/hooks/*.ts"
  }
}
```

Поэтому внутри компонентов используются:

```tsx
import { cn } from "#lib/utils";
```

а не:

```tsx
import { cn } from "../lib/utils";
```

и не:

```tsx
import { cn } from "@repo/ui/lib/utils";
```

Пример:

```tsx
import { cn } from "#lib/utils";
import { Button } from "#components/button";
```

Это позволяет UI-пакету использовать стабильные внутренние aliases независимо от расположения файла.

---

# `cn` utility

Общая utility-функция находится здесь:

```text
packages/ui/src/lib/utils.ts
```

Сейчас она экспортирует `cn` из пакета `cn`:

```ts
import { cn } from "cn";

export { cn };
```

Поэтому внутри UI-пакета:

```tsx
import { cn } from "#lib/utils";
```

А из приложения:

```tsx
import { cn } from "@repo/ui/lib/utils";
```

---

# Использование компонентов в `apps/web`

После добавления компонента в UI-пакет приложение может импортировать его через `@repo/ui`.

Например:

```tsx
import { Button } from "@repo/ui/components/button";

export default function App() {
  return <Button>Click me</Button>;
}
```

Для `Card`:

```tsx
import { Card } from "@repo/ui/components/card";
```

Для `Dialog`:

```tsx
import { Dialog } from "@repo/ui/components/dialog";
```

Не следует импортировать компоненты напрямую из:

```text
packages/ui/src/...
```

То есть не нужно:

```tsx
import { Button } from "../../../packages/ui/src/components/button";
```

Всегда используйте public package exports:

```tsx
import { Button } from "@repo/ui/components/button";
```

---

# Global CSS

Общие стили находятся в:

```text
packages/ui/src/styles/globals.css
```

и экспортируются как:

```text
@repo/ui/globals.css
```

В приложении CSS подключается один раз, например в `main.tsx`:

```tsx
import "@repo/ui/globals.css";
```

Не нужно создавать отдельную копию `globals.css` в `apps/web`.

---

# Tailwind CSS v4

Проект использует Tailwind CSS v4.

Основной Tailwind CSS импорт находится в:

```css
@import "tailwindcss";
```

в:

```text
packages/ui/src/styles/globals.css
```

Также в CSS объявлены источники классов:

```css
@source "../**/*.{ts,tsx}";
@source "../../../../apps/**/*.{ts,tsx}";
```

Они нужны потому, что Tailwind должен видеть классы как из самого UI-пакета, так и из приложений монорепозитория.

---

# Shared styles

Верхняя часть `globals.css` выглядит примерно так:

```css
@import "tailwindcss";

@source "../**/*.{ts,tsx}";
@source "../../../../apps/**/*.{ts,tsx}";

@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@fontsource-variable/inter";
```

Не следует подключать Tailwind отдельно в каждом приложении, если приложение использует общий UI CSS.

---

# Vite configuration

`apps/web/vite.config.ts` подключает Tailwind через официальный Vite plugin:

```ts
import tailwindcss from "@tailwindcss/vite";
```

и:

```ts
plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()];
```

Также UI-пакет исключён из dependency optimization:

```ts
optimizeDeps: {
  exclude: ["@repo/ui"],
}
```

Это позволяет Vite работать с исходниками `@repo/ui` непосредственно.

---

# React deduplication

В monorepo важно использовать одну копию React.

В Vite настроено:

```ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
  dedupe: ["react", "react-dom"],
}
```

Это предотвращает ситуацию, когда приложение и `@repo/ui` используют разные экземпляры `react` или `react-dom`.

---

# shadcn configuration

## `packages/ui/components.json`

UI-пакет использует:

```json
{
  "style": "base-nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide"
}
```

Aliases внутри UI-пакета:

```json
{
  "aliases": {
    "components": "#components",
    "ui": "#components",
    "lib": "#lib",
    "hooks": "#hooks",
    "utils": "#lib/utils"
  }
}
```

Поэтому shadcn генерирует код с такими импортами:

```tsx
import { cn } from "#lib/utils";
```

---

## `apps/web/components.json`

Для приложения aliases указывают на workspace package:

```json
{
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@repo/ui/lib/utils",
    "ui": "@repo/ui/components"
  }
}
```

`@` остаётся alias для app-local исходников:

```text
apps/web/src/*
```

а `@repo/ui` используется для shared UI.

---

# Какие aliases использовать

| Где находится код              | Alias                   |
| ------------------------------ | ----------------------- |
| `apps/web/src/*`               | `@/*`                   |
| `packages/ui/src/components/*` | `#components/*`         |
| `packages/ui/src/lib/*`        | `#lib/*`                |
| `packages/ui/src/hooks/*`      | `#hooks/*`              |
| App → shared components        | `@repo/ui/components/*` |
| App → shared utils             | `@repo/ui/lib/*`        |
| App → shared styles            | `@repo/ui/globals.css`  |

---

# Типичный workflow

При необходимости нового UI-компонента:

### 1. Перейти в UI package

```bash
cd packages/ui
```

### 2. Добавить компонент

```bash
pnpm dlx shadcn@latest add card
```

### 3. Проверить результат

```text
packages/ui/src/components/card.tsx
```

### 4. Импортировать компонент в приложение

```tsx
import { Card } from "@repo/ui/components/card";
```

### 5. Запустить приложение

Из корня:

```bash
pnpm --filter web dev
```

или:

```bash
pnpm dev
```

если development task настроен для запуска всех приложений.

---

# Проверка после изменений

После добавления или изменения UI-компонента рекомендуется проверить типы:

```bash
pnpm --filter @repo/ui check-types
```

Для приложения:

```bash
pnpm --filter web build
```

Полная проверка монорепозитория:

```bash
pnpm check-types
pnpm build
```

---

# Частые ошибки

## `Failed to resolve import "@repo/ui/globals.css"`

Проверьте, что файл существует:

```text
packages/ui/src/styles/globals.css
```

и что в `packages/ui/package.json` есть:

```json
{
  "exports": {
    "./globals.css": "./src/styles/globals.css"
  }
}
```

После изменения package exports может потребоваться:

```bash
pnpm install
```

---

## `Cannot find module "#lib/utils"`

Проверьте:

```text
packages/ui/package.json
```

Должно быть:

```json
{
  "imports": {
    "#lib/*": "./src/lib/*.ts"
  }
}
```

Также `packages/ui/tsconfig.json` должен использовать:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "resolvePackageJsonImports": true
  }
}
```

---

## shadcn создаёт `@workspace/ui`

Если CLI создаёт импорты вида:

```tsx
import { Button } from "@workspace/ui/components/button";
```

проверьте `components.json`.

Workspace package называется:

```text
@repo/ui
```

поэтому в конфигурации должен использоваться:

```text
@repo/ui
```

а не:

```text
@workspace/ui
```

---

## Tailwind не видит классы

Проверьте `packages/ui/src/styles/globals.css`.

Должны присутствовать `@source` для UI и приложений:

```css
@source "../**/*.{ts,tsx}";
@source "../../../../apps/**/*.{ts,tsx}";
```

Также в `apps/web/vite.config.ts` должен быть подключён:

```ts
import tailwindcss from "@tailwindcss/vite";
```

и:

```ts
tailwindcss();
```

в `plugins`.

---

## Дублирование React

Если появляются ошибки вроде:

```text
Invalid hook call
```

или проблемы с React context, проверьте, что React не дублируется.

В Vite должно быть:

```ts
resolve: {
  dedupe: ["react", "react-dom"],
}
```

А `react` и `react-dom` должны быть peer dependencies `@repo/ui`.

---

# Архитектурное правило

Главное правило UI-слоя:

```text
apps/web
    │
    │ imports
    ▼
@repo/ui
    │
    ├── components
    ├── hooks
    ├── lib
    └── globals.css
```

Приложение использует UI-пакет:

```tsx
import { Button } from "@repo/ui/components/button";
```

но UI-пакет не должен зависеть от конкретного приложения.

То есть направление зависимостей должно быть:

```text
apps → packages
```

а не:

```text
packages → apps
```

---

# Что хранить в `packages/ui`

Хорошие кандидаты:

- Button
- Input
- Card
- Dialog
- Modal
- Select
- Dropdown
- Tabs
- Tooltip
- Avatar
- Badge
- Table
- Form primitives
- общие UI hooks
- общие UI utilities
- общие CSS variables
- общие глобальные стили

# Что не следует хранить в `packages/ui`

Не следует переносить туда бизнес-логику конкретного приложения:

```text
WineScanner
CheckoutForm
UserProfile
ProductPage
TelegramAuth
PaymentHistory
```

если эти компоненты относятся только к конкретному приложению.

Такие компоненты должны находиться в:

```text
apps/web/src/
```

---

# Summary

Для добавления shared UI-компонента:

```bash
cd packages/ui
pnpm dlx shadcn@latest add <component>
```

Затем в приложении:

```tsx
import { Component } from "@repo/ui/components/component";
```

Глобальные стили:

```tsx
import "@repo/ui/globals.css";
```

Внутри `packages/ui`:

```tsx
import { cn } from "#lib/utils";
```

Внутри `apps/web`:

```tsx
import { cn } from "@repo/ui/lib/utils";
```

Не использовать:

```text
../../../packages/ui/src/...
```

Не создавать отдельную копию глобальных UI-стилей в приложении.

Не создавать root barrel `packages/ui/src/index.ts` только ради экспорта компонентов.

Shared UI → `packages/ui`.

App-specific UI → `apps/web/src`.
