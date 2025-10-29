from datetime import date, datetime
from typing import Any, Dict, List, Optional, Tuple

import yfinance as yf  # type: ignore[import-untyped]
from sqlalchemy.orm import Session

from . import models, schemas

# 資産関連のCRUD操作


def get_asset(db: Session, asset_id: int) -> Optional[models.Asset]:
    """
    指定されたIDの資産を取得します。
    """
    return db.query(models.Asset).filter(models.Asset.id == asset_id).first()


def get_assets(db: Session, skip: int = 0, limit: int = 100) -> List[models.Asset]:
    """
    全ての資産を取得します。
    """
    return db.query(models.Asset).offset(skip).limit(limit).all()


def create_asset(db: Session, asset: schemas.AssetCreate) -> models.Asset:
    """
    新しい資産を作成します。
    """
    # 現在の価格を取得（実際のAPIが実装されるまではダミーデータ）
    current_price = asset.purchase_price  # 初期値として購入価格を設定

    # 新しい資産オブジェクトを作成
    db_asset = models.Asset(
        name=asset.name,
        ticker=asset.ticker,
        type=asset.type,
        quantity=asset.quantity,
        purchase_price=asset.purchase_price,
        purchase_date=asset.purchase_date,
        current_price=current_price,
        current_value=asset.quantity * current_price,
        performance=0.0,  # 初期値は0%
        last_updated=datetime.now(),
    )

    # データベースに追加して保存
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)

    # 価格履歴に初期データを追加
    price_history = models.PriceHistory(
        asset_id=db_asset.id,
        date=datetime.now().date(),
        price=current_price,
        value=db_asset.current_value,
    )
    db.add(price_history)
    db.commit()

    return db_asset


def update_asset(
    db: Session, asset_id: int, asset_update: schemas.AssetUpdate
) -> Optional[models.Asset]:
    """
    指定されたIDの資産を更新します。
    """
    db_asset = get_asset(db, asset_id)
    if db_asset is None:
        return None

    # 更新するフィールドを設定
    update_data = asset_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_asset, key, value)

    # 現在の価値と変化率を更新
    db_asset.update_current_value()
    db_asset.last_updated = datetime.now()  # type: ignore[assignment]

    db.commit()
    db.refresh(db_asset)
    return db_asset


def delete_asset(db: Session, asset_id: int) -> Optional[models.Asset]:
    """
    指定されたIDの資産を削除します。
    """
    db_asset = get_asset(db, asset_id)
    if db_asset is None:
        return None
    db.delete(db_asset)
    db.commit()
    return db_asset


def get_assets_summary(db: Session) -> Dict[str, Any]:
    """
    全ての資産の概要を取得します。
    """
    assets = get_assets(db)

    # 合計値の計算
    total_value = sum(asset.current_value for asset in assets)
    total_cost = sum(asset.purchase_price * asset.quantity for asset in assets)
    total_gain_loss = total_value - total_cost

    # パフォーマンスの計算（%）
    total_performance = (total_gain_loss / total_cost * 100) if total_cost > 0 else 0

    # 資産配分の計算
    asset_types: Dict[str, float] = {}
    for asset in assets:
        if asset.type in asset_types:  # type: ignore[index]
            asset_types[asset.type] += (  # type: ignore[index]
                asset.current_value  # type: ignore[assignment]
            )
        else:
            asset_types[asset.type] = (  # type: ignore[index]
                asset.current_value  # type: ignore[assignment]
            )

    asset_allocation = [{"type": k, "value": v} for k, v in asset_types.items()]

    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "total_gain_loss": total_gain_loss,
        "total_performance": total_performance,
        "asset_allocation": asset_allocation,
    }


# 価格更新関連のCRUD操作


def update_prices(db: Session, asset_ids: List[int]) -> List[models.Asset]:
    """
    指定された資産の価格を更新します。
    """
    updated_assets: List[models.Asset] = []

    for asset_id in asset_ids:
        asset = get_asset(db, asset_id)
        if not asset:
            continue

        # Yahoo Finance APIを使用して最新の価格を取得
        try:
            ticker = yf.Ticker(str(asset.ticker) + ".T")
            ticker_data = ticker.history(period="1d")

            if not ticker_data.empty:
                # 最新の終値を取得
                new_price = ticker_data["Close"].iloc[-1]
                print(f"Retrieved price for {asset.ticker}: {new_price}")
            else:
                # データが取得できない場合はスキップ
                print(f"No data available for {asset.ticker}")
                continue

            # 資産の価格を更新
            asset.current_price = new_price
            asset.update_current_value()
            asset.last_updated = datetime.now()  # type: ignore[assignment]

            # 価格履歴に新しいデータを追加
            price_history = models.PriceHistory(
                asset_id=asset.id,
                date=datetime.now().date(),
                price=new_price,
                value=asset.current_value,
            )
            db.add(price_history)
        except Exception as e:
            print(f"Error updating price for asset {asset.id}: {str(e)}")

    db.commit()
    print(f"{updated_assets=}")
    return updated_assets


# パフォーマンス分析関連のCRUD操作


def _parse_date_range(start_date: str, end_date: str) -> Tuple[date, date]:
    """日付文字列をdateオブジェクトに変換します。"""
    return (
        datetime.strptime(start_date, "%Y-%m-%d").date(),
        datetime.strptime(end_date, "%Y-%m-%d").date(),
    )


def _fetch_price_history(
    db: Session, asset: models.Asset, start: date, end: date
) -> List[models.PriceHistory]:
    """指定された資産の価格履歴を取得します。"""
    return (
        db.query(models.PriceHistory)
        .filter(
            models.PriceHistory.asset_id == asset.id,
            models.PriceHistory.date >= start,
            models.PriceHistory.date <= end,
        )
        .order_by(models.PriceHistory.date)
        .all()
    )


def _calculate_performance_point(
    price_history: models.PriceHistory, base_value: float
) -> Dict[str, Any]:
    """単一の価格履歴ポイントからパフォーマンスデータを計算します。"""
    change_percent = (
        ((price_history.value / base_value) - 1) * 100 if base_value > 0 else 0
    )
    return {
        "date": price_history.date.strftime("%Y-%m-%d"),
        "value": price_history.value,
        "change_percent": change_percent,
    }


def _build_performance_data(
    price_history: List[models.PriceHistory],
) -> List[Dict[str, Any]]:
    """価格履歴リストからパフォーマンスデータを構築します。"""
    if not price_history:
        return []

    base_value = float(price_history[0].value)
    return [_calculate_performance_point(ph, base_value) for ph in price_history]


def _aggregate_values_by_date(
    assets_histories: List[tuple[models.Asset, List[models.PriceHistory]]],
) -> Dict[str, float]:
    """全資産の価格履歴から日付ごとの合計価値を集計します。"""
    values_by_date: Dict[str, float] = {}

    for _, price_history in assets_histories:
        for ph in price_history:
            date_str = ph.date.strftime("%Y-%m-%d")
            values_by_date[date_str] = values_by_date.get(date_str, 0.0) + float(
                ph.value
            )

    return values_by_date


def _calculate_total_performance(
    values_by_date: Dict[str, float],
) -> List[Dict[str, Any]]:
    """日付ごとの合計価値からポートフォリオ全体のパフォーマンスを計算します。"""
    if not values_by_date:
        return []

    sorted_dates = sorted(values_by_date.keys())
    base_value = values_by_date[sorted_dates[0]]

    return [
        {
            "date": date,
            "value": values_by_date[date],
            "change_percent": (
                ((values_by_date[date] / base_value) - 1) * 100 if base_value > 0 else 0
            ),
        }
        for date in sorted_dates
    ]


def _build_asset_performance(
    asset: models.Asset, price_history: List[models.PriceHistory]
) -> Dict[str, Any]:
    """資産と価格履歴からパフォーマンスデータを構築します。"""
    return {
        "id": asset.id,
        "name": asset.name,
        "ticker": asset.ticker,
        "type": asset.type,
        "performance": _build_performance_data(price_history),
    }


def get_performance(db: Session, start_date: str, end_date: str) -> Dict[str, Any]:
    """指定された期間のパフォーマンスデータを取得します。"""
    start, end = _parse_date_range(start_date, end_date)
    assets = get_assets(db)

    # 各資産の価格履歴を取得
    assets_histories = [
        (asset, _fetch_price_history(db, asset, start, end)) for asset in assets
    ]

    # 価格履歴がある資産のみをフィルタリング
    valid_assets_histories = [
        (asset, history) for asset, history in assets_histories if history
    ]

    # 各資産のパフォーマンスデータを構築
    assets_performance = [
        _build_asset_performance(asset, history)
        for asset, history in valid_assets_histories
    ]

    # ポートフォリオ全体のパフォーマンスを計算
    values_by_date = _aggregate_values_by_date(valid_assets_histories)
    total_performance = _calculate_total_performance(values_by_date)

    return {
        "total_performance": total_performance,
        "assets_performance": assets_performance,
    }
