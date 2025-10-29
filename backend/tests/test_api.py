import datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.database import Base, get_db
from app.main import app

# テスト用のデータベース設定
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# テスト用のデータベースセッション
@pytest.fixture
def db_session() -> Generator[Session, None, None]:
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


# テスト用のクライアント
@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# テスト用のサンプルデータ
@pytest.fixture
def sample_asset(db_session: Session) -> models.Asset:
    asset = models.Asset(
        name="テスト株式",
        ticker="TEST",
        type="株式",
        quantity=100,
        purchase_price=1000,
        purchase_date=datetime.date.today(),
        current_price=1100,
        current_value=110000,
        performance=10.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset


# APIのルートエンドポイントのテスト
def test_read_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "金融資産マネジメントAPIへようこそ"}


# 資産取得APIのテスト
def test_get_assets(client: TestClient, sample_asset: models.Asset) -> None:
    response = client.get("/assets")
    assert response.status_code == 200
    data = response.json()
    assert "assets" in data
    assert "summary" in data
    assert len(data["assets"]) == 1
    assert data["assets"][0]["id"] == sample_asset.id
    assert data["assets"][0]["name"] == sample_asset.name


# 資産作成APIのテスト
def test_create_asset(client: TestClient) -> None:
    asset_data = {
        "name": "新規テスト株式",
        "ticker": "NEWTEST",
        "type": "株式",
        "quantity": 50,
        "purchase_price": 2000,
        "purchase_date": datetime.date.today().isoformat(),
    }
    response = client.post("/assets", json=asset_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == asset_data["name"]
    assert data["ticker"] == asset_data["ticker"]
    assert data["quantity"] == asset_data["quantity"]
    assert "id" in data


# 特定の資産取得APIのテスト
def test_get_asset(client: TestClient, sample_asset: models.Asset) -> None:
    response = client.get(f"/assets/{sample_asset.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_asset.id
    assert data["name"] == sample_asset.name


# 存在しない資産取得APIのテスト
def test_get_asset_not_found(client: TestClient) -> None:
    response = client.get("/assets/999")
    assert response.status_code == 404


# 資産更新APIのテスト
def test_update_asset(client: TestClient, sample_asset: models.Asset) -> None:
    update_data = {"name": "更新テスト株式", "quantity": 200}
    response = client.put(f"/assets/{sample_asset.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_asset.id
    assert data["name"] == update_data["name"]
    assert data["quantity"] == update_data["quantity"]
    # 更新していないフィールドは元の値が保持されていることを確認
    assert data["ticker"] == sample_asset.ticker


# 資産削除APIのテスト
def test_delete_asset(client: TestClient, sample_asset: models.Asset) -> None:
    response = client.delete(f"/assets/{sample_asset.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_asset.id

    # 削除後に取得しようとするとエラーになることを確認
    response = client.get(f"/assets/{sample_asset.id}")
    assert response.status_code == 404


# パフォーマンス分析APIのテスト
@pytest.fixture
def asset_with_price_history(db_session: Session) -> models.Asset:
    """価格履歴付きの資産を作成"""
    asset = models.Asset(
        name="履歴テスト株式",
        ticker="HIST",
        type="株式",
        quantity=100,
        purchase_price=1000,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=1200,
        current_value=120000,
        performance=20.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    # 価格履歴を追加
    price_histories = [
        models.PriceHistory(
            asset_id=asset.id,
            date=datetime.date(2024, 1, 1),
            price=1000,
            value=100000,
        ),
        models.PriceHistory(
            asset_id=asset.id,
            date=datetime.date(2024, 1, 15),
            price=1100,
            value=110000,
        ),
        models.PriceHistory(
            asset_id=asset.id,
            date=datetime.date(2024, 1, 31),
            price=1200,
            value=120000,
        ),
    ]
    for ph in price_histories:
        db_session.add(ph)
    db_session.commit()

    return asset


def test_get_performance(
    client: TestClient, asset_with_price_history: models.Asset
) -> None:
    """パフォーマンスデータ取得APIのテスト"""
    response = client.get(
        "/performance", params={"start_date": "2024-01-01", "end_date": "2024-01-31"}
    )
    assert response.status_code == 200
    data = response.json()

    # レスポンス構造の確認
    assert "total_performance" in data
    assert "assets_performance" in data

    # トータルパフォーマンスの確認
    assert len(data["total_performance"]) == 3
    assert data["total_performance"][0]["date"] == "2024-01-01"
    assert data["total_performance"][0]["value"] == 100000
    assert data["total_performance"][0]["change_percent"] == 0

    # 最終日のパフォーマンスが20%増加していることを確認
    assert data["total_performance"][2]["date"] == "2024-01-31"
    assert data["total_performance"][2]["value"] == 120000
    assert abs(data["total_performance"][2]["change_percent"] - 20.0) < 0.01

    # 資産別パフォーマンスの確認
    assert len(data["assets_performance"]) == 1
    asset_perf = data["assets_performance"][0]
    assert asset_perf["id"] == asset_with_price_history.id
    assert asset_perf["name"] == asset_with_price_history.name
    assert len(asset_perf["performance"]) == 3
