from pathlib import Path

VERIFY = Path("scripts/verify-recora-measurement-persona-compiler.ts")
DOC = Path("docs/architecture/measurement-design/recora_measurement_persona_compiler_v3_ja.md")


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(
            f"{path}: expected one match, got {count}\nTARGET:\n{old[:400]}"
        )
    path.write_text(text.replace(old, new, 1), encoding="utf-8", newline="\n")


replace_once(
    VERIFY,
    '    assert.ok(fixture.expectedAlternativeKeys.length > 0, fixture.caseKey);\n',
    ''
)

replace_once(
    DOC,
    '代替候補はCoverageが一つ重なるだけでは提示しない。各選択枠を実際に置換した仮想Persona Setを作り、件数、重複、Topic影響数、必須Coverage、必須市場側を再検証し、全契約を維持できる置換先が一つ以上ある候補だけを返す。\n',
    '代替候補はCoverageが一つ重なるだけでは提示しない。各選択枠を実際に置換した仮想Persona Setを作り、件数、重複、Topic影響数、必須Coverage、必須市場側を再検証し、全契約を維持できる置換先が一つ以上ある候補だけを返す。安全に置換できる候補がないRecipeでは、代替候補を空配列として返す。\n'
)
