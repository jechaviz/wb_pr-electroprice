# PRD - Electroprice

## 1. Overview
- Project: Electroprice
- Project Skill Path: Ecommerce.Electroprice
- Category: ecommerce / dropshipping
- Customer: BU
- Course/Context: generic
- Task: Bootstrap Electroprice in Odoo Enterprise

## 1.1 Project As Reusable Module
- Hierarchical naming contract: `<skill_n0>.<skill_n1>.<skill_n2>...<skill_nN>`
- skill_n0 (root): `Ecommerce`
- skill_n1: `Electroprice`
- skill_n2: ``
- skill_n3: ``
- Rule: each stable capability from this project must be documented as a reusable subskill path.

## 2. Problem Statement
Clone electroprice repo, create Odoo Enterprise (eCommerce), then customize for dropshipping + wholesaler integrations.

## 3. Goals
- Deliver a reproducible `playbook.yaml` that solves the target task.
- Keep workflow artifacts under `playbooks/` (`playbooks/output/`, `playbooks/js/`) plus docs.
- Complete the run with explicit task completion status.
- Convert stable task-specific logic into reusable subskills/modules.
- Execute in autonomous `solo mode` by default (end-to-end without waiting for manual prompts).

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

## 8. Acceptance Criteria
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
- Readiness report exists: `playbooks/output/readiness_report.json`.
- Growth decisions are logged when applied.


## Completion Record

- task: Bootstrap Electroprice in Odoo Enterprise
- status: completed
- completed_at: 2026-02-12 18:33:58
