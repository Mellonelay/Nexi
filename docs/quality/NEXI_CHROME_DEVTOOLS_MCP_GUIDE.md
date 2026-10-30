# NEXI Chrome DevTools MCP and Browser Workbench Guide

**Authority:** paired Codex session, current MCP registration and the installed Chrome DevTools MCP package. **Checked:** 2026-10-26.

Use this guide with the official upstream [`chrome-devtools` skill](https://github.com/ChromeDevTools/chrome-devtools-mcp/blob/main/skills/chrome-devtools/SKILL.md), [Chrome DevTools for agents setup](https://developer.chrome.com/docs/devtools/agents/get-started), and [Chrome DevTools extension-panel documentation](https://developer.chrome.com/docs/extensions/how-to/devtools/extend-devtools).

## Current connection

Codex attaches to the owner's existing signed-in Chrome profile at `/home/mellonelay1999/.local/share/nexi-admin-browser-acceptance` with:

```text
--autoConnect
--userDataDir /home/mellonelay1999/.local/share/nexi-admin-browser-acceptance
--categoryExtensions
--experimentalIncludeAllPages=true
--categoryEmulation=false
```

`--userDataDir` makes the MCP read the current CDP port and WebSocket path from that profile's `DevToolsActivePort`. The currently observed file says port `9222`; this value can change. Do not hardcode it. The `localhost:9222` and `localhost:9229` rows in `chrome://inspect/#devices` are Chrome DevTools target-discovery settings; they do not configure Codex's MCP client. Do not change them to 5858. The old 5858 MCP target and Polypane/5859 route are retired for NEXI.

After changing MCP flags, restart Codex to reload its server process. Then verify with `codex mcp get chrome-devtools`, `list_pages`, and an extension-tool listing call. A saved configuration or successful server startup alone does not prove browser attachment.

The Chrome DevTools MCP package installed at the time of this inventory is **1.11.0**. The official upstream skill was copied from `ChromeDevTools/chrome-devtools-mcp` `main` at `skills/chrome-devtools/SKILL.md`; installed SHA-256: `69a65d0276dd2b6a2fff9889d45be154754b7eb589ca019346cdc9319e6439bb`. Do not update the MCP package merely because a newer release is advertised; the server version and available actions can change independently of the installed skill.

## Actions exposed in this Codex session

The restarted Codex session exposes **35 actions**: the 30 base actions listed below plus five extension actions. Tool schemas are authoritative and may vary by server version/configuration.

| Purpose | Exposed actions |
|---|---|
| Find and navigate pages | `list_pages`, `select_page`, `navigate_page`, `new_page`, `close_page`, `wait_for` |
| Read page structure and appearance | `take_snapshot`, `take_screenshot`, `get_css_styles`, `evaluate_script`, `screencast_start`, `screencast_stop` |
| Inspect console and network | `list_console_messages`, `get_console_message`, `list_network_requests`, `get_network_request` |
| Interact with page controls | `click`, `fill`, `fill_form`, `hover`, `press_key`, `type_text`, `drag`, `handle_dialog`, `upload_file` |
| Audit/profile | `lighthouse_audit`, `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `take_heapsnapshot` |

The saved configuration now adds `--categoryExtensions`. The installed 1.11.0 package defines these **five additional extension actions**, which require a Codex/MCP restart and fresh tool inventory before they can be claimed available:

| Extension action | Effect and safe use |
|---|---|
| `list_extensions` | Read-only inventory of **unpacked extensions only** in the installed MCP implementation. It may return no entries even when Chrome Web Store extensions are installed; do not use it to determine whether MetaMask is installed. |
| `trigger_extension_action` | Opens the extension's default action; may open a popup or side panel and changes browser UI state. Use only when needed and authorized. |
| `install_extension` | Installs an unpacked extension from disk; mutating. Do not use for routine browser testing. |
| `reload_extension` | Reloads an unpacked extension; mutating and may interrupt its state. Do not use unless specifically required and authorized. |
| `uninstall_extension` | Removes an extension; mutating. Do not use for routine browser testing. |

`evaluate_script` may target a listed page with `pageId`. With extension tooling enabled, the schema may also support `serviceWorkerId` for a specific extension service worker. Do not inspect secret storage, wallet internals, credentials, cookies, authorization headers, seed phrases, or private keys.

## Standard page workflow

1. Call `list_pages`; confirm the existing page's origin/title and select its fresh `pageId`. Preserve the owner's profile and unrelated tabs.
2. Call `take_snapshot` before UID-based interactions. Use `wait_for` for a specific expected page state; after navigation or DOM change, take a new snapshot because element UIDs expire.
3. Prefer `take_snapshot` for accessible structure, `take_screenshot` for visual evidence, `get_css_styles` for matched rules/cascade, and small read-only `evaluate_script` calls only for information those tools do not expose.
4. For runtime problems, use `list_console_messages` and filtered `list_network_requests`. Call `get_console_message` or `get_network_request` only for the specific item needed. Network request details can include cookies, authorization, or personal payloads; do not copy those fields into reports.
5. Use performance tracing only for a stated performance question. A Lighthouse snapshot is an audit result, not proof of business behavior. Heap snapshots may contain application data and require a specific memory-investigation need.
6. Page actions can change application state. Before `click`, `fill`, `press_key`, `type_text`, `handle_dialog`, `upload_file`, navigation, or closing a page, identify the target and expected effect. Do not submit financial or identity mutations during a read-only visual audit.

## Using Chrome DevTools tabs in the browser

Chrome DevTools is a separate workbench UI. In the screenshot supplied by the owner, its main tabs include **Elements**, **Console**, **Sources**, and the `»` overflow menu; that menu exposes additional built-in and extension-provided panels. The screenshot shows **Recorder**, **Requestly**, **Accessibility Toolkit**, **Components**, **Profiler**, and **Suspense** there.

Choose the panel for a concrete question:

| DevTools panel | Use |
|---|---|
| Elements | Inspect selected DOM nodes, layout, and computed styles. Pair with MCP snapshots/CSS tools when you need page-scoped evidence. |
| Console | Inspect runtime errors and warnings. Prefer MCP console tools for a concise report. |
| Sources | Set breakpoints and inspect loaded sources when debugging a specific code path. |
| Network | Enable Preserve log and filter Fetch/XHR to trace a specific user action. Record endpoint/status/timing; avoid copying sensitive headers and bodies. |
| Performance / Memory | Record a scoped trace or heap snapshot only for an actual performance or memory question. |
| Application / Security | Use only for a relevant storage/security question; never read session credentials, cookies, or wallet secrets. |
| Recorder | Capture/replay a specific browser interaction when a reproducible flow is needed; inspect the steps before replaying because they may submit forms. |
| React Components / Profiler / Suspense | Use the React DevTools panels for component ownership, props/state, render profiling, or Suspense diagnostics. These are extension panels, not MCP tools. |
| Accessibility Toolkit | Use for a concrete accessibility inspection. It complements, but does not replace, the page accessibility snapshot or an audit. |
| Requestly | Use only when a specifically authorized request override/interception is needed. Rules can alter network behavior; do not leave persistent rules enabled after a test. |

The overflow `»` menu is how the owner can select a hidden DevTools panel in the Chrome UI. Chrome extensions can add panels and sidebars through `chrome.devtools.panels`; their panels run as separate extension pages. Selecting a DevTools tab does **not** select a website target for MCP calls. Always identify the website separately with `list_pages` and `select_page`. The MCP's `--categoryExtensions` actions manage/list/trigger browser extensions; they are distinct from clicking extension-created DevTools panels.

## MetaMask and extension side panels

The MetaMask panel shown beside DevTools in the owner's screenshot is Chrome extension UI, not the NEXI page DOM. It may not appear as a normal website page. In the current profile, `list_pages` exposed MetaMask's offscreen page and service worker, while `list_extensions` returned “No extensions installed”; the installed MCP implementation queries Chrome's `Extensions.getExtensions` protocol method, which reports unpacked extensions. That response does **not** mean the profile lacks store-installed extensions. If a wallet prompt is not exposed as a page, do not navigate directly to a `chrome-extension://` URL or claim it was inspected through MCP. The owner may approve the visible NEXI SIWE sign-in after checking the live site origin, account, chain, domain/URI, nonce, and message. Reject transactions, spending approvals, unrelated typed-data, and unexpected requests. First-time authentication can create identity/session state, so it is an authorized identity action rather than a side-effect-free check.

`trigger_extension_action` may open an extension popup or side panel; after using it, re-run `list_pages` and take a fresh snapshot only for a target the MCP actually exposes. If the side panel remains visible only in Chrome UI, use the paired browser interface for owner approval and record that MCP did not expose the prompt. Do not request or record secrets, signatures, account internals, or wallet storage.

## Current observed inventory and reload boundary

After the owner enabled Chrome remote debugging, `list_pages` connected to the existing profile and showed the NEXI Admin and Public tabs, CodeScene, plus MetaMask extension targets. A direct CDP `Browser.getVersion` request returned Chrome 155.0.8059.84. `list_extensions` returned no entries; in this MCP version that only means no unpacked extensions were reported. The session currently exposes all 35 actions in the inventory above, including the five extension actions. After changing MCP flags, restart Codex and verify the live tool list and `list_pages` again; configuration alone does not prove attachment.
