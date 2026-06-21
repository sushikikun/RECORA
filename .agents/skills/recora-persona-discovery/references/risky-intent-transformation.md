# Risky Intent Transformation

Use this reference when persona discovery encounters medical, beauty medical, legal, financial, insurance, real estate, recruiting, security, safety, or other high-trust AI-search intent.

Do not discard every risky query. Detect it, label it, and decide whether it can be transformed into a safe Recora diagnosis prompt angle. Unsafe direct advice, diagnosis, treatment recommendation, outcome prediction, safety guarantee, or effect guarantee must never be handed off as-is.

## Required Fields

Every risky-intent evaluation must include:

- `risky_intent_type`
- `unsafe_user_intent`
- `why_risky`
- `safe_transformation_rule`
- `safe_prompt_angle`
- `prompt_readiness`
- `risk_flags`
- `when_to_handoff`
- `when_to_exclude`

## Risky Intent Types

Use these values:

- `treatment_recommendation_seeking`
- `diagnosis_seeking`
- `effect_guarantee_seeking`
- `symptom_solution_seeking`
- `safest_option_seeking`
- `price_only_decision`
- `review_overreliance`
- `legal_outcome_seeking`
- `financial_return_seeking`

## Transformation Rules

| risky_intent_type | unsafe_user_intent | why_risky | safe_transformation_rule | safe_prompt_angle | prompt_readiness | risk_flags | when_to_handoff | when_to_exclude |
|---|---|---|---|---|---|---|---|---|
| `treatment_recommendation_seeking` | "Which treatment should I choose?" | Asks AI to recommend an individual medical or beauty-medical action. | Convert to general comparison criteria and questions for a qualified professional. | Test prompts where the user compares consultation flow, risk explanation, qualifications, fee clarity, and aftercare before booking. | `usable_with_caution` | `risky_intent_detected`; `medical_advice_risk`; `regulated_claim_risk` | Handoff only transformed comparison or consultation-prep wording. | Exclude if AI is asked to choose treatment or provider for the individual. |
| `diagnosis_seeking` | "What is this symptom?" | Asks for diagnosis or individual condition inference. | Convert to what information to prepare and what to ask a specialist. | Test prompts where the user organizes questions and evidence to discuss with a qualified professional without asking AI to diagnose. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `diagnosis_risk`; `regulated_claim_risk` | Handoff only as pre-consultation preparation or verification criteria. | Exclude direct symptom diagnosis, eligibility judgment, or treatment-fit advice. |
| `effect_guarantee_seeking` | "Which option will work best?" | Implies guaranteed outcome or typical effect. | Convert to checking evidence quality, limitations, risks, and whether claims require consultation. | Test prompts where the user asks how to evaluate evidence, risks, side effects, cases, and limitations. | `usable_with_caution` | `risky_intent_detected`; `effect_guarantee_risk`; `regulated_claim_risk` | Handoff only when guarantees are removed. | Exclude cure, win, return, approval, hiring, safety, or effect guarantee. |
| `symptom_solution_seeking` | "What works for this symptom?" | Combines symptom inference and solution recommendation. | Convert to consultation-prep questions and provider comparison criteria. | Test prompts where the user prepares questions and compares whether providers explain risks, scope, fees, and follow-up. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `symptom_solution_risk`; `regulated_claim_risk` | Handoff only as general consultation-prep or comparison criteria. | Exclude direct "what should I do" questions. |
| `safest_option_seeking` | "Recommend the safest option." | Implies safety guarantee and individualized suitability. | Convert to how to verify safety disclosures, qualifications, contraindications, process, and aftercare. | Test prompts where the user asks what safety information, qualifications, and risk explanations to verify before consulting or booking. | `usable_with_caution` | `risky_intent_detected`; `safety_guarantee_risk`; `regulated_claim_risk` | Handoff when it asks what to verify, not what is safest. | Exclude if AI is asked to guarantee safety or decide suitability. |
| `price_only_decision` | "Which is cheapest?" | Can produce unsafe recommendations in high-trust services. | Convert to total-cost transparency plus qualifications, process, risk, support, and tradeoff checks. | Test prompts where the user compares price transparency, included scope, qualifications, risk explanation, and support before contacting a provider. | `usable_with_caution` | `risky_intent_detected`; `price_only_decision_risk` | Handoff when price is one axis among trust and safety criteria. | Exclude if price alone determines a regulated or sensitive decision. |
| `review_overreliance` | "Which has the best reviews and results?" | Treats reviews or cases as typical outcomes. | Convert to how to evaluate review reliability, case limitations, qualifications, and consultation questions. | Test prompts where the user checks how to read reviews, case examples, risk disclosures, and provider qualifications without assuming typical results. | `usable_with_caution` | `risky_intent_detected`; `review_overreliance_risk`; `regulated_claim_risk` | Handoff when reviews are one trust signal with limitations. | Exclude if reviews are treated as proof of guaranteed outcome. |
| `legal_outcome_seeking` | "Will I win?" | Asks for legal advice or outcome prediction. | Convert to consultation-prep questions, fee/process checks, scope, and evidence to bring to a qualified professional. | Test prompts where the user asks what to prepare and what to compare before an initial legal consultation. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `legal_advice_risk`; `regulated_claim_risk` | Handoff only as general consultation preparation or comparison criteria. | Exclude outcome prediction, eligibility judgment, or strategy advice. |
| `financial_return_seeking` | "Which will make the most money?" | Asks for financial recommendation or return guarantee. | Convert to risk disclosure, fee, suitability, license, and comparison criteria to verify with a qualified professional. | Test prompts where the user compares fees, risks, disclosures, product scope, and qualifications before seeking professional advice. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `financial_return_risk`; `regulated_claim_risk` | Handoff only as informational comparison and verification criteria. | Exclude investment, insurance, loan, or return recommendation. |

## Beauty / Medical Examples

| original_unsafe_intent | safe_transformed_prompt_angle | readiness | notes |
|---|---|---|---|
| "効果が出る施術を知りたい" | "美容医療を検討する前に、効果・リスク・副作用・個人差について一般的に確認すべき観点を整理する" | `usable_with_caution` | Avoid claiming a treatment will work. |
| "自分に合う美容医療を教えてほしい" | "美容クリニックのカウンセリングで、医師に確認すべき質問、適応判断の説明、リスク説明、費用範囲を整理する" | `usable_with_caution` | Do not ask AI to decide individual fit. |
| "この症状に効く治療は何ですか" | "症状や悩みを相談する前に、医師へ伝える情報と確認すべき説明項目を整理する" | `usable_with_caution` or `do_not_handoff` | Direct symptom solution stays excluded. |
| "安全でおすすめのクリニックはどこですか" | "東京で美容クリニックを比較するとき、医師情報、料金、リスク説明、口コミ、アフターケアを確認する観点を整理する" | `usable_with_caution` | Avoid safety guarantee wording. |
| "口コミで一番効果があるクリニックを知りたい" | "口コミや症例を見るとき、効果保証と誤解せず慎重に確認すべき点を整理する" | `usable_with_caution` | Reviews are trust signals, not outcome proof. |

## Handoff / Exclusion Rules

Hand off only when `safe_transformation_available` is `true`, `safe_prompt_angle` avoids direct advice or guarantees, `prompt_readiness` is usually `usable_with_caution`, and `risk_flags` plus `needs_verification` are present.

Exclude when the prompt asks AI to diagnose, choose treatment, decide legal/financial action, predict outcome, guarantee safety/effect, replace professional consultation, or when no safe comparison / verification / general-information / consultation-prep angle can be written.

Prefer safe language such as "what to compare", "what to verify", "questions to ask before consultation", "evidence or disclosure to check", and "how to read reviews or cases cautiously". Avoid "which treatment should I choose", "diagnose my symptom", "what will work for me", "guaranteed result", "safest option", or "best provider for my condition".