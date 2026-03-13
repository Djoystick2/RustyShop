# Loadpage Startup Splash

Date: 2026-03-13

## Что изменено

- Текущий startup splash переведён на image-first вариант с использованием `loadpage.png` из корня проекта.
- Обновлены обе поверхности загрузки:
  - ранний pre-React fallback в `index.html`
  - React startup splash в `src/components/common/StartupSplash.tsx`
- Основной визуал теперь строится вокруг полноэкранного изображения `loadpage.png`.
- В нижней части экрана добавлен текст `Загрузка...`.

## Как реализована анимация текста

- Текст `Загрузка` расположен внизу экрана поверх изображения.
- Для трёх точек используется лёгкая staggered fade/pulse анимация:
  - точки плавно усиливают opacity
  - слегка смещаются по `translateY`
  - анимация цикличная и очень лёгкая по стоимости
- Для читаемости поверх картинки снизу добавлен мягкий градиентный overlay и полупрозрачная pill-подложка под текст.

## Адаптация и UX

- Изображение рендерится через `object-fit: cover`, чтобы аккуратно сидеть на мобильном full-screen экране.
- Нижний блок учитывает `env(safe-area-inset-bottom)`, чтобы текст не прилипал к краю в Telegram Mini App.
- Новый splash не вмешивается в раннюю инициализацию темы: theme boot script в `index.html` сохранён.
- Bootstrap flow не менялся: поменялся только визуальный слой startup loading.

## Изменённые файлы

- `index.html`
- `src/components/common/StartupSplash.tsx`

## Использованный asset

- `loadpage.png` из корня проекта

## Проверки

- `npm run typecheck`
- `npm run build`

## Примечание

- Файл `loadpage.png` уже присутствует в корне проекта и сейчас числится в рабочем дереве как untracked asset. В коде он уже используется и успешно попадает в production build.
