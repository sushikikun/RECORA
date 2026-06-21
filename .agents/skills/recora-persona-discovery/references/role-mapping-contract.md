# Role Mapping Contract

Use this contract whenever producing Persona Decision Table rows or `Handoff to recora-prompt-topic-designer`.

`detailed_decision_role` is the canonical detailed role field. `role_type` is the canonical downstream role bucket. Do not swap them.

`decision_role` is a legacy alias or shorthand for `detailed_decision_role`. In new tables and handoff rows, prefer `detailed_decision_role`. If an older section still says `decision_role`, read it as `detailed_decision_role` unless otherwise specified.

## Required Fields

| field | meaning | example |
|---|---|---|
| `detailed_decision_role` | Detailed decision or influence role inferred from the business type and evidence. | `procurement`, `security_reviewer`, `local_comparator` |
| `role_type` | Canonical role bucket used for handoff and downstream prompt design. | `economic_buyer`, `technical_reviewer`, `comparator` |
| `role_mapping_reason` | Short reason for the mapping. Use `same_as_decision_role` when the detailed role and canonical role are identical. | Procurement controls vendor criteria and cost, so map to economic_buyer/evaluator. |
| `decision_role` | Optional legacy alias for `detailed_decision_role`; avoid using it in new rows unless compatibility with older output is required. | `procurement` |

## Mapping Table

| detailed_decision_role | primary_role_type | fallback_role_type | mapping_note |
|---|---|---|---|
| `decision_maker` | `decision_maker` | `influencer` | Use when the role approves adoption, vendor choice, or strategy. |
| `economic_buyer` | `economic_buyer` | `decision_maker` | Use when budget, ROI, contract, or renewal is central. |
| `end_user` | `end_user` | `influencer` | Use when daily workflow, usage, or adoption friction is central. |
| `evaluator` | `evaluator` | `influencer` | Use when shortlist, comparison, proof review, or recommendation is central. |
| `technical_reviewer` | `technical_reviewer` | `evaluator` | Use `technical_reviewer` when downstream supports it; otherwise fallback to evaluator. |
| `procurement` | `economic_buyer` | `evaluator` | Procurement often controls vendor criteria, terms, and price even without final strategic approval. |
| `legal_compliance` | `evaluator` | `blocker` | Map to blocker when unresolved legal/compliance risk can stop adoption. |
| `security_reviewer` | `technical_reviewer` | `blocker` | Map to blocker when security approval is a gate rather than a review. |
| `operations_manager` | `end_user` | `decision_maker` | Map to decision_maker when operations owns adoption or rollout approval. |
| `field_manager` | `end_user` | `influencer` | Field managers represent practical adoption and rollout risk. |
| `finance_controller` | `economic_buyer` | `blocker` | Map to blocker when cost, margin, or approval risk may stop adoption. |
| `local_branch_manager` | `end_user` | `decision_maker` | Map to decision_maker when branch-level approval or local operations ownership is explicit. |
| `purchaser` | `purchaser` | `comparator` | Use when paying, booking, ordering, or subscribing is central. |
| `user` | `user` | `comparator` | Use when fit, use, experience, or outcome risk is central. |
| `comparator` | `comparator` | `purchaser` | Use when the persona primarily compares options before deciding. |
| `recommender_influencer` | `recommender_influencer` | `comparator` | Use when the role suggests, validates, reviews, or influences. |
| `family_decision_maker` | `purchaser` | `recommender_influencer` | Use sensitive language and avoid inferring family involvement without evidence. |
| `caregiver` | `purchaser` | `recommender_influencer` | Use only when care/support context is explicit or clearly relevant; avoid sensitive inference. |
| `gift_purchaser` | `purchaser` | `recommender_influencer` | Use when buying for someone else is supported by product or occasion evidence. |
| `gift_or_occasion_planner` | `purchaser` | `recommender_influencer` | Use when gift, event, seasonality, or occasion-planning evidence supports buying for someone else or coordinating a purchase. |
| `emergency_decider` | `purchaser` | `comparator` | Keep urgency as hypothesis unless service/category evidence supports it. |
| `repeat_buyer` | `repeat_user` | `purchaser` | Use for renewal, reorder, subscription, or continued-use decisions. |
| `local_comparator` | `comparator` | `purchaser` | Use when nearby options, reviews, price, or availability drive search. |
| `agency_or_consultant` | `agency_or_consultant` | `evaluator` | Keep agency-side roles separate from client-side buyer or client-side evaluator. |
| `client_side_evaluator` | `evaluator` | `decision_maker` | Use only when client-side evidence exists; otherwise exclude or mark needs more evidence. |

## Rules

- Keep `detailed_decision_role` specific enough to explain the search intent.
- Keep `role_type` within the canonical role values used by `prompt-angle-handoff-contract.md`.
- Always include `role_mapping_reason` in handoff rows. Use `same_as_decision_role` when `detailed_decision_role` and `role_type` are identical.
- Do not treat `role_type` and `detailed_decision_role` as the same field. A row can have `role_type: evaluator` and `detailed_decision_role: procurement`.
- Do not use agency-side `agency_or_consultant` for a client buyer unless the site supports client-side personas.
- Do not use `family_decision_maker`, `caregiver`, or `emergency_decider` as confirmed roles without explicit evidence or strong category context.
- If no safe mapping exists, mark the candidate `needs_more_evidence` or `do_not_handoff`.
