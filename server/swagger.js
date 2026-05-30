import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Keyzo.pro API',
      version: '1.0.0',
      description: 'API для маркетплейса цифровых товаров Keyzo.pro',
      contact: { name: 'Keyzo.pro', url: 'https://keyzo.pro' },
    },
    servers: [{ url: '/api', description: 'API Server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['user', 'seller', 'admin'] },
            balance: { type: 'number' },
            is_verified: { type: 'boolean' },
            avatar: { type: 'string' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            old_price: { type: 'number' },
            category_id: { type: 'integer' },
            seller_id: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            region: { type: 'string' },
            delivery_type: { type: 'string' },
            image: { type: 'string' },
            stock_count: { type: 'integer' },
            sold_count: { type: 'integer' },
            rating: { type: 'number' },
            is_active: { type: 'boolean' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            buyer_id: { type: 'string', format: 'uuid' },
            product_id: { type: 'string' },
            seller_id: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            commission: { type: 'number' },
            seller_amount: { type: 'number' },
            status: { type: 'string', enum: ['pending', 'paid', 'delivered', 'completed', 'disputed', 'refunded', 'cancelled'] },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            sender_id: { type: 'string', format: 'uuid' },
            receiver_id: { type: 'string', format: 'uuid' },
            text: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Achievement: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'string', format: 'uuid' },
            achievement_key: { type: 'string' },
            earned_at: { type: 'string', format: 'date-time' },
          },
        },
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number' },
            commission_percent: { type: 'number' },
            max_products: { type: 'integer' },
          },
        },
        Question: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            product_id: { type: 'string' },
            user_id: { type: 'string', format: 'uuid' },
            question: { type: 'string' },
            answer: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Регистрация нового пользователя',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password'],
                  properties: {
                    username: { type: 'string', minLength: 3 },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['user', 'seller'] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Успешная регистрация', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
            400: { description: 'Ошибка валидации', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Вход в систему',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Успешный вход', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, user: { $ref: '#/components/schemas/User' } } } } } },
            401: { description: 'Неверные данные', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Получить все категории',
          responses: { 200: { description: 'Список категорий', content: { 'application/json': { schema: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' }, slug: { type: 'string' }, icon: { type: 'string' } } } } } } } },
        },
      },
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'Получить список продуктов',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Slug категории' },
            { name: 'seller_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'region', in: 'query', schema: { type: 'string' } },
            { name: 'min_price', in: 'query', schema: { type: 'number' } },
            { name: 'max_price', in: 'query', schema: { type: 'number' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['cheapest', 'expensive', 'newest', 'rating', 'views'] } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            200: { description: 'Список продуктов', content: { 'application/json': { schema: { type: 'object', properties: { products: { type: 'array', items: { $ref: '#/components/schemas/Product' } }, total: { type: 'integer' }, page: { type: 'integer' }, pages: { type: 'integer' } } } } } },
          },
        },
        post: {
          tags: ['Products'],
          summary: 'Создать продукт',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'price', 'category_slug'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    category_slug: { type: 'string' },
                    type: { type: 'string' },
                    region: { type: 'string' },
                    delivery_type: { type: 'string', enum: ['auto', 'manual', 'gift'] },
                    image: { type: 'string' },
                    stock_count: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Продукт создан', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } } },
        },
      },
      '/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Получить продукт по ID',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Продукт', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } }, 404: { description: 'Не найден' } },
        },
        put: {
          tags: ['Products'],
          summary: 'Обновить продукт',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Продукт обновлён' }, 403: { description: 'Нет доступа' }, 404: { description: 'Не найден' } },
        },
        delete: {
          tags: ['Products'],
          summary: 'Удалить продукт',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Продукт удалён' }, 403: { description: 'Нет доступа' }, 404: { description: 'Не найден' } },
        },
      },
      '/orders': {
        get: {
          tags: ['Orders'],
          summary: 'Получить заказы покупателя',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список заказов', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } } },
        },
        post: {
          tags: ['Orders'],
          summary: 'Создать заказ',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['product_id'],
                  properties: { product_id: { type: 'string' }, promo_code: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Заказ создан' }, 400: { description: 'Ошибка' } },
        },
      },
      '/orders/seller': {
        get: {
          tags: ['Orders'],
          summary: 'Получить заказы продавца',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список заказов продавца' } },
        },
      },
      '/orders/{id}/confirm': {
        post: {
          tags: ['Orders'],
          summary: 'Подтвердить/оспорить заказ',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['buyer_confirm', 'open_dispute', 'refund'] },
                    reason: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Действие выполнено' } },
        },
      },
      '/messages': {
        get: {
          tags: ['Messages'],
          summary: 'Получить список чатов',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список чатов' } },
        },
        post: {
          tags: ['Messages'],
          summary: 'Отправить сообщение',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['receiver_id', 'text'],
                  properties: { receiver_id: { type: 'string', format: 'uuid' }, text: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Сообщение отправлено' } },
        },
      },
      '/messages/{userId}': {
        get: {
          tags: ['Messages'],
          summary: 'Получить историю сообщений',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'История сообщений' } },
        },
      },
      '/messages/unread/count': {
        get: {
          tags: ['Messages'],
          summary: 'Количество непрочитанных',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Количество непрочитанных' } },
        },
      },
      '/cart': {
        get: {
          tags: ['Cart'],
          summary: 'Получить корзину',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Корзина' } },
        },
        post: {
          tags: ['Cart'],
          summary: 'Добавить в корзину',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['product_id'], properties: { product_id: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Добавлено' } },
        },
      },
      '/cart/{productId}': {
        delete: {
          tags: ['Cart'],
          summary: 'Удалить из корзины',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Удалено' } },
        },
      },
      '/favorites': {
        get: {
          tags: ['Favorites'],
          summary: 'Получить избранное',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список избранного' } },
        },
        post: {
          tags: ['Favorites'],
          summary: 'Добавить/убрать из избранного',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['product_id'], properties: { product_id: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Статус избранного' } },
        },
      },
      '/promo/validate': {
        post: {
          tags: ['Promo'],
          summary: 'Проверить промокод',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['code', 'order_amount'], properties: { code: { type: 'string' }, order_amount: { type: 'number' } } },
              },
            },
          },
          responses: { 200: { description: 'Скидка рассчитана' }, 400: { description: 'Ошибка промокода' } },
        },
      },
      '/user/balance': {
        get: {
          tags: ['User'],
          summary: 'Получить баланс',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Баланс' } },
        },
        post: {
          tags: ['User'],
          summary: 'Пополнить баланс',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['amount'], properties: { amount: { type: 'number', minimum: 1, maximum: 100000 } } },
              },
            },
          },
          responses: { 200: { description: 'Баланс пополнен' } },
        },
      },
      '/user/profile': {
        put: {
          tags: ['User'],
          summary: 'Обновить профиль',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string' },
                    avatar: { type: 'string' },
                    bio: { type: 'string' },
                    telegram: { type: 'string' },
                    discord: { type: 'string' },
                    website: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Профиль обновлён' } },
        },
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Получить уведомления',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список уведомлений' } },
        },
      },
      '/notifications/unread': {
        get: {
          tags: ['Notifications'],
          summary: 'Количество непрочитанных уведомлений',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Количество' } },
        },
      },
      '/notifications/read': {
        post: {
          tags: ['Notifications'],
          summary: 'Отметить все как прочитанные',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Отмечены' } },
        },
      },
      '/sellers/{id}': {
        get: {
          tags: ['Sellers'],
          summary: 'Получить профиль продавца',
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Профиль продавца' }, 404: { description: 'Не найден' } },
        },
      },
      '/seller/dashboard': {
        get: {
          tags: ['Seller'],
          summary: 'Панель продавца',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Данные панели' } },
        },
      },
      '/seller/analytics': {
        get: {
          tags: ['Seller'],
          summary: 'Аналитика продавца',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'days', in: 'query', schema: { type: 'integer' } }],
          responses: { 200: { description: 'Данные аналитики' } },
        },
      },
      '/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Статистика платформы',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Статистика' } },
        },
      },
      '/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Все пользователи',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список пользователей' } },
        },
      },
      '/admin/users/{id}': {
        put: {
          tags: ['Admin'],
          summary: 'Изменить пользователя',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Пользователь изменён' } },
        },
      },
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: { 200: { description: 'Статус сервера' } },
        },
      },
      '/docs': {
        get: {
          tags: ['System'],
          summary: 'Swagger UI документация',
          responses: { 200: { description: 'Swagger UI' } },
        },
      },
      '/export/{type}': {
        get: {
          tags: ['Export'],
          summary: 'Экспорт данных (CSV/JSON)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['orders', 'products', 'users'] } },
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['csv', 'json'] } },
          ],
          responses: { 200: { description: 'Файл данных' } },
        },
      },
      '/import/products': {
        post: {
          tags: ['Import'],
          summary: 'Импорт товаров из CSV',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: { file: { type: 'string', format: 'binary' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Результат импорта' } },
        },
      },
      '/invoice/{orderId}': {
        get: {
          tags: ['PDF'],
          summary: 'Скачать PDF счёт',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'PDF файл', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } },
        },
      },
      '/questions/{productId}': {
        get: {
          tags: ['Questions'],
          summary: 'Вопросы по товару',
          parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Список вопросов' } },
        },
        post: {
          tags: ['Questions'],
          summary: 'Задать вопрос',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['question'], properties: { question: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Вопрос создан' } },
        },
      },
      '/questions/{id}/answer': {
        post: {
          tags: ['Questions'],
          summary: 'Ответить на вопрос (продавец)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['answer'], properties: { answer: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Ответ отправлен' } },
        },
      },
      '/achievements': {
        get: {
          tags: ['Achievements'],
          summary: 'Достижения пользователя',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список достижений' } },
        },
      },
      '/achievements/check': {
        post: {
          tags: ['Achievements'],
          summary: 'Проверить и начислить достижения',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Результат проверки' } },
        },
      },
      '/subscriptions/plans': {
        get: {
          tags: ['Subscriptions'],
          summary: 'Получить планы подписок',
          responses: { 200: { description: 'Список планов' } },
        },
      },
      '/subscriptions/current': {
        get: {
          tags: ['Subscriptions'],
          summary: 'Текущий план продавца',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Текущий план' } },
        },
      },
      '/subscriptions/subscribe': {
        post: {
          tags: ['Subscriptions'],
          summary: 'Оформить подписку',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', required: ['plan_id'], properties: { plan_id: { type: 'string' } } },
              },
            },
          },
          responses: { 200: { description: 'Подписка оформлена' } },
        },
      },
      '/backup/create': {
        post: {
          tags: ['Backup'],
          summary: 'Создать резервную копию',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Backup создан' } },
        },
      },
      '/backup/list': {
        get: {
          tags: ['Backup'],
          summary: 'Список бэкапов',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Список файлов' } },
        },
      },
      '/backup/restore/{filename}': {
        post: {
          tags: ['Backup'],
          summary: 'Восстановить из бэкапа',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'filename', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Восстановлено' } },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Keyzo.pro API Docs',
  }));
  app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
}

export default swaggerSpec;
