# Captions Prompt

この文書は、縦型ショート動画の台本を `<work>.captions.json` に変換するための出力契約を定義している。

## 出力形式

JSON オブジェクトのみを出力する。

```json
{
  "tts_format": "caption_narration/v1",
  "blocks": [
    {
      "file_name": "short_slug",
      "caption": "画面表示字幕",
      "narration": "読み上げ文。"
    }
  ]
}
```

## ルール

- `tts_format` は `caption_narration/v1` である。
- `blocks` は読み上げ順である。
- `file_name` は英小文字とアンダースコアのみで、拡張子を含まない。
- `caption` は画面表示用の短い字幕である。
- `narration` はVOICEVOXで読み上げる自然な文である。
- `caption` の表示文字数は改行を除いて15文字以内である。
- 空行を含む `caption` は無効である。
