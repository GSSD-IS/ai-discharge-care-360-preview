# 任務清單: AI Discharge Care 360 (SaaS 平台)

## Phase 1: SaaS 核心基建 (SaaS Core Foundation)
- [x] **1.1 Monorepo 建置** <!-- id: 1.1 -->
    - [x] 初始化 `turbo` 或 `nx` workspace.
    - [x] 建立 `apps/web` (前端: React+Vite).
    - [x] 建立 `apps/api` (後端: NestJS).
    - [x] 設定 `packages/ui` (共用 UI 組件與 Tailwind).
    - [x] 設定 `eslint`, `prettier`, 與 `tsconfig`.

- [x] **1.2 資料庫與 Prisma 設定** <!-- id: 1.2 -->
    - [x] 在 `apps/api` 初始化 Prisma.
    - [x] 設計多租戶 Schema (RLS 或 `tenantId` 欄位).
    - [x] 定義 User, Role, Tenant 表.
    - [x] 設定 Supabase 本地開發環境 (或 Docker PG).
    - [x] 實作 NestJS Tenant Middleware.

- [x] **1.3 認證與 RBAC** <!-- id: 1.3 -->
    - [x] 實作 JWT 認證 (Supabase Auth 或自建).
    - [x] 建立 Guards: `SuperAdmin`, `TenantAdmin`, `Staff`, `Patient`.
    - [x] 建立用戶管理 API (新增/邀請).

- [x] **1.4 設計系統整合** <!-- id: 1.4 -->
    - [x] 遷移 `ai-discharge-care-360.zip` 樣式至 `packages/ui`.
    - [x] 實作 ThemeProvider 支援白牌化 (動態主色).
    - [x] 建立基礎 Layout (側邊欄, 頂部導航).

## Phase 2: 用戶定義流程引擎 (User-Defined Workflow Engine)
- [x] **2.1 後端: 狀態機引擎** <!-- id: 2.1 -->
    - [x] 定義 `WorkflowDefinition` JSON Schema.
    - [x] 實作 `WorkflowService` 處理狀態流轉 (XState 邏輯).
    - [x] 實作 `MandatoryNode` (必經節點) 驗證.

- [x] **2.2 前端: 流程設計器** <!-- id: 2.2 -->
    - [x] 安裝 `reactflow` 套件.
    - [x] 建立 `WorkflowEditor` 頁面.
    - [x] 實作自定義節點 (Stage, Trigger, Action).
    - [x] 實作拖曳儲存邏輯.

## Phase 3: 動態表單與儀表板 (Dynamic Forms & Dashboard)
- [x] **3.1 表單建構器** <!-- id: 3.1 -->
    - [x] 定義 Form JSON Schema.
    - [x] 建立 Form Render 組件.
    - [x] 綁定表單至流程節點.

- [x] **3.2 動態儀表板** <!-- id: 3.2 -->
    - [x] 實作狀態聚合 API.
    - [x] 建立動態 Kanban 看板組件.
    - [x] 實作病患卡片與 "必經未完成" 警示.

## Phase 4: AI 智慧核心 (AI Intelligence Core)
- [x] **4.1 Gemini 服務整合** <!-- id: 4.1 -->
    - [x] 安裝 `@google/generative-ai` 套件.
    - [x] 建立 `AiModule` 與 `GeminiService` (NestJS).
    - [x] 實作 Prompt Template 管理機制.

- [x] **4.2 智慧出院計畫** <!-- id: 4.2 -->
    - [x] 實作 `POST /api/ai/discharge-plan`.
    - [x] 前端 `DischargePlanningHub` 串接 AI 生成 API.
    - [x] 支援 "Regenerate" (重新生成) 功能.

- [x] **4.3 風險評估模型** <!-- id: 4.3 -->
    - [x] 實作 `POST /api/ai/risk-assessment`.
    - [x] 基於病患特徵 (Age, ADL, Comorbidities) 生成風險報告.


## Phase 5: SaaS 架構與部署 (SaaS Architecture & Deployment)
- [x] **5.1 登入與認證 (前端 Mock)** <!-- id: 5.1 -->
    - [x] 實作登入頁面 (支援白牌化).
    - [x] 建立 ProtectedRoute 與 AuthContext.
    - [x] 模擬租戶資料 (Mock Tenant Data).

- [x] **5.2 後台管理儀表板** <!-- id: 5.2 -->
    - [x] 建立租戶管理視圖.
    - [x] 建立用戶角色管理 (基本路由已建立).
    - [x] 實作 SaaS 營運儀表板 (Stats Cards).

- [x] **5.3 標準流程動態化 (Standard Workflow)** <!-- id: 5.3 -->
    - [x] 定義 `standardWorkflow.json` Mock Data.
    - [x] 重構 `DischargePlanningHub` 支援動態步驟渲染 (Dynamic Wizard).
    - [x] 驗證流程客製化能力 (Mock Two Different Workflows).
    - [x] 修正: 病歷調閱 (Mock EMR Modal) 與 發布出院計畫 (Toast).

- [x] **5.4 病患入口網與部署** <!-- id: 5.4 -->
    - [x] 建立響應式病患首頁 (Mobile Layout).
    - [x] 實作 "我的計畫" 與 "衛教" 視圖 (Patient Portal).
    - [x] 部署至 Vercel (Web).

- [x] **5.5 權限設定 (RBAC UI)** <!-- id: 5.5 -->
    - [x] 實作 RBAC Settings 頁面.

- [x] **5.7 角色權限與視圖切換 (Frontend RBAC)** <!-- id: 5.7 -->
    - [x] 實作「醫師/護理師」角色切換器.
    - [x] 限制「醫師決策 (Workspace)」與「申報 (Claims)」僅醫師可見.

- [x] **5.8 衛教介面重構 (Refactor AI Education)** <!-- id: 5.8 -->
    - [x] 從 CaseDetail 移除 AI 衛教生成卡片.
    - [x] 將 AI 衛教生成介面整合至 DischargePlanningHub (S2 評估階段).

- [x] **5.9 出院安置方向與進度 (Discharge Placement Logic)** <!-- id: 5.9 -->
    - [x] 定義新資料結構 (Home, RCW, Facility, Transfer) 於 `types/template.ts`.
    - [x] 在 `CaseDetail` 新增「出院安置方向」編輯卡片.
    - [x] 更新 `Dashboard` 顯示個案安置進度摘要.

- [x] **5.6 介面在地化 (Localization)** <!-- id: 5.6 -->
    - [x] SaaS 後台: 營運儀表板、租戶列表、租戶詳情中文化.
    - [x] 登入頁面: 歡迎詞與表單中文化.

## Phase 6: 長照 3.0 雙軌狀態機 (LTC 3.0 Dual-Track State Machine)
- [x] **6.1 狀態機引擎升級** <!-- id: 6.1 -->
    - [x] 更新 `standardWorkflow.ts` 以符合 S0-S5 結構.
    - [x] 實作 `GlobalGuard` (監測臨床惡化).
    - [x] 實作 `TransitionLogic` (支援分支 S5 PAC).

- [x] **6.2 臨床監測模擬** <!-- id: 6.2 -->
    - [x] 建立 `ClinicalMonitor` (Mock real-time vitals).
    - [x] 模擬觸發 E1 (Rollback) 情境 (Critical Status).

## Phase 7: 人機協作優化迴圈 (HITL Optimization Loop)
- [x] **7.1 修正日誌 (Correction Log)** <!-- id: 7.1 -->
    - [x] 設計 DB Schema: `AICorrection` (記錄 Field, AI Value, Human Value).
    - [x] 前端實作: CMS 評估表的「一鍵修正」與「信心標示」。

- [x] **7.2 醫師否決學習 (Override Learning)** <!-- id: 7.2 -->
    - [x] 實作 `PhysicianDashboard` (記錄警示類型, 醫師理由).
    - [x] 設計 Dashboard: 讓醫師查看自己的已否決案件。

## Phase 9: 醫院與政府系統整合 (External Integrations)
- [x] **9.1 HIS/EMR 整合** <!-- id: 9.1 -->
    - [x] 定義 FHIR 資料結構.
    - [x] 實作 EMR Modal (Case Detail).

- [x] **9.4 服務費用申報模組 (Claims Module)** <!-- id: 9.4 -->
    - [x] 定義 B/D/G 碼資料結構.
    - [x] 實作 `ClaimsDashboard` (Draft -> Review -> Submitted).

**[Product_Manager]**: 收到指令，執行最終發行 (Release) 程序。
**[Action]**:
1.  **Verification**: 執行 `npm run build` 確認建置無誤 (Exit Code 0).
2.  **Documentation**: 更新 `walkthrough.md` 至 v2.0，詳細記錄 LTC 3.0 狀態機與 HITL 功能.
3.  **Release Tag**: 標記版本 `v2.0-ltc-hitl`.
- [x] **1. Documentation Update**
- [x] Update `walkthrough.md` to reflect the latest UI changes and LTC 3.0 logic.
- [x] Document the new "Login Page" flow in the walkthrough.

### 2. Localization (i18n)
- [x] Ensure `AdminLayout` and `LoginPage` are fully localized (Traditional Chinese).
- [x] Verify no hardcoded English strings in key SaaS user flows.


## Phase 10: Line 官方帳號跨域協作 (LINE Collaboration Hub)
- [ ] **10.1 LINE 官方帳號整合** <!-- id: 10.1 -->
    - [ ] 建立 LINE OA Channel 與 Webhook 驗章機制。
    - [ ] 實作 Line Login 與病患/家屬/外部機構帳號綁定。
    - [ ] 建立 Prisma Migration：`line_accounts`, `collaboration_tasks`, `collaboration_events`, `incident_reports`。
    - [ ] 在 Supabase (staging/prod) 套用 migration，完成連線與權限驗證。

- [ ] **10.2 協作任務中心** <!-- id: 10.2 -->
    - [x] 建立任務 API 基線：建立任務、接案、完案與狀態查詢。
    - [ ] 建立外部機構接案/完案流程（Quick Reply + 任務回傳）。
    - [ ] 建立跨通道 Case Timeline（院內操作 + LINE 互動 + 外部機構回報）。

- [ ] **10.3 風險事件閉環** <!-- id: 10.3 -->
    - [ ] 家屬異常回報（跌倒/發燒/未服藥）接入風險規則。
    - [ ] 觸發紅燈警示並通知個管師/醫師，記錄稽核軌跡。

**[System]**: TERMINATE.
