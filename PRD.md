# PRD - Electroprice

## 1. Overview
- Project: Electroprice
- Project Skill Path: Ecommerce.Electroprice
- Category: ecommerce / dropshipping
- Customer: BU
- Course/Context: generic
- Task: Operationalize Electroprice dropshipping on a verified user-owned Odoo instance

## 1.1 Project As Reusable Module
- Hierarchical naming contract: `<skill_n0>.<skill_n1>.<skill_n2>...<skill_nN>`
- skill_n0 (root): `Ecommerce`
- skill_n1: `Electroprice`
- skill_n2: ``
- skill_n3: ``
- Rule: each stable capability from this project must be documented as a reusable subskill path.

## 2. Problem Statement
Clone electroprice repo, create/use Odoo Enterprise (eCommerce), and customize for dropshipping + wholesaler integrations with verifiable account ownership and authenticated session identity.

## 3. Goals
- Deliver a reproducible `playbook.yaml` that solves the target task.
- Keep workflow artifacts under `playbooks/` (`playbooks/output/`, `playbooks/js/`) plus docs.
- Complete the run with explicit task completion status.
- Convert stable task-specific logic into reusable subskills/modules.
- Execute in autonomous `solo mode` by default (end-to-end without waiting for manual prompts).
- Enforce identity traceability: completion is valid only when authenticated Odoo identity is observable (`uid` + login/inbox trace).

## 4. Non-Goals
- Modifying third-party libraries unless required.
- Storing generated artifacts in framework source folders.

## 5. Functional Requirements
- Must auto-create and keep updated `PRD.md` and `SDD.md`.
- Must auto-create and keep updated `README.md`.
- Must support external JS files under `playbooks/js/`.
- Must write outputs under `playbooks/output/`.
- Must mark task completion (`TASK_STATUS.md`) at end of successful process.
- Must identify and document reusable subskills discovered during delivery.

## 5.0 Autonomous Solo Mode Contract
- Task is assigned once; runtime executes end-to-end autonomously until completion.
- Runtime only notifies progress/state; it does not depend on modal confirmations.
- Runtime can self-enrich (new subplaybooks, skills, and spec growth) to finish the assigned task.
- User can interrupt and redirect at any time.

## Autonomous Improvement Contract
- Objective-first execution with measurable progress checks at each critical transition.
- Perception-first policy: observe current state before selecting any action.
- Continuous optimization policy: each run should improve speed/reliability for the next run.
- Exactness policy: completion claims require objective artifacts, not inferred success.
- Reuse policy: stable patterns discovered during delivery must be captured as reusable skills/modules.

## 5.1 Electroprice Domain Requirements (Dropshipping)
- Storefront must sell electronics sourced from multiple wholesalers (dropshipping).
- System must keep catalog and pricing synced from wholesalers (API feeds).
- Customer checkout must create internal order workflow:
- Sales Order (customer)
- Purchase Order (supplier) or equivalent supplier request
- Inbound to warehouse (receive/quality check)
- Rebranding/packaging step (internal operation)
- Outbound shipment to customer
- System must support customer communications:
- Order confirmation
- Shipping/tracking updates
- Exceptions (out of stock, delays)

## 5.2 Odoo Requirements (Enterprise/Online)
- Must create an Odoo Enterprise/Online instance under user's account.
- Must install Odoo eCommerce module.
- Must define baseline configuration:
- Company name/branding: Electroprice
- Website storefront enabled
- Products, categories, and pricelists ready for sync
- Trial/auth email used by automation must be a usable inbox (noreply aliases are invalid).

## 5.3 Integration Requirements
- Wholesaler connectors:
- Pull products/prices/availability
- Map supplier SKUs to internal SKUs
- Place supplier orders by API
- Import supplier tracking/status updates
- Payment and accounting:
- Capture customer payment
- Record supplier payable (pay wholesaler)
- Track margin per order

## 5.4 Migration Requirement (Old -> New)
- Source reference: `C:\\git\\customers\\bu\\electroprice`.
- Goal: migrate business capability from that repository into Odoo as the new primary platform.
- Minimum parity surface to operationalize in Odoo:
- Multi-supplier catalog aggregation and price comparison semantics.
- Electronics storefront baseline with checkout flow.
- Order lifecycle visibility (customer order, supplier fulfillment, inbound/outbound statuses).
- Admin/operations visibility for pricing, stock and order execution.
- Language/currency-ready storefront behavior as Odoo configuration policy.
- Rule: parity is a temporary safety phase only; once new Odoo flow is validated, prune old/fallback paths.

## 6. Framework Growth Requirements
During delivery, framework can evolve with:
- New root skills.
- New hierarchical subskills/modules under existing root skills.
- Playbook specification extensions.
- Category expansion (`scraping`, `automation`, `testing`, others).

Each evolution must be registered in `FRAMEWORK_GROWTH.md`.

## 7. Reusable Subskills Backlog
- Record reusable capabilities with their target path and maturity.

| Path | Purpose | Maturity | Moduleized |
|---|---|---|---|
| `Ecommerce.Electroprice` | Main project capability | active | yes |
| `<skill_n0>.<skill_n1>.<skill_n2>` | Fill during implementation | draft | no |

## 8. User Acceptance Criteria (UAC)
- UAC-01: The instance is owned/operated under a verifiable authenticated user session (not anonymous/public).
- UAC-02: The trial/auth flow does not rely on noreply aliases; it uses a real accessible inbox.
- UAC-03: User can rerun `playbook.yaml` in `prod` without redoing one-time setup tasks, while routine checks still run.
- UAC-04: Final state reflects a usable Electroprice baseline in Odoo (storefront + operations + dropshipping + integration scaffolds).

## 8.1 Technical Acceptance Criteria
- Playbook executes reproducibly for env `prod`.
- `README.md`, `PRD.md`, `SDD.md`, and `TASK_STATUS.md` exist and are updated.
- Output artifacts are present in `playbooks/output/`.
- Repo sync artifact exists: `playbooks/output/electroprice_repo.sync.json`.
- Odoo instance URL captured: `playbooks/output/odoo_instance_url.txt`.
- eCommerce install checkpoint exists: `playbooks/output/odoo_ecommerce_install_checkpoint.json`.
- Operations core checkpoint exists: `playbooks/output/odoo_operations_core_checkpoint.json`.
- Dropshipping ops checkpoint exists: `playbooks/output/odoo_dropshipping_ops_checkpoint.json`.
- Branding checkpoint exists: `playbooks/output/odoo_branding_checkpoint.json`.
- Wholesaler scaffold checkpoint exists: `playbooks/output/wholesaler_integration_scaffold_checkpoint.json`.
- Legacy catalog migration checkpoint exists: `playbooks/output/odoo_legacy_migration_checkpoint.json`.
- Odoo solution bundle checkpoint exists: `playbooks/output/odoo_solution_bundle_checkpoint.json`.
- Marketplace MVP checkpoint exists: `playbooks/output/odoo_marketplace_mvp_checkpoint.json`.
- Readiness report exists: `playbooks/output/readiness_report.json`.
- Live Odoo verification exists and passes: `playbooks/output/odoo_live_verify.json` with `ok=true`.
- Live Odoo migration parity verification exists and passes: `playbooks/output/odoo_live_migration_verify.json` with `ok=true`.
- Live Odoo solution bundle verification exists and passes: `playbooks/output/odoo_live_solution_bundle_verify.json` with `ok=true`.
- Live Odoo marketplace MVP verification exists and passes: `playbooks/output/odoo_live_marketplace_mvp_verify.json` with `ok=true`.
- Auth method trace exists: `playbooks/output/odoo_auth_method.txt`.
- Auth identity trace exists: `playbooks/output/odoo_auth_identity.json`.
- Live verifier reports authenticated identity: `session_uid > 0` and `session_login` not empty.
- Growth decisions are logged when applied.


## Completion Record

- task: Operationalize Electroprice dropshipping on a verified user-owned Odoo instance
- status: completed
- completed_at: 2026-02-14 20:17:56
## Architect Intelligence Baseline (Mandatory)

- Non-negotiable baseline: act at architect-level rigor (design quality, reproducibility, pruning discipline).
- Use verified winning paths; if they fail, classify as UI drift and resolve via perception-debug cycle.
- Do not keep broad fallback permutations after one candidate is validated.
- Prefer out-of-the-box simplification hacks (for example find-in-page homing) when they reduce latency and uncertainty.


## Refactoring Trigger Policy (Mandatory)

- Trigger: file length > 600 lines => mandatory refactor before declaring completion.
- Refactor strategy: split by responsibility/class, isolate cross-cutting concerns, reduce duplication.
- For playbooks, replace giant flows with nested numbered modules.


## Online Flow Implementation Policy (Mandatory)

- Mandatory architecture: online workflows are authored as playbooks/subplaybooks, not as dedicated online AHK skills.
- Scope rule: prefer extending generic primitives (Helium/CDP/HTTP) and keep business flow orchestration in YAML.
- Migration rule: when a legacy online skill exists, keep parity only until playbook replacement is validated, then prune.



