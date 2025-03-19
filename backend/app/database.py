from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# データベースのパス
# Dockerコンテナ内では/app/dataディレクトリにマウントされる
DATABASE_URL = "sqlite:///./data/financial_manager.db"

# SQLiteの接続設定
# check_same_thread=Falseは、SQLiteを複数のスレッドで使用するための設定
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

# セッションの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデルのベースクラス
Base = declarative_base()

# 依存性注入のためのデータベースセッション取得関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
