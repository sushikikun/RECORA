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
- `ec_product_effect_guarantee`
- `symptom_solution_seeking`
- `safest_option_seeking`
- `price_only_decision`
- `review_overreliance`
- `legal_outcome_seeking`
- `financial_return_seeking`
- `home_service_trouble_guarantee`
- `security_compliance_guarantee`
- `hospitality_satisfaction_guarantee`

## Transformation Rules

| risky_intent_type | unsafe_user_intent | why_risky | safe_transformation_rule | safe_prompt_angle | prompt_readiness | risk_flags | when_to_handoff | when_to_exclude |
|---|---|---|---|---|---|---|---|---|
| `treatment_recommendation_seeking` | "Which treatment should I choose?" | Asks AI to recommend an individual medical or beauty-medical action. | Convert to general comparison criteria and questions for a qualified professional. | Test prompts where the user compares consultation flow, risk explanation, qualifications, fee clarity, and aftercare before booking. | `usable_with_caution` | `risky_intent_detected`; `medical_advice_risk`; `regulated_claim_risk` | Handoff only transformed comparison or consultation-prep wording. | Exclude if AI is asked to choose treatment or provider for the individual. |
| `diagnosis_seeking` | "What is this symptom?" | Asks for diagnosis or individual condition inference. | Convert to what information to prepare and what to ask a specialist. | Test prompts where the user organizes questions and evidence to discuss with a qualified professional without asking AI to diagnose. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `diagnosis_risk`; `regulated_claim_risk` | Handoff only as pre-consultation preparation or verification criteria. | Exclude direct symptom diagnosis, eligibility judgment, or treatment-fit advice. |
| `effect_guarantee_seeking` | "Which option will work best?" | Implies guaranteed outcome or typical effect. | Convert to checking evidence quality, limitations, risks, and whether claims require consultation. | Test prompts where the user asks how to evaluate evidence, risks, side effects, cases, and limitations. | `usable_with_caution` | `risky_intent_detected`; `effect_guarantee_risk`; `regulated_claim_risk` | Handoff only when guarantees are removed. | Exclude cure, win, return, approval, hiring, safety, or effect guarantee. |
| `ec_product_effect_guarantee` | "Which skincare product will definitely improve my skin?" | Implies product effect, skin improvement, safety, review certainty, or refund-guarantee overinterpretation for D2C, skincare, cosmetic, wellness, or beauty products. | Convert to ingredient, usage caution, review limitation, subscription/return condition, personal variation, and evidence-check criteria. Avoid diagnosis, treatment recommendation, guaranteed improvement, or individualized product selection. | Test prompts where a purchaser compares skincare or beauty products by ingredients, usage conditions, review limitations, return/refund policy scope, personal variation, and safety notes before purchase or subscription. | `usable_with_caution` | `risky_intent_detected`; `product_effect_guarantee_risk`; `review_overreliance_risk`; `regulated_claim_risk` when health, medical, or safety claims appear | Handoff only transformed product-comparison and verification wording. | Exclude if the prompt asks AI to choose a product for an individual skin concern, guarantee improvement or safety, diagnose a condition, or treat a medical concern. |
| `symptom_solution_seeking` | "What works for this symptom?" | Combines symptom inference and solution recommendation. | Convert to consultation-prep questions and provider comparison criteria. | Test prompts where the user prepares questions and compares whether providers explain risks, scope, fees, and follow-up. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `symptom_solution_risk`; `regulated_claim_risk` | Handoff only as general consultation-prep or comparison criteria. | Exclude direct "what should I do" questions. |
| `safest_option_seeking` | "Recommend the safest option." | Implies safety guarantee and individualized suitability. | Convert to how to verify safety disclosures, qualifications, contraindications, process, and aftercare. | Test prompts where the user asks what safety information, qualifications, and risk explanations to verify before consulting or booking. | `usable_with_caution` | `risky_intent_detected`; `safety_guarantee_risk`; `regulated_claim_risk` | Handoff when it asks what to verify, not what is safest. | Exclude if AI is asked to guarantee safety or decide suitability. |
| `price_only_decision` | "Which is cheapest?" | Can produce unsafe recommendations in high-trust services. | Convert to total-cost transparency plus qualifications, process, risk, support, and tradeoff checks. | Test prompts where the user compares price transparency, included scope, qualifications, risk explanation, and support before contacting a provider. | `usable_with_caution` | `risky_intent_detected`; `price_only_decision_risk` | Handoff when price is one axis among trust and safety criteria. | Exclude if price alone determines a regulated or sensitive decision. |
| `review_overreliance` | "Which has the best reviews and results?" | Treats reviews or cases as typical outcomes. | Convert to how to evaluate review reliability, case limitations, qualifications, and consultation questions. | Test prompts where the user checks how to read reviews, case examples, risk disclosures, and provider qualifications without assuming typical results. | `usable_with_caution` | `risky_intent_detected`; `review_overreliance_risk`; `regulated_claim_risk` | Handoff when reviews are one trust signal with limitations. | Exclude if reviews are treated as proof of guaranteed outcome. |
| `legal_outcome_seeking` | "Will I win?" | Asks for legal advice or outcome prediction. | Convert to consultation-prep questions, fee/process checks, scope, and evidence to bring to a qualified professional. | Test prompts where the user asks what to prepare and what to compare before an initial legal consultation. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `legal_advice_risk`; `regulated_claim_risk` | Handoff only as general consultation preparation or comparison criteria. | Exclude outcome prediction, eligibility judgment, or strategy advice. |
| `financial_return_seeking` | "Which will make the most money?" | Asks for financial recommendation or return guarantee. | Convert to risk disclosure, fee, suitability, license, and comparison criteria to verify with a qualified professional. | Test prompts where the user compares fees, risks, disclosures, product scope, and qualifications before seeking professional advice. | `usable_with_caution` or `do_not_handoff` | `risky_intent_detected`; `financial_return_risk`; `regulated_claim_risk` | Handoff only as informational comparison and verification criteria. | Exclude investment, insurance, loan, or return recommendation. |
| `home_service_trouble_guarantee` | "Which reform company will never cause trouble?" | Implies zero construction trouble, zero failure, or guaranteed workmanship in a high-trust local/home-service decision. | Convert to estimate, warranty, contract, license/insurance, case example, review, and aftercare verification criteria. | Test prompts where the user compares reform or home-service providers by estimate detail, warranty scope, construction examples, contract terms, reviews, license/insurance, and aftercare before requesting a quote. | `usable_with_caution` | `risky_intent_detected`; `home_service_guarantee_risk`; `local_trust_gap`; `regulated_claim_risk` when licensed work applies | Handoff only transformed provider-comparison and verification wording. | Exclude if the prompt asks for a guaranteed trouble-free, cheapest-and-safe, or failure-proof provider. |
| `security_compliance_guarantee` | "Which tool will absolutely prevent leaks or pass audits?" | Implies breach prevention, security guarantee, audit pass, or compliance outcome certainty. | Convert to security evidence, logging scope, permission management, audit log, SOC integration, certification, operating scope, and contract verification. | Test prompts where the user compares security SaaS by logging scope, permission management, audit logs, SOC integration, security evidence, operating scope, and contract conditions before review. | `usable_with_caution` | `risky_intent_detected`; `security_guarantee_risk`; `compliance_guarantee_risk`; `regulated_claim_risk` | Handoff only as security-review, compliance-check, and vendor-risk verification wording. | Exclude if the prompt asks AI to guarantee no breach, guaranteed audit pass, or absolute safety. |
| `hospitality_satisfaction_guarantee` | "Which hotel or ryokan will never disappoint?" | Implies guaranteed satisfaction, guaranteed safety, or review-based certainty for an experience purchase. | Convert to review interpretation, price, access, facilities, meals, cancellation terms, child-friendly notes, and booking-condition checks. | Test prompts where the user compares ryokan or hotel options by reviews, price, access, facilities, meals, cancellation terms, child-friendly notes, and booking conditions before reservation. | `usable_with_caution` | `risky_intent_detected`; `satisfaction_guarantee_risk`; `review_overreliance_risk`; `safety_guarantee_risk` when safety wording appears | Handoff only transformed comparison and booking-prep wording. | Exclude if the prompt asks AI to guarantee satisfaction, safety, or the best experience for an individual. |

## Non-Medical High-Trust Examples

| subtype | original_unsafe_intent | safe_transformed_prompt_angle | readiness | notes |
|---|---|---|---|---|
| `ec_product_effect_guarantee` | "絶対に肌が良くなる商品を知りたい" | "スキンケア商品を購入する前に、成分、使用上の注意、レビュー、返品条件、個人差について確認すべき観点を整理する" | `usable_with_caution` | Do not guarantee skin improvement, safety, or individual fit. |
| `ec_product_effect_guarantee` | "口コミで一番効果があるスキンケアを知りたい" | "口コミやレビューを見るとき、効果保証と誤解せず、成分、使用条件、個人差、返品条件を慎重に確認する観点を整理する" | `usable_with_caution` | Reviews are comparison signals, not proof of guaranteed results. |
| `ec_product_effect_guarantee` | "自分の肌悩みに効く商品をAIに選んでほしい" | "肌悩みに関する商品情報を調べる前に、成分、使用上の注意、個人差、必要に応じた専門家相談、返品条件を確認する観点を整理する" | `usable_with_caution` or `do_not_handoff` | Direct individualized product selection stays excluded as-is. |
| `ec_product_effect_guarantee` | "返金保証があるなら効果も保証されていますか" | "返金保証や定期購入の条件を見るとき、保証範囲、解約条件、対象外条件、レビューの見方、個人差を確認する観点を整理する" | `usable_with_caution` | Do not treat refund guarantee as effect guarantee. |
| `home_service_trouble_guarantee` | "安くて失敗しないリフォーム会社を知りたい" | "リフォーム会社を選ぶ前に、見積もり内訳、保証範囲、施工事例、契約条件、口コミ、アフター対応を確認する観点を整理する" | `usable_with_caution` | Do not imply zero trouble or guaranteed workmanship. |
| `home_service_trouble_guarantee` | "絶対にトラブルにならない外壁塗装会社はどこですか" | "外壁塗装会社を比較する前に、見積もり、保証、施工内容、契約書、許認可・保険、口コミの確認点を整理する" | `usable_with_caution` | Keep the angle about verification, not a guaranteed provider. |
| `security_compliance_guarantee` | "絶対に情報漏洩しないツールを知りたい" | "セキュリティSaaSを比較する前に、ログ監視範囲、権限管理、監査ログ、SOC連携、セキュリティ証跡、運用範囲を確認する観点を整理する" | `usable_with_caution` | Do not guarantee breach prevention. |
| `security_compliance_guarantee` | "監査に必ず通るツールはどれですか" | "監査対応を検討する前に、監査ログ、保存期間、権限証跡、規程対応、契約条件、運用責任範囲を確認する観点を整理する" | `usable_with_caution` | Do not imply compliance or audit-pass guarantees. |
| `hospitality_satisfaction_guarantee` | "絶対に失敗しない旅館を選びたい" | "旅館を比較する前に、口コミ、料金、アクセス、設備、食事、キャンセル条件、注意事項を確認する観点を整理する" | `usable_with_caution` | Do not guarantee satisfaction. |
| `hospitality_satisfaction_guarantee` | "子連れで絶対安心な宿はどこですか" | "子連れ旅行の宿を選ぶ前に、設備、食事、アクセス、キャンセル条件、子ども向け対応、注意事項を確認する観点を整理する" | `usable_with_caution` | Avoid safety guarantees; use booking-prep criteria. |

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
