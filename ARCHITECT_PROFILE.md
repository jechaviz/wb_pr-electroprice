# WAIBA Architect Profile (Enforced) - Electroprice

## Source
This profile is synthesized from user architectural interventions and is mandatory for this project.

## Architect Baseline
1. Objective exactness over superficial completion.
2. Perception before action (`see -> execute -> register`) as runtime behavior.
3. Minimal-but-rigorous fallback hierarchy: deterministic path first, then guided debug, never blind combinatorial retries.
4. Reproducibility and idempotency by default.
5. Pruning discipline: once a candidate path is validated, remove redundant options.
6. Treat regression of a learned winning path as UI-change/anti-spam drift and enter evidence-driven debug mode.
7. Reusable capabilities belong in shared skills, not project-local duplication.
8. Versioning in commits/tags, not class/file naming hacks.
9. Temporary compatibility paths must be removed after validation.
10. Checkpoint/backup before destructive operations.
11. Hard decomposition trigger: any source/doc/playbook file over 600 lines must be refactored.
12. Playbooks are nested and numbered for readability (`NN_topic/NN_subtopic`).

## Runtime Mandates
- Learned candidate replay is strict by default.
- If strict replay fails, runtime must:
  - mark step as unconfirmed,
  - capture evidence,
  - fail fast with explicit drift diagnosis.
- Prompt-based manual fallback is exception-only, not default flow.

## Innovation Doctrine (Mandatory)
- Prefer simplification hacks that shrink search space and latency before broad fallback.
- Treat deep mechanism analysis (browser/system behavior) as a first-class method to discover deterministic shortcuts.
- Register each validated shortcut as reusable framework knowledge (skill, policy, or runtime heuristic).

## Engineering Hygiene
- Keep outputs under `playbooks/output/`, never mixed with framework code.
- Keep JS assets external and modular.
- Enforce warnings/errors visibility in non-interactive mode.
- Remove `tmp_*` and smoke leftovers after successful validation.

## Non-Ignorable Policy
This profile is part of the autonomy contract and enforced by:
- `Framework.EnsureAutonomyDoctrine`
- `Framework.Policy.EnsureAutonomy`
