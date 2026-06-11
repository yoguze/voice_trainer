# 🎤 Voice Trainer PWA - Cursor実装仕様書

## 概要

男性が女性のような声を練習するためのWebアプリ。
5つの音声指標をリアルタイム解析し、ボイスタイプ設定に基づいてスコアリングするPWA。

---

## 技術スタック

| 項目 | 採用技術 |
|---|---|
| フレームワーク | Next.js（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 音声録音 | MediaRecorder API |
| 音声解析 | Web Audio API（AudioContext / AnalyserNode） |
| データ保存 | IndexedDB（idb ライブラリ推奨） |
| PWA対応 | next-pwa |
| デプロイ | Vercel |
| 言語対応 | 日本語・英語（i18n） |

---

## デザイン方針

- **テイスト**：ポップ・明るい系（白ベース）
- **レスポンシブ**：スマホ・PC両対応
- カラーパレット例：白背景 + パステルピンク・ラベンダー・ライトブルーのアクセント
- フォント：丸みのあるサンセリフ系（Noto Sans JP + Inter推奨）

---

## 画面構成

### 1. 設定画面（ボイスタイプ選択）
3軸それぞれ4段階をカード形式で選択するUI。

#### 軸1：音域タイプ
| レベル | ラベル | F0目標 |
|---|---|---|
| 1 | ディープアルト | 175Hz |
| 2 | アルト | 197Hz |
| 3 | ミドル | 235Hz |
| 4 | ソプラノ | 290Hz |

#### 軸2：声質タイプ
| レベル | ラベル | スペクトル重心目標 | HNR目標 |
|---|---|---|---|
| 1 | ディープソフト | 1400Hz | 10dB |
| 2 | ソフト | 1700Hz | 14dB |
| 3 | クリア | 2100Hz | 20dB |
| 4 | ブライト | 2600Hz | 24dB |

#### 軸3：イントネーション
| レベル | ラベル | 抑揚幅目標 |
|---|---|---|
| 1 | フラット | 0.5oct |
| 2 | カーム | 1.0oct |
| 3 | ナチュラル | 1.5oct |
| 4 | アクティブ | 2.2oct |

設定を選ぶと以下の目標値オブジェクトが生成される：

```typescript
type VoiceTargets = {
  F0: number;           // Hz（音域タイプから）
  formant: {
    F1: number;         // Hz（音域タイプから）
    F2: number;         // Hz（音域タイプから）
  };
  spectralCentroid: number; // Hz（声質タイプから）
  HNR: number;          // dB（声質タイプから）
  intonation: number;   // oct（イントネーションから）
};
```

フォルマント（F1/F2）の目標値：
| 音域タイプ | F1目標 | F2目標 |
|---|---|---|
| ディープアルト | 680Hz | 1600Hz |
| アルト | 720Hz | 1700Hz |
| ミドル | 780Hz | 1800Hz |
| ソプラノ | 850Hz | 2000Hz |

---

### 2. 練習画面（録音・解析）

- マイクボタンで録音開始・停止
- 録音中：リアルタイムで波形またはピッチのビジュアライザーを表示
- 録音停止後：5指標を解析してスコアを表示

---

### 3. 結果画面（スコア表示）

5指標それぞれのスコアと総合スコアを表示。

#### スコアリング（6段階）

目標値との乖離をパーセンテージで算出：

| スコア | 評価 | 条件 |
|---|---|---|
| 100点 ⭐⭐⭐⭐⭐ | 完璧 | 目標値 ±5%以内 |
| 80点 ⭐⭐⭐⭐ | 優秀 | 目標値 ±10%以内 |
| 60点 ⭐⭐⭐ | 良好 | 目標値 ±20%以内 |
| 40点 ⭐⭐ | 要改善 | 目標値 ±30%以内 |
| 20点 ⭐ | 不足 | 目標値 ±40%以内 |
| 0点 💀 | やり直し | ±40%超 |

#### 総合スコア（重み付き平均）

```
総合スコア =
  フォルマント × 0.30
  F0           × 0.25
  スペクトル重心 × 0.20
  HNR          × 0.15
  イントネーション × 0.10
```

#### 各指標の表示例

```
F0（ピッチ）       計測値: 210Hz  目標: 235Hz  → 60点 ⭐⭐⭐
フォルマントF1     計測値: 750Hz  目標: 780Hz  → 80点 ⭐⭐⭐⭐
フォルマントF2     計測値: 1750Hz 目標: 1800Hz → 80点 ⭐⭐⭐⭐
スペクトル重心     計測値: 1900Hz 目標: 2100Hz → 80点 ⭐⭐⭐⭐
HNR（息）         計測値: 17dB   目標: 20dB   → 60点 ⭐⭐⭐
イントネーション   計測値: 1.2oct 目標: 1.5oct → 60点 ⭐⭐⭐
───────────────────────────────
総合スコア: 72点
```

---

### 4. 履歴画面

- IndexedDBに保存した過去の練習記録を一覧表示
- 総合スコアの成長グラフ（折れ線）を表示

---

## 音声解析の実装方針

### 共通準備

```typescript
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 4096; // 高精度FFT
```

### 各指標の算出方法

#### F0（基本周波数）
- **手法**：AutoCorrelation法
- 時系列のF0平均値を使用
- 範囲: 80Hz〜500Hz でクランプ

#### フォルマント（F1/F2）
- **手法**：FFTスペクトルから近似ピーク検出（LPC近似）
- F1: 200〜1000Hz の範囲で最初のピーク
- F2: 1000〜3000Hz の範囲で最初のピーク
- Phase1では近似値として表示し「参考値」と明記する

#### スペクトル重心
- **手法**：FFT各周波数ビンの振幅の重み付き平均
```typescript
centroid = Σ(frequency[i] * magnitude[i]) / Σ(magnitude[i])
```

#### HNR（調波雑音比）
- **手法**：AutoCorrelation比による近似
- 声帯の閉じ具合（息っぽさ）を数値化

#### イントネーション幅
- **手法**：録音中のF0時系列の最大値と最小値からオクターブ幅を算出
```typescript
intonation = log2(F0_max / F0_min) // オクターブ
```

---

## IndexedDB スキーマ

```typescript
// DB名: voice-trainer-db
// ストア名: sessions

type Session = {
  id: string;          // UUID
  createdAt: number;   // timestamp
  voiceType: {
    pitchType: 1 | 2 | 3 | 4;
    qualityType: 1 | 2 | 3 | 4;
    intonationType: 1 | 2 | 3 | 4;
  };
  targets: VoiceTargets;
  measured: {
    F0: number;
    F1: number;
    F2: number;
    spectralCentroid: number;
    HNR: number;
    intonation: number;
  };
  scores: {
    F0: number;
    formant: number;
    spectralCentroid: number;
    HNR: number;
    intonation: number;
    total: number;
  };
};
```

---

## PWA設定（next-pwa）

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});
```

manifest.json に以下を設定：
- `display: "standalone"`
- `theme_color`: ポップなピンク系カラー
- アイコン各サイズ（192x192, 512x512）

---

## i18n対応

- `next-intl` または `next-i18next` を使用
- `/locales/ja.json` と `/locales/en.json` を作成
- デフォルト言語：日本語
- 言語切替ボタンをヘッダーに配置

---

## ディレクトリ構成（推奨）

```
src/
├── app/
│   ├── [locale]/
│   │   ├── page.tsx          # 設定画面
│   │   ├── practice/
│   │   │   └── page.tsx      # 練習画面
│   │   ├── result/
│   │   │   └── page.tsx      # 結果画面
│   │   └── history/
│   │       └── page.tsx      # 履歴画面
├── components/
│   ├── VoiceTypeSelector.tsx  # ボイスタイプ選択UI
│   ├── Recorder.tsx           # 録音コンポーネント
│   ├── ScoreCard.tsx          # スコア表示
│   └── HistoryChart.tsx       # 成長グラフ
├── lib/
│   ├── audio/
│   │   ├── analyser.ts        # 音声解析ロジック
│   │   ├── pitch.ts           # F0算出（AutoCorrelation）
│   │   ├── formant.ts         # フォルマント算出
│   │   ├── spectral.ts        # スペクトル重心・HNR
│   │   └── intonation.ts      # イントネーション幅
│   ├── scoring.ts             # スコアリングロジック
│   ├── targets.ts             # ボイスタイプ→目標値マッピング
│   └── db.ts                  # IndexedDB操作（idb使用）
├── locales/
│   ├── ja.json
│   └── en.json
└── types/
    └── index.ts               # 型定義
```

---

## 実装フェーズ

### Phase 1（MVP）※まず実装
- ボイスタイプ設定UI（3軸×4段階）
- 仮パラメータによる目標値設定
- 録音 → 5指標解析
- 6段階スコアリング（固定重み付け）
- 練習履歴をIndexedDBに保存
- PWA対応・レスポンシブ・i18n

### Phase 2（後回し）
- 参照音声アップロード機能
- アップロード音声から目標値を自動調整

### Phase 3（後回し）
- 参照音声の特徴に応じた重み付け自動調整

---

## 注意事項

- フォルマント（F1/F2）はブラウザFFTの精度限界があるため、UIに「参考値」と明記すること
- マイクのパーミッション取得は `navigator.mediaDevices.getUserMedia` を使用
- AudioContextはユーザーのジェスチャー後に初期化すること（ブラウザ制約）
- IndexedDBへの音声データ保存はしない（スコアと計測値のみ保存）
- サーバーへの音声データ送信は一切行わない（完全ローカル処理）
