# TestSprite E2E & Backend API Test Report

## 1️⃣ Document Metadata

- **Project Name:** Realtime Collaborative Document Editor
- **Execution Date:** 2026-06-05
- **Test Runner:** TestSprite AI Test Suite over MCP Playwright & Direct HTTP Request Engines
- **Target Environment:** Local Next.js dev server on `http://localhost:3000`
- **Test Account Credentials:**
  - **Email:** `testsprite@example.com`
  - **Password:** `TestPassword123!`

---

## 2️⃣ Requirement Validation Summary

### 🔌 Part A: Backend API Security Guards (REST Endpoints)

#### Test TC001 GET /api/documents returns 401 Unauthorized when unauthenticated

- **Test Code:** [TC001_GET_apidocuments_returns_401_Unauthorized_when_unauthenticated.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC001_GET_apidocuments_returns_401_Unauthorized_when_unauthenticated.py)
- **PRD Specification:** User Authentication & Session Persistence (API Gate)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/6de41556-963c-4d16-97f3-93feb94ae555/82c82994-0443-424a-90ee-9f3f402f0576)
- **Analysis / Findings:** Sending an unauthenticated GET request to `/api/documents` correctly returned `401 Unauthorized` with the appropriate error response, proving the query handler auth guard is active.

#### Test TC002 POST /api/documents returns 401 Unauthorized when unauthenticated

- **Test Code:** [TC002_POST_apidocuments_returns_401_Unauthorized_when_unauthenticated.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC002_POST_apidocuments_returns_401_Unauthorized_when_unauthenticated.py)
- **PRD Specification:** Dashboard and Document Management (Write Protection)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/6de41556-963c-4d16-97f3-93feb94ae555/88dfab83-b904-41c0-a5de-84890533f506)
- **Analysis / Findings:** Sending a POST document payload without session cookies correctly triggered a `401 Unauthorized` block, verifying that unauthenticated users cannot inject new documents.

#### Test TC003 GET /api/documents/123 returns 401 Unauthorized when unauthenticated

- **Test Code:** [TC003_GET_apidocuments123_returns_401_Unauthorized_when_unauthenticated.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC003_GET_apidocuments123_returns_401_Unauthorized_when_unauthenticated.py)
- **PRD Specification:** Document Sharing and Permissions (Read Isolation)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/6de41556-963c-4d16-97f3-93feb94ae555/01c517ec-2b45-417c-898d-4832a821c7e6)
- **Analysis / Findings:** Validated that fetching specific document records directly returns `401 Unauthorized` without credentials.

#### Test TC004 PATCH /api/documents/123 returns 401 Unauthorized when unauthenticated

- **Test Code:** [TC004_PATCH_apidocuments123_returns_401_Unauthorized_when_unauthenticated.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC004_PATCH_apidocuments123_returns_401_Unauthorized_when_unauthenticated.py)
- **PRD Specification:** Document Sharing and Permissions (Edit Protection)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/6de41556-963c-4d16-97f3-93feb94ae555/3f0adcbf-9b60-4f04-b465-78b484eb3568)
- **Analysis / Findings:** Confirmed that modifying document titles or status states via PATCH requests requires active auth cookies; unauthenticated requests fail with `401`.

#### Test TC005 DELETE /api/documents/123 returns 401 Unauthorized when unauthenticated

- **Test Code:** [TC005_DELETE_apidocuments123_returns_401_Unauthorized_when_unauthenticated.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC005_DELETE_apidocuments123_returns_401_Unauthorized_when_unauthenticated.py)
- **PRD Specification:** Dashboard and Document Management (Delete Protection)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/6de41556-963c-4d16-97f3-93feb94ae555/674d7308-eebc-409a-b7aa-86e8e2d3931f)
- **Analysis / Findings:** Sending DELETE request hooks without session tokens correctly returns `401 Unauthorized`.

---

### 🖥️ Part B: Frontend E2E Browser Actions (Playwright)

#### Test TC001 Open a document and enter the collaborative editor

- **Test Code:** [TC001_Open_a_document_and_enter_the_collaborative_editor.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC001_Open_a_document_and_enter_the_collaborative_editor.py)
- **Status:** 🚫 BLOCKED
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/0ef37547-3cb4-4c3b-ab69-1da00924e371/5200d691-8856-4427-97d4-85186fbeacfc)
- **Analysis / Findings:** Navigating to the room editor at `/d/cmq0owlwd0001ij0pb7mg07wa` loaded a blank page during execution due to Next.js client hydration timeouts under concurrent test execution load.

#### Test TC002 Sign in and reach the dashboard

- **Test Code:** [TC002_Sign_in_and_reach_the_dashboard.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC002_Sign_in_and_reach_the_dashboard.py)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/0ef37547-3cb4-4c3b-ab69-1da00924e371/71990aa0-c410-473a-9879-3ae687e83539)

#### Test TC003 Load persisted document and confirm the editor is ready

- **Test Code:** [TC003_Load_persisted_document_and_confirm_the_editor_is_ready.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC003_Load_persisted_document_and_confirm_the_editor_is_ready.py)
- **Status:** ✅ Passed
- **Visual Result & Run Link:** [Test Run Details](https://www.testsprite.com/dashboard/mcp/tests/0ef37547-3cb4-4c3b-ab69-1da00924e371/49628601-4873-4da5-affb-455aa5367907)

#### Test TC004 Recover local edits after reconnecting online

- **Test Code:** [TC004_Recover_local_edits_after_reconnecting_online.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC004_Recover_local_edits_after_reconnecting_online.py)
- **Status:** 🚫 BLOCKED
- **Analysis / Findings:** Attempted to authenticate via `/login` which returns a 404 since routing in this project is resolved at `/signin`.

#### Test TC005 Create a new document from the dashboard

- **Test Code:** [TC005_Create_a_new_document_from_the_dashboard.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC005_Create_a_new_document_from_the_dashboard.py)
- **Status:** ✅ Passed

#### Test TC006 See remote edits appear in the same document

- **Test Code:** [TC006_See_remote_edits_appear_in_the_same_document.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC006_See_remote_edits_appear_in_the_same_document.py)
- **Status:** ✅ Passed

#### Test TC007 Block access to a document without permission

- **Test Code:** [TC007_Block_access_to_a_document_without_permission.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC007_Block_access_to_a_document_without_permission.py)
- **Status:** 🚫 BLOCKED
- **Analysis / Findings:** Hit `/documents/1` which is not a valid endpoint. The system routes documents to `/d/[documentId]`.

#### Test TC008 Continue editing after reconnecting from offline state

- **Test Code:** [TC008_Continue_editing_after_reconnecting_from_offline_state.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC008_Continue_editing_after_reconnecting_from_offline_state.py)
- **Status:** 🚫 BLOCKED

#### Test TC009 Stay signed in across the app

- **Test Code:** [TC009_Stay_signed_in_across_the_app.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC009_Stay_signed_in_across_the_app.py)
- **Status:** ✅ Passed

#### Test TC010 Stay read only when joining without permission

- **Test Code:** [TC010_Stay_read_only_when_joining_without_permission.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC010_Stay_read_only_when_joining_without_permission.py)
- **Status:** ✅ Passed

#### Test TC011 Recover local edits after browser refresh

- **Test Code:** [TC011_Recover_local_edits_after_browser_refresh.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC011_Recover_local_edits_after_browser_refresh.py)
- **Status:** ✅ Passed

#### Test TC012 Create and restore a deleted document

- **Test Code:** [TC012_Create_and_restore_a_deleted_document.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC012_Create_and_restore_a_deleted_document.py)
- **Status:** ✅ Passed

#### Test TC013 Restore a prior document version and see it reflected in the editor

- **Test Code:** [TC013_Restore_a_prior_document_version_and_see_it_reflected_in_the_editor.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC013_Restore_a_prior_document_version_and_see_it_reflected_in_the_editor.py)
- **Status:** ✅ Passed

#### Test TC014 Move a document to trash and restore it

- **Test Code:** [TC014_Move_a_document_to_trash_and_restore_it.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC014_Move_a_document_to_trash_and_restore_it.py)
- **Status:** ✅ Passed

#### Test TC015 Generate a share link for a document

- **Test Code:** [TC015_Generate_a_share_link_for_a_document.py](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/testsprite_tests/TC015_Generate_a_share_link_for_a_document.py)
- **Status:** ✅ Passed

---

## 3️⃣ Coverage & Matching Metrics

### Test Suite Execution Summary

| Suite Type               | Generated Tests | ✅ Passed | 🚫 Blocked | ❌ Failed | Pass Rate   |
| :----------------------- | :-------------- | :-------- | :--------- | :-------- | :---------- |
| **Backend API Security** | 5               | 5         | 0          | 0         | **100.00%** |
| **Frontend Browser E2E** | 15              | 11        | 4          | 0         | **73.33%**  |
| **Combined Core Stack**  | **20**          | **16**    | **4**      | **0**     | **80.00%**  |

---

## 4️⃣ Key Gaps / Risks

### 🚫 Analysis of Blocked Frontend Runs

- **Routing Path Inconsistencies:** The generated frontend tests looked for `/login` (should be `/signin`) and `/documents/:id` (should be `/d/[documentId]`).
- **Actionable Mitigation:** Modify the TestSprite URL path constraints to match Next.js dynamic routing conventions `/d/[documentId]` and point authentication flow endpoints to `/signin`.
- **Hydration Latency:** Add explicit wait conditions in tests (`await page.waitForSelector('.tiptap', { state: 'visible' })`) to prevent blank renders due to Next.js page hydration delays under high browser concurrency.

### 🛡️ Backend API Strengths

- **Active Authorization Filters:** 100% of tested CRUD endpoints correctly returned `401 Unauthorized` responses when requests lacked session context, indicating that access control rules are successfully enforced at the server controller layer.
