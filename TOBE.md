# AI Discharge Care 360 - To-Be System Specification

> **Version**: 1.0.0
> **Status**: Approved for Implementation
> **Last Updated**: 2026-01-26

## 1. Executive Summary
**AI Discharge Care 360** 是一個基於 SaaS 雲端架構的智慧出院準備服務平台。旨在透過 **AI 風險篩檢**、**跨團隊協作** 與 **閉環追蹤機制**，協助多家醫療機構降低 30 天再入院率，並實現無縫的醫護-病患溝通。

核心價值：**"User Define Process, System Enforce State."**

---

## 2. System Architecture (技術架構)

### 2.1 Technology Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Custom Medical Theme).
- **Backend**: Node.js (NestJS Framework).
- **Database**: PostgreSQL (Multi-tenant via Supabase/RLS).
- **Infrastructure**: Vercel (Web) + Supabase (DB/Auth).
- **Mobile Support**: Web Portal First (RWD), Line Integration (Future).

### 2.2 SaaS Multi-Tenancy Model
- **Isolation Level**: Database Schema Integration with `tenant_id` discrimination.
- **Identity Model**: 
    - **Global User Identity**: 用戶帳號不隸屬於單一醫院，支援跨院兼職。
    - **Tenant Membership**: 透過關聯表 (`User` <-> `Tenant`) 定義該用戶在特定醫院的角色與權限。
    - **Context Switching**: 支援在導航欄即時切換執業醫院 (Context)。

---

## 3. Core Workflows (核心流程)

系統採用 **Workflow as a State Machine (WaaSM)** 架構，定義 5 大標準步驟。
每個步驟具備明確的 **【功能】** 與 **【重點】** 標示。

### Step 1: Screening (AI 風險篩檢)
- **【功能】**: 住院即時風險識別。
- **【重點】**: 
    - **Automated**: AI 或規則引擎自動計算 `Readmission Risk Score`。
    - **Alerting**: 高風險個案自動標記並通知個管師。

### Step 2: Assessment (跨團隊評估)
- **【功能】**: 跨專業資訊收集。
- **【重點】**: 
    - **Collaboration**: 護理、社工、營養、復健、藥師並行填寫。
    - **Mandatory Check**: 系統強制檢核必填評估單，否則無法進入下一階段。

### Step 3: Planning (出院計畫制定)
- **【功能】**: 資源連結與安置決策。
- **【重點】**: 
    - **Pre-discharge Readiness**: 確保輔具、長照資源、交通接送在出院前確認到位。

### Step 4: Education (個人化衛教)
- **【功能】**: 病患賦能 (Patient Empowerment)。
- **【重點】**: 
    - **Personalization**: 依據診斷 (ICD-10) 與評估結果推播對應影片/文章。
    - **Read Receipt**: 強制確認病患/家屬「已閱讀並理解」。

### Step 5: Tracking (出院後追蹤)
- **【功能】**: 出院後結果監測。
- **【重點】**: 
    - **Closed-loop**: 追蹤異常 (如跌倒、未回診) 立即回饋至醫院端，觸發再入院警示。

### Special Logic: Continuous Eligibility Check (持續資格檢核)
- **觸發**: 每日 Vitals 輸入或異常事件 (跌倒/發燒)。
- **動作**: 若病況惡化，狀態機觸發 **Auto-Rollback**。
    - 狀態從 `Discharge_Ready` 回退至 `Assessment_Review`。
    - **鎖死** 出院按鈕。
    - **通知**: Dashboard 顯示紅色警示，並在 Case Chat Timeline 寫入系統警告。

---

## 4. User Personas (用戶角色)

支援 8 大核心角色，依據 RBAC 進行權限控管。

| 類別 | 角色 (Role) | 職責與功能視圖 |
| :--- | :--- | :--- |
| **Medical Team** | **Physician (醫師)** | 醫療決策、出院計畫簽核。 |
| | **Pharmacist (藥師)** | 雲端藥歷整合、用藥指導。 |
| | **Nurse (護理師)** | 一般護理評估 (ADL)、傷口照護。 |
| | **Therapist (復建師)** | 復健潛能評估。 |
| | **Nutritionist (營養師)** | 營養篩檢 (MNA) 與指導。 |
| **Social** | **Social Worker (社工師)** | 社會心理評估、經濟補助、安置機構協調。 |
| | **Case Manager (個管師)** | **平台核心操作者**。統籌進度、管理看板 (Kanban)、處理異常警示。 |
| | **Health Educator (衛教師)**| 專責衛教內容發送與追蹤。 |
| **End User** | **Patient/Family** | 透過 Web Portal (未來 Line) 接收資訊、回報狀況。 |

*(註：以上角色可透過 Tenant Membership 在不同醫院間切換權限)*

---

## 5. Visual System (視覺規範)
- **Design System**: 繼承 `ai-discharge-care-360.zip` 風格。
- **Theme**: Medical Professional (Clean, High Contrast).
- **Colors**: Slate (Neutral), Sky (Primary), Red (Alert/Mandatory).
- **Mandatory Indicators**: 必經流程與必填欄位需以 **紅色星號 (*)** 或 **粗框** 醒目標示。

## 6. Future Roadmap (擴展規劃)
- **Line Integration**: 
    - 醫護端: Line Notify 接收警示 + Quick Reply 審核。
    - 病患端: Line Login + LIFF 查看衛教。
- **Advanced AI**: 
    - 導入 LLM 進行病歷摘要 (Discharge Summary) 自動生成。

---

## 7. New Requirement: Line 官方帳號跨域協作 (Patient / Family / External Agencies)

### 7.1 Requirement Summary
新增「Line 官方帳號協作中樞」作為病患、家屬與外部機構（如 A 單位、居服單位、復能機構、交通接送）之共同協作入口。

目標：
- 讓病患/家屬以最熟悉的通訊工具回報出院後狀態。
- 讓外部機構可在授權範圍內接收任務、回覆進度、上傳服務完成資訊。
- 讓醫院端在同一個 Case Timeline 檢視跨機構互動紀錄，形成可追蹤閉環。

### 7.2 Scope Definition
- **Channel**: Line Official Account (OA) 為唯一對外通訊入口。
- **Identity**: 支援 Line Login 與本系統病患/家屬/外部機構帳號綁定。
- **Conversation Types**:
  1. 病患/家屬 <-> 醫院照護團隊（衛教、提醒、異常回報）。
  2. 醫院照護團隊 <-> 外部機構（派案、接案、服務完成確認）。
  3. 系統 Bot 廣播（回診提醒、用藥提醒、量測提醒）。

### 7.3 Core Collaboration Flows
1. **衛教與任務推送**：出院後自動推送個人化衛教、回診提醒與每日任務（如量血壓）。
2. **異常事件回報**：家屬透過選單快速回報「跌倒 / 發燒 / 呼吸喘」，系統寫入事件並通知個管師。
3. **外部機構接案**：外部機構在 OA 接收任務卡（服務類型、時限、聯絡資訊），可一鍵回覆「已接案 / 無法承接」。
4. **服務完成回傳**：機構回傳服務完成時間、備註與附件（如服務照片/簽收），更新至 Case Timeline。
5. **升級機制**：若回報內容符合高風險條件，系統觸發紅色警示並通知院內醫師/個管師。

### 7.4 Permission & Data Governance
- 以 `tenant_id + case_id + participant_role` 控制資料可見範圍。
- 家屬僅能查看已授權病患資料；外部機構僅能查看其被派案任務內容。
- 所有 Line 互動須保留稽核軌跡（訊息時間、發送者、任務狀態變更）。
- 敏感資料最小揭露：Line 訊息預設不推送完整病歷，僅提供必要摘要與導向連結。

### 7.5 MVP Deliverables
- 建立 Line OA webhook 接收與簽章驗證。
- 建立 Line 帳號綁定流程（Patient/Family/Agency）。
- 建立 3 類 Bot 能力：通知、Quick Reply、任務狀態回覆。
- 建立外部機構任務看板（受派案件、進行中、已完成）。
- 建立跨通道 Timeline（院內系統 + Line 事件整併）。


### 7.6 Database Strategy (Line 協作資料模型)
為避免跨租戶/跨角色資料外洩，Line 協作資料採「同租戶隔離 + 事件溯源」設計：

- `line_accounts`：儲存 OA 使用者與平台身份綁定（patient/family/agency）。
- `collaboration_tasks`：跨機構派案主表（接案、完案、拒案狀態）。
- `collaboration_events`：所有訊息與狀態變更事件（可回放 Timeline）。
- `incident_reports`：家屬/病患異常回報（跌倒、發燒等），提供風險規則判定。

設計原則：
1. **Tenant First**：所有表皆帶 `tenant_id` 並建立索引，查詢必帶租戶條件。
2. **Case Binding**：以 `patient_id` 串接院內病例，保障跨通道追蹤一致性。
3. **Auditability**：關鍵互動不覆蓋更新，採事件追加，確保稽核可追溯。
4. **Minimal Disclosure**：Line 只存協作必要資訊，敏感病歷仍留在院內核心資料域。
5. **Supabase First**：資料庫先落地於 Supabase Postgres，使用 migration 版本化管理 schema。
