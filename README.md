# Electroprice

## Purpose
- Project: `Electroprice`
- Skill path: `Ecommerce.Electroprice`
- Category: `ecommerce/dropshipping`
- Customer: `BU`
- Task: `Operationalize Electroprice dropshipping baseline on Odoo`
- Migration target: move capabilities from `C:\git\customers\bu\electroprice` into Odoo-native execution.

## Solo Mode Contract
- WAIBA runs this project in autonomous `solo mode` by default.
- Once task is assigned, execution continues end-to-end until completion.
- Runtime emits progress notifications; it should not block on manual confirmation popups.
- During execution, WAIBA can create/refine subplaybooks and reusable skills to finish the task.
- User can interrupt and redirect at any moment.

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
