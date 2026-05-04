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

## Perception -> Decision -> Action Architecture
- Perception stack:
  - DOM/state inspection (fast path)
  - UI-state probes (focus/hover/interactable)
  - OCR fallback with bounding boxes
  - Vision reasoning fallback for ambiguous screens
- Decision policy:
  - rank candidate actions by expected objective progress, reliability, risk, and time cost
  - execute best candidate first, then fallback candidates if unconfirmed
- Verification policy:
  - success = verified postcondition delta (URL/DOM/form state/navigation), not only return flags
- Learning policy:
  - persist successful trajectories/failures and promote stable patterns to reusable skills.

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
- `playbooks/02_task/01_execute/playbook.yml` (orquestador limpio)
- `playbooks/02_task/02_odoo/01_trial_provision/playbook.yml` (wrapper/import de reusable trial provision)
- `playbooks/02_task/02_odoo/02_instance_configure/playbook.yml` (wrapper/import de reusable instance configure)
- `playbooks/02_task/02_odoo/03_apps_install_ecommerce/playbook.yml`
- `playbooks/02_task/02_odoo/04_apps_install_operations_core/playbook.yml`
- `playbooks/02_task/02_odoo/05_config_branding/playbook.yml`
- `playbooks/02_task/02_odoo/06_config_dropshipping_ops/playbook.yml`
- `playbooks/02_task/03_integration/01_wholesalers_scaffold/playbook.yml`
- `playbooks/03_finalize/01_validate/playbook.yml`

Reusable source bundle location:
- `WAIBA_PLAYBOOK_LIB_DIR` defaults to `C:\\git\\wb_pr\\_shared`.
- `C:\\git\\wb_pr\\_shared\\ecommerce\\odoo-online-playbooks\\playbooks\\01_trial_provision\\playbook.yml`
- `C:\\git\\wb_pr\\_shared\\ecommerce\\odoo-online-playbooks\\playbooks\\02_instance_configure\\playbook.yml`
- `C:\\git\\wb_pr\\_shared\\odoo\\odoo-rpc-playbooks\\playbooks\\01_modules_ensure\\playbook.yml`
- `C:\\git\\wb_pr\\_shared\\odoo\\odoo-rpc-playbooks\\playbooks\\02_branding_apply\\playbook.yml`
- `C:\\git\\wb_pr\\_shared\\odoo\\odoo-rpc-playbooks\\playbooks\\03_baseline_verify\\playbook.yml`

### 4.3 Old-to-New Migration Mapping
- Legacy source: `C:\\git\\customers\\bu\\electroprice`.
- Mapping doctrine: migrate business capability to Odoo-native primitives and retire old-path dependencies after validation.

Parity mapping:
- Product comparison and supplier visibility -> Odoo products + supplierinfo + pricelists + connector-imported prices.
- Checkout/cart flow -> Odoo eCommerce (`website_sale`) + Sales Orders.
- Supplier fulfillment semantics -> Odoo Purchase + Inventory + Dropshipping route.
- Status visibility -> Odoo order/picking states and tracking fields.
- Admin control plane -> Odoo backend views/reports instead of custom React admin pages.

Validation mechanism:
- Runtime executes live JSON-RPC verification in current authenticated Odoo session.
- Verification artifact: `playbooks/output/odoo_live_verify.json`.

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

- task: Operationalize Electroprice dropshipping on a verified user-owned Odoo instance
- status: completed
- completed_at: 2026-02-14 09:18:00


## Architect-Level Runtime Constraints (Mandatory)

- Runtime must enforce strict learned-candidate replay before trying broader fallbacks.
- Runtime must auto-record evidence and fail-fast on learned-path regressions (UI changed).
- Policy and execution behavior from ARCHITECT_PROFILE.md are mandatory and non-ignorable.
- Decision engine must include simplification and deep-internals heuristics before escalating to expensive vision/OCR paths.


## Structural Decomposition Policy (Mandatory)

- Hard decomposition threshold: any file > 600 lines triggers decomposition.
- Apply OOP/AOP/SoC/SOLID/DRY and design patterns to lower maintenance and time complexity.
- Prefer one-class-per-file (except thin facades) and explicit module boundaries.


## Online Flow Implementation Boundary (Mandatory)

- Online workflow ownership boundary: playbooks/subplaybooks own SaaS/business navigation and state transitions.
- Runtime skill layer stays generic and reusable (transport, perception, dispatch), avoiding domain-online vertical hardcoding.
- Enforcement: policy manifests must declare online_workflows_playbook_only and orbid_online_skill_implementation_in_ahk.
