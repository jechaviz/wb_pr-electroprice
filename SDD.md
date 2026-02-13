# SDD - Electroprice

## 1. Architecture Summary
- Runtime: WAIBA src (V3)
- Execution model: YAML playbook interpreted by `OrchestratorV3.ahk`
- Core layers: `core`, `playbook`, `actions`, `skills`

## 2. Project Structure
- `playbook.yaml`: root orchestration flow
- `playbooks/{task}/{subtask}/playbook.yml`: modular execution tree
- `playbooks/js/`: JavaScript snippets injected/executed during runtime
- `playbooks/output/`: execution artifacts and debug snapshots
- `PRD.md`: product requirements
- `SDD.md`: design decisions
- `TASK_STATUS.md`: completion signal

## 3. Hierarchical Skill Contract
- Naming convention: `<skill_n0>.<skill_n1>.<skill_n2>...<skill_nN>`
- Project capability path: `Ecommerce.Electroprice`
- skill_n0 (root): `Ecommerce`
- skill_n1: `Electroprice`
- skill_n2: ``
- skill_n3: ``

### 3.1 Runtime Dispatch Convention
- `skill_n0` selects the root skill class in `SkillGateway`.
- Remaining segments are mapped to action granularity.
- Current mapper composes method name as `skill_n1_skill_n2_..._skill_nN`.
- Recommended for reusable modules: at least 3 levels (`n0.n1.n2`).

## 4. Control Flow Design
- Root playbook coordinates module execution in deterministic order.
- Bootstrap modules validate docs/scaffold and runtime state.
- Task modules execute target logic.
- Finalization module marks task as completed.

## 4.0 Autonomous Execution Model (Solo Mode)
- Default operating mode is autonomous: assigned tasks execute end-to-end without manual confirmation dialogs.
- Runtime sends progress notifications for observability.
- Runtime can self-extend with new subplaybooks/skills/spec updates to complete delivery.
- User governs strategy by interruption/redirection, not by per-step approval popups.

## 4.1 Target System Architecture (Electroprice)
The intended end-state is a dropshipping ecommerce system with Odoo as the operational core.

Core components:
- Odoo Enterprise/Online (SaaS): storefront + sales/purchase/inventory/accounting.
- Wholesaler connectors: catalog sync + order placement + shipment updates (API integrations).
- Warehouse operations: inbound receiving, rebranding/packaging, outbound shipping.

Optional components (depends on final strategy):
- Electroprice web app (repo `C:\\git\\customers\\bu\\electroprice`): price comparison UI and/or custom storefront.
- Supabase: user/auth/catalog enrichment if Electroprice app remains separate from Odoo website.

High-level flow:
- Supplier feeds -> connector -> Odoo products/pricelists/stock
- Customer checkout -> Odoo Sales Order
- SO triggers supplier procurement -> connector -> supplier order API
- Supplier shipment -> connector -> Odoo receipt + tracking
- Warehouse rebranding -> Odoo internal operation -> ship to customer

### 4.2 Implemented Playbook Modules
- `playbooks/odoo/apps/install_ecommerce/playbook.yml`
- `playbooks/odoo/apps/install_operations_core/playbook.yml`
- `playbooks/odoo/config/branding/playbook.yml`
- `playbooks/odoo/config/dropshipping_ops/playbook.yml`
- `playbooks/integration/wholesalers/scaffold/playbook.yml`
- `playbooks/finalize/validate/playbook.yml`

## 5. Skill Usage Strategy
Prefer generic skills:
- `Browser.*`
- `CDP.*`
- `FS.*`
- `Framework.*`
- Hierarchical project modules under root skills (for example `Udemy.TakeCourse.*`).

Use domain skills (for example `Udemy.*` legacy actions) only for compatibility.

## 6. Reusable Subskills Mapping
- Document each stable capability discovered in implementation:
- Path
- Owner module
- Required inputs
- Produced outputs
- Reliability notes

| Path | Inputs | Outputs | Reusable |
|---|---|---|---|
| `Ecommerce.Electroprice` | project-specific | project-specific | yes |
| `<skill_n0>.<skill_n1>.<skill_n2>` | define | define | pending |

## 7. Extensibility Plan
Framework growth can include:
- New root skills.
- New reusable subskills under existing root skills.
- OpenAPI playbook contract expansion.
- New categories and reusable templates.

Record each change in `FRAMEWORK_GROWTH.md`.

## 8. Complexity and Reliability
- Keep loops bounded (`MAX_UNITS`).
- Use explicit break/continue control.
- Persist intermediate artifacts when useful for debugging.

## 9. Definition of Done
- Task flow reaches completion marker step.
- `TASK_STATUS.md` written with status `completed`.
- `README.md` exists and is aligned with runtime contract.
- Required artifacts are generated in project scope.
- Reusable subskill decisions are reflected in `PRD.md` and `SDD.md`.


## Completion Record

- task: Bootstrap Electroprice in Odoo Enterprise
- status: completed
- completed_at: 2026-02-12 18:33:58
