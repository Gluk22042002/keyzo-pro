# Keyzo.pro — Маркетплейс цифровых товаров

## Быстрый старт

### 1. Установить PostgreSQL (если не установлен)

```bash
brew install postgresql@16
brew services start postgresql@16
```

### 2. Создать базу данных и пользователя

```bash
/usr/local/opt/postgresql@16/bin/psql -d postgres -c "CREATE DATABASE keyzo_pro;"
/usr/local/opt/postgresql@16/bin/psql -d postgres -c "CREATE USER keyzo WITH PASSWORD 'keyzo2026' SUPERUSER;"
/usr/local/opt/postgresql@16/bin/psql -d keyzo_pro -c "GRANT ALL ON SCHEMA public TO keyzo;"
```

### 3. Установить зависимости

```bash
cd /Users/gluk/Desktop/dronradamap-main/test
npm install
```

### 4. Запустить сервер (миграция + seed + API)

```bash
node server/index.js
```

Сервер автоматически:
- Создаст все таблицы в PostgreSQL
- Наполнит базу тестовыми данными
- Запустится на порту 3001

### 5. Открыть в браузере

```
http://localhost:3001
```

---

## Перезапуск

```bash
# Остановить старый процесс
kill $(lsof -ti:3001)

# Запустить заново
node server/index.js
```

---

## Полезные команды

### PostgreSQL

```bash
# Подключиться к базе
/usr/local/opt/postgresql@16/bin/psql -d keyzo_pro

# Посмотреть таблицы
\dt

# Посмотреть пользователей
SELECT id, username, email, role, balance FROM users;

# Посмотреть товары
SELECT id, title, price, sold_count FROM products;

# Посмотреть заказы
SELECT id, amount, status, created_at FROM orders;

# Выйти из psql
\q
```

### Сервер

```bash
# Запустить в фоне
node server/index.js > /tmp/keyzo.log 2>&1 &

# Посмотреть логи
cat /tmp/keyzo.log

# Пересобрать фронтенд
npx vite build && cp -r dist/* public/
```

---

## Аккаунты для теста

| Email | Пароль | Роль |
|-------|--------|------|
| admin@keyzo.pro | password123 | Админ |
| shop@keyzo.pro | password123 | Продавец |
| game@keyzo.pro | password123 | Продавец 2 |
| player@test.com | password123 | Покупатель |

---

## API Endpoints

### Авторизация
- `POST /api/auth/register` — регистрация (username, email, password, role)
- `POST /api/auth/login` — вход (email, password)

### Товары
- `GET /api/products` — список товаров (query: category, search, sort, page, limit, min_price, max_price, featured)
- `GET /api/products/:id` — товар + отзывы + похожие
- `POST /api/products` — создать товар (seller)
- `PUT /api/products/:id` — редактировать товар
- `DELETE /api/products/:id` — удалить товар
- `GET /api/search?q=` — поиск

### Категории
- `GET /api/categories` — все категории

### Корзина
- `GET /api/cart` — корзина
- `POST /api/cart` — добавить (product_id)
- `DELETE /api/cart/:productId` — удалить

### Избранное
- `GET /api/favorites` — избранное
- `POST /api/favorites` — toggle (product_id)

### Заказы
- `POST /api/orders` — создать заказ (product_id, promo_code)
- `POST /api/orders/:id/confirm` — подтвердить/спор/возврат
- `GET /api/orders` — мои заказы
- `GET /api/orders/seller` — заказы продавца

### Промокоды
- `POST /api/promo/validate` — проверить промокод (code, order_amount)

### Чат
- `GET /api/messages` — список бесед
- `GET /api/messages/:userId` — переписка
- `POST /api/messages` — отправить (receiver_id, text)
- `GET /api/messages/unread/count` — непрочитанные

### Продавец
- `GET /api/seller/dashboard` — дашборд (товары, заказы, отзывы)
- `GET /api/sellers/:id` — публичный профиль

### Пользователь
- `GET /api/user/balance` — баланс
- `POST /api/user/balance` — пополнить (amount)
- `PUT /api/user/profile` — профиль (username, avatar, bio, telegram, discord, website)

### Уведомления
- `GET /api/notifications` — список
- `GET /api/notifications/unread` — непрочитанные
- `POST /api/notifications/read` — пометить прочитанными

### Админ
- `GET /api/admin/stats` — статистика платформы
- `GET /api/admin/users` — все пользователи
- `PUT /api/admin/users/:id` — изменить роль/верификацию/баланс
- `GET /api/admin/products` — все товары
- `GET /api/admin/orders` — все заказы
- `GET /api/admin/promos` — все промокоды
- `POST /api/admin/promos` — создать промокод

### Загрузка файлов
- `POST /api/upload` — загрузить изображение (multipart/form-data, поле: file)

### Настройки
- `GET /api/settings` — настройки платформы

---

## Структура проекта

```
test/
├── .env                    # Переменные окружения (DATABASE_URL, JWT_SECRET)
├── package.json
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── server/
│   ├── index.js            # Express сервер + все API
│   ├── db.js               # Подключение PostgreSQL (pool, query, get, getAll, run, transaction)
│   ├── migrate.js          # Миграции (схема БД + индексы)
│   └── seed.js             # Тестовые данные
├── src/
│   ├── main.jsx
│   ├── App.jsx             # Роуты
│   ├── index.css           # Стили (glass morphism, анимации)
│   ├── utils/api.js        # API клиент
│   ├── hooks/useAuth.jsx   # Контекст авторизации
│   ├── components/
│   │   ├── Header.jsx      # Хедер с поиском, навигацией, балансом
│   │   ├── AuthModal.jsx   # Модалка входа/регистрации
│   │   ├── ProductCard.jsx # Карточка товара
│   │   ├── SteamTopup.jsx  # Виджет пополнения Steam
│   │   └── TopUpModal.jsx  # Модалка пополнения баланса
│   └── pages/
│       ├── HomePage.jsx        # Главная
│       ├── CatalogPage.jsx     # Каталог с фильтрами
│       ├── ProductPage.jsx     # Страница товара
│       ├── CartPage.jsx        # Корзина
│       ├── OrdersPage.jsx      # Заказы
│       ├── SellerDashboard.jsx # Панель продавца
│       ├── SellerProfile.jsx   # Профиль продавца
│       ├── MessagesPage.jsx    # Чат
│       └── FavoritesPage.jsx   # Избранное
└── public/
    └── uploads/            # Загруженные изображения
```

---

## Технологии

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Express.js, PostgreSQL 16, pg (node-postgres)
- **Auth:** JWT (jsonwebtoken), bcryptjs
- **File Upload:** multer
- **UI:** Glass morphism, анимации, адаптивный дизайн
- **БД:** 14 таблиц, индексы, GIN-поиск, транзакции
