# Electroprice

## Purpose
- Project: `Electroprice`
- Skill path: `Ecommerce.Electroprice`
- Category: `ecommerce/dropshipping`
- Customer: `BU`
- Task: `Operationalize Electroprice dropshipping on a verified user-owned Odoo instance`
- Migration target: move capabilities from `C:\git\customers\bu\electroprice` into Odoo-native execution.

## Solo Mode Contract
- WAIBA runs this project in autonomous `solo mode` by default.
- Once task is assigned, execution continues end-to-end until completion.
- Runtime emits progress notifications; it should not block on manual confirmation popups.
- During execution, WAIBA can create/refine subplaybooks and reusable skills to finish the task.
- User can interrupt and redirect at any moment.
- Lifecycle marking:
  - `once` steps (create/configure/migrate) are persisted in `playbooks/output/step_once.yml` after verification.
  - `routine` steps (session/health/validation) remain always runnable.

## Autonomy Doctrine (Mandatory)
- Doctrine source of truth: `AUTONOMY.md` (required artifact).
- Perception before action: observe first (DOM/UI/OCR/vision), then act.
- Steps are successful only when objective-linked postconditions are verified.
- Every run must leave reusable learning (improved paths, playbook upgrades, or skill extraction).
- Governance model: no manual prompts by default; user steers via interruption/redirection.

## Project Layout
- `playbook.yaml`: root orchestrator.
- `playbooks/NN_topic/NN_subtopic/playbook.yml`: modular workflow tree.
- `playbooks/js/`: injected scripts.
- `playbooks/output/`: runtime artifacts/evidence.
- `PRD.md`: product requirements.
- `SDD.md`: software design.
- `TASK_STATUS.md`: completion status.
- `FRAMEWORK_GROWTH.md`: framework evolution log.
- `secrets.yml`: project-local secrets (auto-created on bootstrap if missing).

## Reusable Playbook Imports
- Reusable Odoo online phases live in the migrated WAIBA shared playbook library (`WAIBA_PLAYBOOK_LIB_DIR`, default `C:\\git\\wb_pr\\_shared`) and are imported by this project:
  - `C:\\git\\wb_pr\\_shared\\ecommerce\\odoo-online-playbooks\\playbooks\\01_trial_provision\\playbook.yml`
  - `C:\\git\\wb_pr\\_shared\\ecommerce\\odoo-online-playbooks\\playbooks\\02_instance_configure\\playbook.yml`
  - `C:\\git\\wb_pr\\_shared\\odoo\\odoo-rpc-playbooks\\playbooks\\01_modules_ensure\\playbook.yml`
  - `C:\\git\\wb_pr\\_shared\\odoo\\odoo-rpc-playbooks\\playbooks\\02_branding_apply\\playbook.yml`
  - `C:\\git\\wb_pr\\_shared\\odoo\\odoo-rpc-playbooks\\playbooks\\03_baseline_verify\\playbook.yml`
- Project wrappers (case-use import points):
  - `playbooks/02_task/02_odoo/01_trial_provision/playbook.yml`
  - `playbooks/02_task/02_odoo/02_instance_configure/playbook.yml`
- Electroprice keeps only case-specific logic in project scope (dropshipping business specifics, project UI, custom server actions/scripts).

## Odoo Migration Scope
- Build the new Odoo-native platform by migrating useful behavior from the old stack:
- eCommerce storefront enabled.
- Core operations modules installed (sales/purchase/inventory/accounting/website).
- Dropshipping module and route baseline enabled.
- Branding baseline set to Electroprice.
- Legacy Electroprice catalog baseline seeded into Odoo (`ELECTRO-*` product codes + suppliers).
- Odoo solution bundle applied:
  - Configuration layer
  - Server actions layer
  - Frontend catalog layer
- Marketplace MVP layer applied:
  - Global suppliers (China + Amazon-style sourcing)
  - Marketplace channels (Shopee/MercadoLibre/Amazon style)
  - Shipping carriers and channel pricelists
  - Carrier tracking URL baseline
  - Customer portal pages (`/my/electroprice-dashboard`, `/track-order`)
  - Logistics workflow params for dropship -> rebrand -> redispatch
  - Connector parameter registry for API orchestration
  - UI interstitial guard (Helium-native, no JS inline): resolves `website/configurator` and probes `Activación pendiente`
- Live baseline verification artifact generated (`playbooks/output/odoo_live_verify.json`).
- Live migration parity verification artifact generated (`playbooks/output/odoo_live_migration_verify.json`).
- Live solution bundle verification artifact generated (`playbooks/output/odoo_live_solution_bundle_verify.json`).
- Live marketplace MVP verification artifact generated (`playbooks/output/odoo_live_marketplace_mvp_verify.json`).

## Run
```powershell
& "C:\Program Files\AutoHotkey\v2\AutoHotkey64.exe" `
  C:\Users\jecha\.waiba\src\automation\waiba.ahk `
  run C:\git\wb_pr\projects\BU\electroprice\playbook.yaml prod
```

## Secrets
- `secrets.yml` is auto-created in project root on bootstrap if it does not exist.
- Fill only required keys for autonomous auth/trial:
  - `odoo.login_email`
  - `odoo.login_password`
  - `odoo.trial_email`
  - `odoo.trial_phone`
- `odoo.trial_email` must be a real accessible inbox (noreply aliases are rejected by policy).

## Autonomous Trial Variables
- `AUTONOMOUS_MODE`: `true` to avoid blocking prompts.
- `ODOO_INSTANCE_ALIAS_BASE`: expected subdomain base (default `electroprice`).
- `ODOO_LOGIN_EMAIL`: optional Odoo login email for autonomous sign-in at `/web/login`.
- `ODOO_LOGIN_PASSWORD`: optional Odoo login password for autonomous sign-in.
- `TRIAL_CONTACT_NAME`, `TRIAL_COMPANY_NAME`, `TRIAL_EMAIL`, `TRIAL_PHONE`: optional autofill values for trial forms.

## Current Blocker
- No active blocker registered. If Odoo UI or anti-spam flow drifts, runtime must re-enter debug/evidence mode and refresh winning paths.


## Architect Profile Contract (Mandatory)

- Source of truth: ARCHITECT_PROFILE.md (mandatory artifact).
- This project must enforce architect-level rigor as runtime policy, not optional guidance.
- If a previously learned winning UI path fails, treat it as UI-change/anti-spam drift and enter debug evidence mode.
- Innovation doctrine is mandatory: prefer simplification hacks and deep mechanism understanding over brute-force fallback.


## File Size Governance (Mandatory)

- Hard limit: any source/doc/playbook file over 600 lines must be refactored before merge.
- Refactor objective: maximize SoC + DRY + SOLID + lower cognitive and algorithmic complexity.
- Playbooks must be nested and numbered (playbooks/NN_topic/NN_subtopic/playbook.yml).


## Online Workflow Boundary (Mandatory)

- Hard policy: online business workflows (signup/login/activation/configurators/SaaS state changes) must be implemented in project playbooks/subplaybooks.
- AHK skills may provide generic runtime primitives only (Browser/CDP/Helium/HTTP/etc), not vertical online flow ownership.
- If an online flow appears as a dedicated AHK skill, migrate it to playbooks first, then prune the skill path.
