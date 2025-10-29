"""
get_performance関数のテスト

パフォーマンス計算ロジックのリファクタリング前後で動作が変わらないことを確認する
"""

import datetime
from typing import Generator

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import crud, models
from app.database import Base

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


def test_get_performance_empty_database(db_session: Session) -> None:
    """空のデータベースでパフォーマンスを取得する場合"""
    start_date = "2024-01-01"
    end_date = "2024-01-31"

    result = crud.get_performance(db_session, start_date, end_date)

    assert "total_performance" in result
    assert "assets_performance" in result
    assert result["total_performance"] == []
    assert result["assets_performance"] == []


def test_get_performance_single_asset_single_date(db_session: Session) -> None:
    """1つの資産、1つの日付でのパフォーマンス"""
    # 資産を作成
    asset = models.Asset(
        name="テスト株式",
        ticker="TEST",
        type="株式",
        quantity=100,
        purchase_price=1000,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=1000,
        current_value=100000,
        performance=0.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    # 価格履歴を追加
    price_history = models.PriceHistory(
        asset_id=asset.id,
        date=datetime.date(2024, 1, 15),
        price=1000,
        value=100000,
    )
    db_session.add(price_history)
    db_session.commit()

    # パフォーマンスを取得
    result = crud.get_performance(db_session, "2024-01-01", "2024-01-31")

    # 全体のパフォーマンスを検証
    assert len(result["total_performance"]) == 1
    assert result["total_performance"][0]["date"] == "2024-01-15"
    assert result["total_performance"][0]["value"] == 100000
    assert result["total_performance"][0]["change_percent"] == 0.0  # 基準日なので0%

    # 個別資産のパフォーマンスを検証
    assert len(result["assets_performance"]) == 1
    asset_perf = result["assets_performance"][0]
    assert asset_perf["id"] == asset.id
    assert asset_perf["name"] == asset.name
    assert asset_perf["ticker"] == asset.ticker
    assert asset_perf["type"] == asset.type
    assert len(asset_perf["performance"]) == 1
    assert asset_perf["performance"][0]["date"] == "2024-01-15"
    assert asset_perf["performance"][0]["value"] == 100000
    assert asset_perf["performance"][0]["change_percent"] == 0.0


def test_get_performance_single_asset_multiple_dates(db_session: Session) -> None:
    """1つの資産、複数日付でのパフォーマンス計算を検証"""
    # 資産を作成
    asset = models.Asset(
        name="テスト株式",
        ticker="TEST",
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

    # 複数の価格履歴を追加
    dates_and_prices = [
        (datetime.date(2024, 1, 1), 1000, 100000),  # 基準日
        (datetime.date(2024, 1, 8), 1050, 105000),  # +5%
        (datetime.date(2024, 1, 15), 1100, 110000),  # +10%
        (datetime.date(2024, 1, 22), 1150, 115000),  # +15%
        (datetime.date(2024, 1, 29), 1200, 120000),  # +20%
    ]

    for date, price, value in dates_and_prices:
        price_history = models.PriceHistory(
            asset_id=asset.id, date=date, price=price, value=value
        )
        db_session.add(price_history)
    db_session.commit()

    # パフォーマンスを取得
    result = crud.get_performance(db_session, "2024-01-01", "2024-01-31")

    # 全体のパフォーマンスを検証
    assert len(result["total_performance"]) == 5

    expected_changes = [0.0, 5.0, 10.0, 15.0, 20.0]
    for i, (expected_change, perf) in enumerate(
        zip(expected_changes, result["total_performance"])
    ):
        assert perf["change_percent"] == pytest.approx(expected_change, rel=1e-9)
        assert perf["value"] == dates_and_prices[i][2]

    # 個別資産のパフォーマンスを検証
    assert len(result["assets_performance"]) == 1
    asset_perf = result["assets_performance"][0]
    assert len(asset_perf["performance"]) == 5

    for i, perf in enumerate(asset_perf["performance"]):
        assert perf["change_percent"] == pytest.approx(expected_changes[i], rel=1e-9)


def test_get_performance_multiple_assets(db_session: Session) -> None:
    """複数資産のパフォーマンス集計を検証"""
    # 資産1を作成
    asset1 = models.Asset(
        name="株式A",
        ticker="STOCKA",
        type="株式",
        quantity=100,
        purchase_price=1000,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=1100,
        current_value=110000,
        performance=10.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset1)
    db_session.commit()
    db_session.refresh(asset1)

    # 資産2を作成
    asset2 = models.Asset(
        name="株式B",
        ticker="STOCKB",
        type="株式",
        quantity=50,
        purchase_price=2000,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=2200,
        current_value=110000,
        performance=10.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset2)
    db_session.commit()
    db_session.refresh(asset2)

    # 資産1の価格履歴
    for date, value in [
        (datetime.date(2024, 1, 1), 100000),
        (datetime.date(2024, 1, 15), 110000),
    ]:
        ph = models.PriceHistory(
            asset_id=asset1.id, date=date, price=value / 100, value=value
        )
        db_session.add(ph)

    # 資産2の価格履歴
    for date, value in [
        (datetime.date(2024, 1, 1), 100000),
        (datetime.date(2024, 1, 15), 110000),
    ]:
        ph = models.PriceHistory(
            asset_id=asset2.id, date=date, price=value / 50, value=value
        )
        db_session.add(ph)

    db_session.commit()

    # パフォーマンスを取得
    result = crud.get_performance(db_session, "2024-01-01", "2024-01-31")

    # 全体のパフォーマンスを検証（2資産の合計）
    assert len(result["total_performance"]) == 2
    assert result["total_performance"][0]["value"] == 200000  # 100000 + 100000
    assert result["total_performance"][1]["value"] == 220000  # 110000 + 110000
    assert result["total_performance"][0]["change_percent"] == 0.0  # 基準日
    assert result["total_performance"][1]["change_percent"] == pytest.approx(
        10.0, rel=1e-9
    )

    # 個別資産のパフォーマンスを検証
    assert len(result["assets_performance"]) == 2


def test_get_performance_date_filtering(db_session: Session) -> None:
    """日付範囲でのフィルタリングを検証"""
    # 資産を作成
    asset = models.Asset(
        name="テスト株式",
        ticker="TEST",
        type="株式",
        quantity=100,
        purchase_price=1000,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=1000,
        current_value=100000,
        performance=0.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    # 広い範囲の価格履歴を追加
    dates = [
        datetime.date(2024, 1, 1),
        datetime.date(2024, 1, 15),
        datetime.date(2024, 2, 1),
        datetime.date(2024, 2, 15),
        datetime.date(2024, 3, 1),
    ]

    for i, date in enumerate(dates):
        ph = models.PriceHistory(asset_id=asset.id, date=date, price=1000, value=100000)
        db_session.add(ph)
    db_session.commit()

    # 1月のデータのみを取得
    result = crud.get_performance(db_session, "2024-01-01", "2024-01-31")

    # 1月の2つのデータポイントのみが含まれることを検証
    assert len(result["total_performance"]) == 2
    assert result["total_performance"][0]["date"] == "2024-01-01"
    assert result["total_performance"][1]["date"] == "2024-01-15"

    assert len(result["assets_performance"]) == 1
    assert len(result["assets_performance"][0]["performance"]) == 2


def test_get_performance_no_price_history(db_session: Session) -> None:
    """価格履歴がない資産は結果に含まれないことを検証"""
    # 価格履歴のない資産を作成
    asset = models.Asset(
        name="テスト株式",
        ticker="TEST",
        type="株式",
        quantity=100,
        purchase_price=1000,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=1000,
        current_value=100000,
        performance=0.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset)
    db_session.commit()

    # パフォーマンスを取得
    result = crud.get_performance(db_session, "2024-01-01", "2024-01-31")

    # 価格履歴がないので結果は空
    assert result["total_performance"] == []
    assert result["assets_performance"] == []


def test_get_performance_zero_base_value(db_session: Session) -> None:
    """基準値が0の場合のエッジケースを検証"""
    # 資産を作成
    asset = models.Asset(
        name="テスト株式",
        ticker="TEST",
        type="株式",
        quantity=100,
        purchase_price=0,
        purchase_date=datetime.date(2024, 1, 1),
        current_price=100,
        current_value=10000,
        performance=0.0,
        last_updated=datetime.datetime.now(),
    )
    db_session.add(asset)
    db_session.commit()
    db_session.refresh(asset)

    # 基準値が0の価格履歴
    dates_and_values = [
        (datetime.date(2024, 1, 1), 0),
        (datetime.date(2024, 1, 15), 10000),
    ]

    for date, value in dates_and_values:
        ph = models.PriceHistory(
            asset_id=asset.id,
            date=date,
            price=value / 100 if value > 0 else 0,
            value=value,
        )
        db_session.add(ph)
    db_session.commit()

    # パフォーマンスを取得
    result = crud.get_performance(db_session, "2024-01-01", "2024-01-31")

    # 基準値が0なので、change_percentは0になる
    assert len(result["total_performance"]) == 2
    assert result["total_performance"][0]["change_percent"] == 0.0
    assert result["total_performance"][1]["change_percent"] == 0.0
