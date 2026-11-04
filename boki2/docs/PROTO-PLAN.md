# 試作の計画（PROTO-PLAN）：DESIGN-UI-IDEAL 9章の決定を試作で確かめる

2026-11-04、取りまとめ役。

## 依頼の原文（オーナーの言葉）
> 5つの試作を作るところから始めましょうか？ そうするなら、どれから作るか
> →順番は任せる。Codexに振れるタスク・仕事はCodexに渡せるように仕事を分解して。

決定（11/04、`docs/OWNER-WORDS.md`）：問1〜3 は試作で比べる、問5 は棚へ引く版も試作、問8 は「全部すぐ返す（いったん）」で試作しない。よって試作は **T1（ホームの数）・T2（差の帯）・T3（机の B/S の棚）・T10（入力）** の4つ。

## 順番と理由
1. **仕訳の机の試作（T2・T3・T10 を1つに）**：3つとも同じ画面5の問いで、切り替えで組み合わせられる。遊びの芯で、オーナーの最初の不満（反映が分からない・ドラッグ・1つだけ直す）に一番近い
2. **ホームの試作（T1）**：画面2の4版。机の試作の部品（書類の札）を使い回す
3. **自動の測り**（1・2の後）：高さ・はみ出し・押せる大きさ・字の大きさ・操作の時間
4. **人の試遊**（3の後）：中高生と大人に遊ばせて、6.1 の「測る物」を集める

## 仕事の分け方

| # | 仕事 | 担当 | 依頼書・成果 | 前提 |
|---|---|---|---|---|
| P1 | 仕訳の机の試作の仕様 | 取りまとめ役 | `docs/PROTO-SPEC-desk.md`（この版で書いた） | — |
| P2 | ホームの試作の仕様 | 取りまとめ役 | `docs/PROTO-SPEC-home.md`（この版で書いた） | — |
| P3 | 仕訳の机の試作の実装と自動の測り | **Codex** | `docs/CODEX-TASK-proto-desk.md` → `boki2/proto/desk/` | P1 |
| P4 | ホームの試作の実装と自動の測り | **Codex** | `docs/CODEX-TASK-proto-home.md` → `boki2/proto/home/` | P2（P3 の部品があれば使い回す。なくても始められる） |
| P5 | いまの画面の全数の写真集と目録（前から用意していた） | **Codex** | `docs/CODEX-TASK-uiref-screens.md` | — （P3・P4 と並べてよい） |
| P6 | P3・P4 の出来の確かめ（仕様の対応表を1行ずつ、画面を開いて） | 取りまとめ役（＋別の担当） | 確かめ書 `docs/audit/PROTO-*-verify.md` | P3・P4 |
| P7 | 人の試遊の手順と質問紙（中高生・大人、何を見るか、記録の形） | 取りまとめ役 | `docs/PROTO-PLAYTEST.md` | P1・P2 |
| P8 | 試遊（人を集めて遊ばせる） | **オーナー** | 記録（紙・フォーム・画面の録画） | P6・P7 |
| P9 | 試遊の記録の集計（数えるスクリプト） | **Codex**（記録が文字になっていれば） | `docs/analysis/proto-playtest-count.*` | P8 |
| P10 | 結果からの決定の案と論証の検査 | 取りまとめ役＋別の担当 | DESIGN-UI-IDEAL の問1・2・3・5 の決定 | P9 |

Codex に渡せるのは P3・P4・P5・P9。どれも外部への通信が要らず、ゲームのファイルを変えない（新しい `boki2/proto/` の下だけ）。仕様の決定・出来の判定・試遊の設計は、書いた本人以外が確かめる決まり（QUALITY 2.3・4章）があるので取りまとめ役の側に残す。

## Codex に渡す1行
- P3：「`boki2/docs/CODEX-TASK-proto-desk.md` を全文読んで、その依頼書どおりに作業して。ブランチは `claude/keen-hawking-sfeg6f` から `codex/proto-desk` を切って、PR は `claude/keen-hawking-sfeg6f` に向けて。」
- P4：「`boki2/docs/CODEX-TASK-proto-home.md` を全文読んで、その依頼書どおりに作業して。ブランチは `claude/keen-hawking-sfeg6f` から `codex/proto-home` を切って、PR は `claude/keen-hawking-sfeg6f` に向けて。」
- P5：「`boki2/docs/CODEX-TASK-uiref-screens.md` を全文読んで、その依頼書どおりに作業して。ブランチは `claude/keen-hawking-sfeg6f` から `codex/uiref-screens` を切って、PR は `claude/keen-hawking-sfeg6f` に向けて。」

P3 と P5 は同時に始められる。P4 は P3 の部品を使い回せると速いが、待たずに始めてもよい（その場合は部品を自前で持つ）。
