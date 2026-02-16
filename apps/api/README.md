# AI Discharge Care 360 API (NestJS)

後端服務採用 NestJS + Prisma，資料庫先以 **Supabase Postgres** 為主。

## 1) 安裝與啟動

```bash
cd apps/api
npm install
npm run start:dev
```

## 2) Supabase 資料庫設定

1. 在 Supabase 建立專案。
2. 於 Project Settings > Database 取得連線字串。
3. 在 `apps/api/.env` 設定：

```bash
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
JWT_SECRET="replace_me"
```

> 若要跑 migration，建議暫時把 `DATABASE_URL` 改為 Supabase 直連（5432）；runtime 再切回 pooler（6543）。

## 3) Prisma 指令

```bash
# 產生 Prisma Client
npm run prisma:generate

# 本機開發建立 migration
npm run prisma:migrate:dev -- --name init

# 部署到 Supabase（CI/正式環境）
npm run prisma:migrate:deploy

# 若只想同步 schema（非 migration flow）
npm run prisma:db:push
```

## 4) LINE 協作資料表（已在 schema）

已定義以下表供 Phase 10 使用：
- `line_accounts`
- `collaboration_tasks`
- `collaboration_events`
- `incident_reports`

對應檔案：`apps/api/prisma/schema.prisma`

## 5) 建議上線流程（Supabase）

1. 在 staging Supabase 套用 migration。
2. 驗證 webhook / 任務流程 / timeline API。
3. 再將相同 migration 部署到 production Supabase。
4. 用 `prisma migrate deploy` 做版本化，不建議直接手改資料表。


## 6) Phase 10 首版 API（已啟用）

- `POST /line/webhook`
  - 驗證 `x-line-signature` 後，將事件寫入 `collaboration_events`（MVP 先記錄）。
- `POST /line/link`
  - 需 JWT + `X-Tenant-ID`，且角色為 `TENANT_ADMIN` / `CASE_MANAGER`。
  - 綁定或更新 `line_accounts`，並驗證 `patientId` 屬於目前租戶。
- `POST /line/tasks`
  - 需 JWT + `X-Tenant-ID`，角色：`TENANT_ADMIN` / `CASE_MANAGER`。
  - 建立外部機構協作任務。
- `GET /line/tasks`
  - 需 JWT + `X-Tenant-ID`，可用 `status` 篩選任務。
- `POST /line/tasks/:taskId/accept`
  - 需 JWT + `X-Tenant-ID`，更新任務為已接案並寫入事件。
- `POST /line/tasks/:taskId/complete`
  - 需 JWT + `X-Tenant-ID`，更新任務為已完成並寫入事件。
- `POST /line/incidents`
  - 需 JWT + `X-Tenant-ID`，角色：`TENANT_ADMIN` / `CASE_MANAGER` / `PHYSICIAN` / `NURSE`。
  - 新增異常事件至 `incident_reports`，並同步寫入 `collaboration_events`。
- `GET /line/progress/:patientId`
  - 需 JWT + `X-Tenant-ID`，回傳目前進度、下一步建議、關懷訊息、隱私保護建議與警示摘要。
  - 內含隱私/防入侵提醒，避免在 LINE 外洩敏感病歷資訊。
- `GET /line/timeline/:patientId`
  - 需 JWT + `X-Tenant-ID`，回傳病患最近 100 筆協作事件時間軸。

`POST /line/link` body 範例：

```json
{
  "lineUserId": "Uxxxxxxxx",
  "role": "FAMILY",
  "patientId": "b3d7c421-0f5a-4c34-aae9-2c0b64f4cb7f",
  "displayName": "王小美"
}
```
