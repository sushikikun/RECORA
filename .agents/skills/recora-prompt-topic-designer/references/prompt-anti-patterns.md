# Prompt Anti-patterns

Use this reference when revising weak prompts. Do not include bad prompts in final measurement sets.

| bad_prompt | issue | revised_prompt | why_better | expected_signal |
|---|---|---|---|---|
| "AI search SaaS comparison pricing reviews" | SEO keyword dump | "When comparing AI search diagnosis tools for B2B SaaS, what evaluation criteria should an SEO manager use?" | Turns keywords into a buyer-realistic question with comparison context. | Observe comparison axes, proof needs, pricing/reputation concerns, and evidence requirements. |
| "Why is Recora the best AI search diagnosis service?" | Too branded and leading | "If a team is evaluating Recora as an AI search diagnosis service, what evidence should they review before relying on the results?" | Keeps branded validation but removes winner framing. | Observe brand explanation accuracy, evidence requirements, and unsupported claims. |
| "Compare Recora and these three competitors, and explain why Recora wins." | Leading competitor comparison | "When comparing AI search diagnosis services, what strengths, weaknesses, and evidence should buyers review for each option?" | Avoids assuming the client wins and supports neutral comparison. | Observe neutral comparison axes and proof requirements. |
| "Tell me about AI search." | Diagnostic intent unclear | "What problems usually lead a B2B SaaS team to investigate AI search visibility or GEO diagnosis?" | Adds market, buyer problem, and diagnostic purpose. | Observe whether AI distinguishes GEO diagnosis from generic SEO advice. |
| "What is the best recommended tool?" | Buyer stage missing | "Before adopting an AI search diagnosis service, what pricing, reporting, and reliability questions should an evaluator ask?" | Adds decision-stage context and evaluator concerns. | Observe decision-stage risk checks and adoption criteria. |
| "Will Recora appear in the answer?" | Too narrow and pre-measurement assertion risk | "For a Japanese B2B SaaS company, what kinds of AI search or GEO diagnosis services should a marketing leader compare before choosing a vendor?" | Measures unprompted discovery without forcing brand recall. | Observe whether the client or competitors appear unprompted after measurement. |
| "Compare only Vendor A, Vendor B, and Vendor C." | Competitors fixed too tightly | "Which types of vendors, agencies, or internal alternatives might a B2B SaaS team consider for AI search visibility diagnosis?" | Allows unknown competitor and substitute discovery. | Observe surfaced competitors, substitutes, and comparison categories. |
| "Which official page will AI cite for Recora?" | Citation guarantee risk | "What sources or page types would be useful when evaluating whether a B2B SaaS vendor is understood correctly by AI search systems?" | Reframes citation as source-readiness observation, not a guaranteed citation. | Observe source types, citation behavior, and page evidence needs after measurement. |
| "Make persona prompts for marketing people." | Persona too vague | "As a B2B SaaS marketing leader, what evidence would you need before choosing an AI search diagnosis service for pipeline improvement?" | Adds role, job, decision context, and signal. | Observe marketing-leader proof needs and sales-material gaps. |
| "Is the price cheap and are reviews good?" | Unsupported price/reputation assumption | "Before adopting an AI search diagnosis service, what pricing, reporting, support, and reliability information should an evaluator verify?" | Avoids asking AI to invent price or reputation facts. | Observe pricing/reputation information needs and hallucination risk. |
| "美容医療を初めて検討する人は、相談前にどんな一般情報や確認事項を整理すべきですか？" | Safe but over-sanitized; it sounds more like a survey than a real consumer AI/search query. | "美容クリニックが初めてで不安な人は、料金・口コミ・カウンセリング内容をどう確認すればよいですか？" | Closer to real consumer vocabulary around anxiety, price, reviews, and consultation while still avoiding medical diagnosis or treatment guarantees. | Observe first-time anxiety, price/review concerns, counseling checks, and whether AI avoids unsafe medical claims. |

## Rewrite Checklist

- Remove guarantee language.
- Remove "best", "superior", or winner framing unless the prompt is explicitly marked as an internal bias test.
- Add buyer role or persona.
- Add buyer stage.
- Add `raw_user_intent` when a final prompt is a safe rewrite of a rough buyer query.
- Add `language_mode` and make sure BtoC/local/clinic sets are not only polished `natural_conversation`.
- Preserve real buyer vocabulary such as price, reviews, local area, fear, failure avoidance, or role-specific workflow terms.
- Add one observable expected signal.
- Prefer `brand_excluded` unless the purpose is branded validation.
- Prefer `unknown_competitor_discovery` when competitor data is incomplete.
- Split prompts that ask several unrelated things.
- Mark unsupported market, competitor, pricing, or source assumptions.
- Add a handoff skill when the prompt result requires downstream analysis.
