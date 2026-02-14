# Electroprice

## Purpose
- Project: `Electroprice`
- Skill path: `Ecommerce.Electroprice`
- Category: `ecommerce/dropshipping`
- Customer: `BU`
- Task: `Operationalize Electroprice dropshipping baseline on Odoo`

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
- Runtime reaches `https://www.odoo.com/web/login` and detects required fields `login` + `password`.
- Without `ODOO_LOGIN_EMAIL` and `ODOO_LOGIN_PASSWORD`, autonomous flow cannot continue to provision `*.odoo.com`.
- Diagnostics are persisted to:
  - `playbooks/output/odoo_trial_autonomous_diagnostics.json`
  - `playbooks/output/odoo_instance_url_error.json`


## Architect Profile Contract (Mandatory)

- Source of truth: ARCHITECT_PROFILE.md (mandatory artifact).
- This project must enforce architect-level rigor as runtime policy, not optional guidance.
- If a previously learned winning UI path fails, treat it as UI-change/anti-spam drift and enter debug evidence mode.
- Innovation doctrine is mandatory: prefer simplification hacks and deep mechanism understanding over brute-force fallback.


## File Size Governance (Mandatory)

- Hard limit: any source/doc/playbook file over 600 lines must be refactored before merge.
- Refactor objective: maximize SoC + DRY + SOLID + lower cognitive and algorithmic complexity.
- Playbooks must be nested and numbered (playbooks/NN_topic/NN_subtopic/playbook.yml).
