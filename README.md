# SSH Honeypot Dashboard

SSH-ловушка на VPS, которая ловит реальные атаки и показывает их на дашборде.

## Что наловила за 48 часов

800+ сессий с 64 IP из 19 стран. 1200+ попыток входа. Топ паролей — крипто-темы: solana, sol, eth, validator. Поймала 26 образцов малвари, в том числе RedTail — криптомайнинг-ботнет с бинарниками под x86, ARM и ARM64.

## Что внутри

Cowrie ловит SSH-атаки в Docker. Python-парсер читает JSON-логи в реальном времени, обогащает каждый IP геолокацией и пишет в PostgreSQL. FastAPI отдаёт данные. React-дашборд (Tailwind, Leaflet, Recharts) показывает карту мира с атаками, графики и таблицы. Всё за nginx с Let's Encrypt SSL.

## Папки

- parser — Python ETL
- api — FastAPI бэкенд
- dashboard — React фронт
- docker — docker-compose и схема БД
- scripts — бэкап, systemd-сервисы, nginx-конфиг

## Запуск

Внимание: honeypot реально атакуют. Запускай только на отдельном VPS, не дома.

Клонируешь репо, копируешь .env.example в .env, генерируешь пароль БД (openssl rand -base64 32). Запускаешь docker compose up в папке docker. Накатываешь схему. В parser качаешь GeoIP-базу с db-ip.com. Создаёшь venv, ставишь зависимости, запускаешь parser.py с флагом --backfill, потом --tail. То же для api. Для dashboard — npm install и npm run dev. В production используешь systemd-юниты и nginx-конфиг из папки scripts.

## Безопасность

В репо нет реальных паролей, IP или доменов — всё через .env. Малварь не публикуется, только SHA-256 хеши. Сам honeypot защищён по слоям: Cowrie крутится в Docker без привилегий, fail2ban, ключи вместо паролей, реальный SSH на нестандартном порту, PostgreSQL только на localhost.

## Лицензия

MIT
