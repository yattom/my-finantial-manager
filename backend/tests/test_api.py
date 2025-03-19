import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import datetime

from app.main import app
from app.database import Base, get_db
from app import models, schemas

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
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

# テスト用のクライアント
@pytest.fixture
def client(db_session):
    def override_get_db():
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
def sample_asset(db_session):
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
        last_updated=datetime.datetime.now()
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)
    return asset

# APIのルートエンドポイントのテスト
def test_read_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "金融資産マネジメントAPIへようこそ"}

# 資産取得APIのテスト
def test_get_assets(client, sample_asset):
    response = client.get("/assets")
    assert response.status_code == 200
    data = response.json()
    assert "assets" in data
    assert "summary" in data
    assert len(data["assets"]) == 1
    assert data["assets"][0]["id"] == sample_asset.id
    assert data["assets"][0]["name"] == sample_asset.name

# 資産作成APIのテスト
def test_create_asset(client):
    asset_data = {
        "name": "新規テスト株式",
        "ticker": "NEWTEST",
        "type": "株式",
        "quantity": 50,
        "purchase_price": 2000,
        "purchase_date": datetime.date.today().isoformat()
    }
    response = client.post("/assets", json=asset_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == asset_data["name"]
    assert data["ticker"] == asset_data["ticker"]
    assert data["quantity"] == asset_data["quantity"]
    assert "id" in data

# 特定の資産取得APIのテスト
def test_get_asset(client, sample_asset):
    response = client.get(f"/assets/{sample_asset.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_asset.id
    assert data["name"] == sample_asset.name

# 存在しない資産取得APIのテスト
def test_get_asset_not_found(client):
    response = client.get("/assets/999")
    assert response.status_code == 404

# 資産更新APIのテスト
def test_update_asset(client, sample_asset):
    update_data = {
        "name": "更新テスト株式",
        "quantity": 200
    }
    response = client.put(f"/assets/{sample_asset.id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_asset.id
    assert data["name"] == update_data["name"]
    assert data["quantity"] == update_data["quantity"]
    # 更新していないフィールドは元の値が保持されていることを確認
    assert data["ticker"] == sample_asset.ticker

# 資産削除APIのテスト
def test_delete_asset(client, sample_asset):
    response = client.delete(f"/assets/{sample_asset.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == sample_asset.id
    
    # 削除後に取得しようとするとエラーになることを確認
    response = client.get(f"/assets/{sample_asset.id}")
    assert response.status_code == 404
