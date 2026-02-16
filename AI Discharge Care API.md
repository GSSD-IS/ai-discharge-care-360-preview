根據《長照十年計畫 3.0》核定本及 SaaS 系統設計方案，該出院準備系統與外部系統的 API 介接主要分為**「政府長照行政體系」、「醫療健保體系」以及「第三方產業生態系」**三大區塊。
為了落實資料互通，所有 API 介接均須遵循 HL7 FHIR 標準與 台灣核心實作指引 (TW Core IG)。
1. 政府長照行政與核銷體系 (Government Administration APIs)
這是系統運作的核心，用於完成評估上傳、轉介派案及費用申報。
• 長照管理資訊系統 API：
    ◦ 功能：醫院出備團隊將「CMS 長照需要等級評估結果」與「簡易照顧計畫」透過此 API 上傳。
    ◦ 目的：實現「出院即轉介」，讓縣市照管中心與 A 單位（社整中心）能即時接收個案資料，達成 2030 年「0 天等待」的目標。
• 長照服務費用支付審核系統 API：
    ◦ 功能：支援長照 B 碼（照顧服務）、D 碼（交通接送）、G 碼（喘息服務）的資料上傳與檢核。
    ◦ 目的：協助醫院或合作單位申請「包裹式獎勵金」及後續服務費用申報，系統需通過衛福部的 API 驗證。
• 長照倉儲系統 (LTC Data Warehouse) 介接：
    ◦ 功能：整合來自社政、衛政、健保等 9 大系統的資料庫。
    ◦ 目的：提供決策支援數據，並作為 SDK 開放資料的基礎來源。
2. 醫療與健保體系 (Medical & NHI APIs)
旨在打破醫院與健保署之間的資訊孤島，特別是針對急症與轉銜照護。
• 在宅急症照護 (ACAH) 資料交換 API：
    ◦ 功能：與健保署系統進行每日資料交換，自動取得 ACAH 收案對象的起迄日、收案原因及團隊資訊。
    ◦ 目的：減少人工重複登打，並支援「虛擬病房」模式，讓在家接受急症照護的個案能同步調度長照資源。
• 醫院 HIS (Hospital Information System) 適配介面：
    ◦ 功能：透過 FHIR RESTful API 讀取醫院內部的電子病歷（如生命徵象、出院醫囑、護理紀錄）。
    ◦ 目的：AI 模組藉此進行自動化評估與病情惡化時的「異常阻斷」監測。
3. 第三方產業與使用者生態系 (Third-Party & User Ecosystem)
長照 3.0 強調「公私協力」與「智慧照顧」，透過開放標準介面引入民間服務。
• 長照服務軟體開發套件 (SDK)：
    ◦ 功能：衛福部規劃釋出 SDK 及相關 API，允許民間開發的 App（如健康管理、家屬聯繫 App）在民眾授權下存取長照資料（如額度、服務紀錄）。
    ◦ 目的：促進資料運用價值，讓民眾透過手機掌握服務使用情形。
• 智慧輔具租賃媒合 API：
    ◦ 功能：串接輔具租賃廠商系統，支援長照 3.0 新增的「全租賃智慧科技輔具」（如移動、沐浴、看視輔具）。
    ◦ 目的：實現線上媒合、庫存查詢與代償墊付申請，加速輔具取得速度。
• OETH 雲端身分認證 API：
    ◦ 功能：整合行動公鑰簽章（FIDO）技術。
    ◦ 目的：確保醫事人員在進行評估與計畫上傳時的身分核鑑與電子簽章法律效力，符合資安規範。
• 交通接送公版預約服務 API：
    ◦ 功能：衛福部釋出系統程式碼與 API 給地方政府。
    ◦ 目的：整合多元車隊（長照專車、通用計程車），提供即時預約與共乘媒合服務。
• LINE Messaging API / LINE Login API：
    ◦ 功能：整合 LINE 官方帳號 (OA) 作為病患、家屬與外部機構的協作入口，支援 webhook 事件接收、推播、Quick Reply 與登入綁定。
    ◦ 目的：建立「醫院端 — 家屬端 — 外部機構端」的即時協同閉環，降低跨機構溝通延遲與資訊斷點。

4. LINE 協作 API 設計補充 (Collaboration APIs)
為支援新需求，建議新增以下內部 API：

• `POST /api/line/webhook`
    ◦ 功能：接收 LINE webhook 事件 (message, postback, follow/unfollow)。
    ◦ 重點：驗證 `x-line-signature`，寫入 `collaboration_events`。

• `POST /api/line/link`
    ◦ 功能：綁定 LINE User ID 與平台身份 (patient/family/agency_member)。
    ◦ 重點：綁定需具一次性 token + 過期機制，避免冒名綁定。

• `POST /api/collaboration/tasks/:id/accept`
    ◦ 功能：外部機構接案。

• `POST /api/collaboration/tasks/:id/complete`
    ◦ 功能：外部機構回傳服務完成資訊（時間、備註、附件）。

• `POST /api/line/tasks`
    ◦ 功能：建立外部機構協作任務（如接送、居服、復能）。

• `POST /api/line/tasks/:taskId/accept`
    ◦ 功能：外部機構接案並回寫狀態。

• `POST /api/line/tasks/:taskId/complete`
    ◦ 功能：外部機構完案回傳，更新狀態與時間軸。

• `POST /api/line/incidents`
    ◦ 功能：病患/家屬/照護團隊回報異常事件（跌倒、發燒、未服藥等）。
    ◦ 重點：建立 `incident_reports` 並同步寫入 `collaboration_events`，供時間軸追蹤與警示規則判定。

• `GET /api/line/progress/:patientId`
    ◦ 功能：取得病患目前進度、下一步、關懷與隱私保護建議，供 LINE Bot 即時回覆家屬/病患。
    ◦ 重點：僅輸出必要摘要並附隱私/防入侵提醒，避免敏感資料外洩。

• `GET /api/line/timeline/:patientId`
    ◦ 功能：取得病患跨通道時間軸（院內操作紀錄 + LINE 互動 + 外部機構回報）。

建議資料表（MVP）：
- `line_accounts`：儲存 LINE 身分綁定關聯。
- `collaboration_tasks`：跨機構任務。
- `collaboration_events`：訊息與狀態事件稽核。
- `incident_reports`：病患/家屬異常回報。

總結圖表
|介接對象|關鍵 API / 系統名稱|資料流向|核心用途|
|衛福部|照管資訊系統|雙向 (上傳/接收)|CMS 評估、簡易計畫轉介、派案狀態追蹤|
|衛福部|支付審核系統|單向 (上傳)|獎勵金與服務費用 (B/D/G碼) 申報|
|健保署|ACAH 資料交換|雙向 (每日同步)|在宅急症照護個案資料同步|
|民間廠商|輔具租賃 API|雙向|智慧輔具庫存查詢、租賃媒合|
|第三方 App|長照 SDK|單向 (下載)|民眾授權下，釋出資料給健康管理 App|
|認證中心|OETH/FIDO|雙向|醫事人員身分驗證與電子簽章|
|LINE 平台|Messaging API / Login API|雙向 (事件/推播)|病患、家屬、外部機構協作與回報|
