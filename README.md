# TaskFlow — SaaS-платформа управления задачами

Стек: **React + TypeScript** (frontend), **NestJS** (backend), **PostgreSQL** (данные), **Redis** (кэш + pub/sub для WebSocket).

Это не готовое к продакшену приложение целиком, а рабочий скелет трёх подсистем из ТЗ,
с кодом, который можно напрямую встроить в существующий NestJS/React проект.

## 1. Роли и права доступа (RBAC)

**Модель данных:** `Permission` (атомарные права вида `resource:action`) → many-to-many → `Role`
(именованный набор прав, скоуплен на `Workspace`, то есть у каждого тенанта свои роли) →
many-to-one → `User`.

- `backend/src/rbac/permissions.enum.ts` — список всех прав + дефолтные наборы для 5 ролей
  (owner/admin/manager/member/viewer).
- `backend/src/rbac/entities/*` — TypeORM-сущности.
- `backend/src/rbac/decorators/permissions.decorator.ts` + `guards/permissions.guard.ts` —
  `@RequirePermissions(Permission.TASK_DELETE)` на любом контроллере/методе, guard читает
  `request.user.role.permissions` (кладётся туда JwtStrategy после логина) и либо пропускает,
  либо кидает `403`.
- `backend/src/rbac/rbac.service.ts` — сидинг дефолтных ролей при создании воркспейса,
  создание кастомных ролей, защита от privilege escalation (нельзя выдать роль с правами,
  которых нет у тебя самого).
- На фронте `AuthContext` хранит `role.permissions` залогиненного пользователя,
  `PermissionGate` скрывает/показывает UI-элементы — **важно**: это только UX-удобство,
  реальная защита — на бэкенде через guard.

## 2. Real-time уведомления через WebSocket

- `backend/src/notifications/notifications.gateway.ts` — `@WebSocketGateway` на namespace
  `/ws/notifications`. Аутентификация происходит один раз при handshake (JWT в `auth.token`),
  после чего сокет автоматически джойнится в комнаты `user:{id}` и `workspace:{id}`.
- `backend/src/notifications/redis-io.adapter.ts` — **критично для горизонтального
  масштабирования**: без Redis-адаптера комнаты socket.io живут только в памяти одного
  инстанса, и уведомление, отправленное с пода A, не дойдёт до сокета на поде B. Адаптер
  превращает `server.to(room).emit()` в Redis pub/sub broadcast между всеми инстансами.
- `backend/src/notifications/notifications.service.ts` — паттерн "сначала пишем в БД, потом
  пушим в сокет": уведомление переживёт офлайн получателя (он увидит его в списке при
  следующем логине через `listUnread`), а если сокет активен — прилетит мгновенно.
- На фронте `useNotifications` — хук с одним соединением на всё приложение, автопереподключение
  из коробки (socket.io), токен ревалидируется при каждом реконнекте.

## 3. Панель аналитики с интерактивными графиками

- `backend/src/analytics/analytics.service.ts` — три агрегирующих SQL-запроса
  (throughput по времени, разбивка по статусам, загрузка по исполнителям), каждый
  кэшируется в Redis на 60 секунд (cache-aside), чтобы не долбить Postgres на каждый
  рендер дашборда. `invalidateWorkspaceCache()` нужно вызывать из `TasksService` при
  изменении задач, чтобы не ждать полный TTL.
- `backend/src/analytics/analytics.controller.ts` — эндпоинты защищены
  `Permission.ANALYTICS_VIEW`.
- `frontend/src/components/AnalyticsDashboard.tsx` — три интерактивных графика на
  **recharts**: линейный график throughput, круговая диаграмма по статусам, горизонтальный
  bar chart по загрузке исполнителей. Переключатель гранулярности (день/неделя/месяц)
  триггерит перезапрос. Обёрнуто в `PermissionGate`.

## Как это соединяется в реальном флоу

1. Пользователь логинится → JWT содержит `sub`, `workspaceId`; после логина бэкенд
   подгружает `role.permissions` и кладёт в контекст ответа.
2. Фронт коннектится к `/ws/notifications` с этим JWT.
3. Кто-то назначает задачу → `TasksService.assign()` вызывает
   `NotificationsService.notifyTaskAssigned()` → запись в БД + `gateway.emitToUser()` →
   получатель видит уведомление в реальном времени, если онлайн.
4. Та же операция вызывает `AnalyticsService.invalidateWorkspaceCache()`, так что
   дашборд менеджера сразу показывает актуальную загрузку исполнителя.

## Запуск локально

```bash
docker-compose up -d postgres redis
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

## Что нужно доделать под конкретный проект

- Модули `auth` (JwtAuthGuard, JwtStrategy) и `workspaces`/`tasks` не включены — здесь
  только заглушки-импорты (`../auth/jwt-auth.guard`, `../workspaces/entities/workspace.entity`),
  их нужно реализовать по своей схеме БД.
- Миграции TypeORM для новых таблиц (`roles`, `permissions`, `role_permissions`,
  `notifications`).
- Rate-limiting на WebSocket handshake, если ожидается публичный доступ.
