from pathlib import Path

path = Path("scripts/.apply-topic-catalog-human-review-fix.py")
text = path.read_text(encoding="utf-8")
replacements = {
    '["finance.need_product_discovery","目的に対応する金融商品・保障・相談先の種類","candidate_discovery","T1","market_discovery",["service","price_fee","solution_category"]]': '["finance.need_product_discovery","目的に対応する金融商品・保障・相談先の種類","candidate_discovery","T1","market_discovery",["product","solution_category","price_fee"]]',
    '["home_service.contractor_discovery","修理・施工・改修内容に対応できる事業者候補","candidate_discovery","T1","market_discovery",["service","contract_condition","solution_category"]]': '["home_service.contractor_discovery","修理・施工・改修内容に対応できる事業者候補","candidate_discovery","T1","market_discovery",["service","solution_category","contract_condition"]]',
    'DOC.write_text(text.rstrip() + appendix + "\\n", encoding="utf-8", newline="\\n")': 'DOC.write_text(text.rstrip() + appendix.rstrip() + "\\n", encoding="utf-8", newline="\\n")',
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise RuntimeError(f"patch target count mismatch: {old[:80]}")
    text = text.replace(old, new, 1)
path.write_text(text, encoding="utf-8", newline="\n")