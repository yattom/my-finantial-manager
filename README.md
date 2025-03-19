# 個人向け金融資産マネジメントシステム

個人の金融資産を管理・分析するためのウェブアプリケーションです。保有している株式や投資信託などの資産を追跡し、パフォーマンスを分析することができます。

## 機能

- 保有している株式・投信などの数量と現在の価値、また価値の変動を時系列で見られる
- 保有している銘柄の最新価格や過去の価格を取得し、保存する
- 期間を指定して全体や銘柄ごとのパフォーマンスを表示、比較できる

## 技術スタック

- **フロントエンド**: TypeScript, Next.js
- **バックエンド**: Python, FastAPI
- **データベース**: SQLite3
- **コンテナ化**: Docker, Docker Compose
- **パッケージ管理**:
  - フロントエンド: npm
  - バックエンド: Poetry

## 開発環境のセットアップ

### 前提条件

- Docker と Docker Compose がインストールされていること
- Node.js と npm がインストールされていること（ローカル開発用）
- Python 3.11 以上と Poetry がインストールされていること（ローカル開発用）

### インストール手順

1. リポジトリをクローンする:

```bash
git clone https://github.com/yourusername/financial-manager.git
cd financial-manager
```

2. Docker Compose でアプリケーションを起動する:

```bash
docker-compose up -d
```

これにより、以下のサービスが起動します:
- フロントエンド: http://localhost:3000
- バックエンド API: http://localhost:8000

### ローカル開発

#### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

#### バックエンド

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

## API ドキュメント

FastAPI の自動生成された API ドキュメントは以下の URL で確認できます:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## テスト

### バックエンドのテスト

```bash
cd backend
poetry run pytest
```

### フロントエンドのテスト

```bash
cd frontend
npm test
```

## ディレクトリ構造

```
my-financial-manager/
├── frontend/                # Next.jsフロントエンド
│   ├── Dockerfile           # フロントエンドのDockerfile
│   ├── package.json         # 依存関係
│   ├── tsconfig.json        # TypeScript設定
│   ├── next.config.js       # Next.js設定
│   └── src/                 # ソースコード
│       ├── pages/           # ページコンポーネント
│       ├── components/      # 再利用可能なコンポーネント
│       ├── styles/          # スタイル
│       ├── api/             # APIクライアント
│       └── types/           # 型定義
├── backend/                 # FastAPIバックエンド
│   ├── Dockerfile           # バックエンドのDockerfile
│   ├── pyproject.toml       # Poetry依存関係
│   ├── app/                 # アプリケーションコード
│   │   ├── main.py          # エントリーポイント
│   │   ├── database.py      # データベース接続
│   │   ├── models.py        # データモデル
│   │   ├── schemas.py       # Pydanticスキーマ
│   │   └── crud.py          # CRUDロジック
│   └── tests/               # テスト
├── docker-compose.yml       # Docker Compose設定
└── README.md                # プロジェクト説明
```

## ライセンス

MIT
