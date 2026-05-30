# Keyzo.pro — Список улучшений и доработок

## 🔴 Для реального запуска

### 1. OAuth — Google/Telegram
- [ ] Создать проект в Google Cloud Console
- [ ] Получить Client ID и Client Secret
- [ ] Настроить Callback URL: `https://keyzo.pro/auth/google/callback`
- [ ] Добавить кнопку "Войти через Google" на страницу входа
- [ ] Реализовать серверную обработку OAuth (passport-google-oauth20)
- [ ] Создать Telegram бота через @BotFather
- [ ] Получить BOT_TOKEN
- [ ] Реализовать вход через Telegram Mini App
- [ ] Документация: `docs/oauth-setup.md`

### 2. SMTP — Реальная почта
- [ ] Создать аккаунт на Gmail/Yandex/Mailgun
- [ ] Получить SMTP логин и пароль (App Password для Gmail)
- [ ] Заполнить в `.env`: SMTP_HOST, SMTP_USER, SMTP_PASS
- [ ] Настроить шаблоны писем:
  - [ ] Приветственное письмо (регистрация)
  - [ ] Подтверждение заказа
  - [ ] Уведомление о доставке
  - [ ] Уведомление о споре
  - [ ] Уведомление о возврате
  - [ ] Промо-рассылка
  - [ ] Сброс пароля
- [ ] Добавить отписку от рассылки (unsubscribe link)
- [ ] Тест отправки на реальных адресах

### 3. Деплой — VPS/DigitalOcean
- [ ] Выбрать провайдера (DigitalOcean / Hetzner / Timeweb)
- [ ] Создать VPS: 4GB RAM, 2 vCPU, 80GB SSD
- [ ] Установить Ubuntu 22.04
- [ ] Настроить SSH доступ
- [ ] Установить Docker и Docker Compose
- [ ] Клонировать репозиторий
- [ ] Настроить `.env` с секретами
- [ ] Запустить `docker-compose up -d`
- [ ] Настроить автоматический бэкап (cron)
- [ ] Настроить мониторинг (UptimeRobot)

### 4. Домен — keyzo.pro
- [ ] Купить домен (Namecheap / GoDaddy / REG.RU)
- [ ] Настроить DNS записи:
  - [ ] A запись → IP сервера
  - [ ] CNAME www → keyzo.pro
  - [ ] MX для почты (если нужно)
- [ ] Дождаться propagation (до 48 часов)
- [ ] Проверить: `dig keyzo.pro`

### 5. SSL — Let's Encrypt
- [ ] Установить Certbot: `sudo apt install certbot`
- [ ] Получить сертификат: `certbot --nginx -d keyzo.pro -d www.keyzo.pro`
- [ ] Настроить автоматическое обновление: `certbot renew --dry-run`
- [ ] Настроить редирект HTTP → HTTPS
- [ ] Проверить: https://www.ssllabs.com/ssltest/

---

## 🟡 Опционально

### 6. Cypress — E2E тесты
- [ ] Установить: `npm install --save-dev cypress`
- [ ] Настроить `cypress.config.js`
- [ ] Написать тесты:
  - [ ] Регистрация пользователя
  - [ ] Вход в аккаунт
  - [ ] Поиск товара
  - [ ] Покупка товара
  - [ ] Отправка сообщения
  - [ ] Добавление товара продавцом
  - [ ] Админ-панель
- [ ] CI/CD интеграция (GitHub Actions)

### 7. Нагрузочные тесты — k6/Artillery
- [ ] Установить k6: `brew install k6`
- [ ] Написать сценарии:
  - [ ] 100 concurrent users на каталоге
  - [ ] 50 concurrent покупок
  - [ ] Поиск с нагрузкой
  - [ ] API endpoint benchmarks
- [ ] Определить SLA: <200ms response time
- [ ] Документация результатов

### 8. Accessibility — WCAG 2.1
- [ ] Добавить ARIA labels ко всем интерактивным элементам
- [ ] Настроить фокус-индикаторы (visible focus ring)
- [ ] Добавить skip-to-content ссылку
- [ ] Проверить контрастность текста (4.5:1 minimum)
- [ ] Добавить alt тексты ко всем изображениям
- [ ] Проверить работу с клавиатурой (Tab navigation)
- [ ] Протестировать со скринридером (NVDA/VoiceOver)
- [ ] Добавить prefers-reduced-motion media query

### 9. SEO — sitemap.xml, robots.txt
- [ ] Создать `public/sitemap.xml` со всеми страницами
- [ ] Создать `public/robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://keyzo.pro/sitemap.xml
  ```
- [ ] Добавить Open Graph теги (og:title, og:description, og:image)
- [ ] Добавить JSON-LD structured data (Product, BreadcrumbList)
- [ ] Настроить canonical URLs
- [ ] Добавить hreflang для RU/EN
- [ ] Google Search Console подключение
- [ ] Yandex Webmaster подключение

### 10. Метрики — Prometheus + Grafana
- [ ] Настроить Prometheus (сбор метрик)
- [ ] Экспортировать метрики:
  - [ ] Request count / response time
  - [ ] Error rate
  - [ ] Active users
  - [ ] Orders per minute
  - [ ] Database connections
  - [ ] Memory/CPU usage
- [ ] Настроить Grafana дашборд
- [ ] Алерты:
  - [ ] Server down
  - [ ] High error rate (>5%)
  - [ ] Slow responses (>2s)
  - [ ] Low disk space
- [ ] Docker Compose: добавить prometheus + grafana сервисы

---

## 📋 Приоритет выполнения

| Приоритет | Задача | Время |
|-----------|--------|-------|
| 🔴 P0 | Деплой на VPS | 2-4 часа |
| 🔴 P0 | Домен + DNS | 1 час |
| 🔴 P0 | SSL сертификат | 30 мин |
| 🔴 P1 | SMTP настройка | 1-2 часа |
| 🔴 P1 | OAuth Google | 2-3 часа |
| 🟡 P2 | SEO (sitemap, robots) | 1-2 часа |
| 🟡 P2 | Cypress тесты | 4-6 часов |
| 🟡 P2 | Accessibility | 4-8 часов |
| 🟢 P3 | Нагрузочные тесты | 2-3 часа |
| 🟢 P3 | Prometheus + Grafana | 3-4 часа |
