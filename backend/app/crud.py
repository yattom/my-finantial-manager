from datetime import date, datetime
from typing import Any, Dict, List, Optional

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


def _parse_date_range(start_date: str, end_date: str) -> tuple:
    """日付文字列をdate型に変換"""
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    return start, end


def _query_price_history(
    db: Session, asset_id: int, start: date, end: date
) -> List[models.PriceHistory]:
    """指定期間の価格履歴を取得"""
    return (
        db.query(models.PriceHistory)
        .filter(
            models.PriceHistory.asset_id == asset_id,
            models.PriceHistory.date >= start,
            models.PriceHistory.date <= end,
        )  # noqa: E501
        .order_by(models.PriceHistory.date)
        .all()
    )


def _calculate_change_percent(current_value: float, base_value: float) -> float:
    """変化率を計算（%）"""
    if base_value <= 0:
        return 0
    return ((current_value / base_value) - 1) * 100


def _create_performance_entry(
    ph: models.PriceHistory, base_value: float
) -> Dict[str, Any]:
    """価格履歴から1つのパフォーマンスエントリを作成"""
    date_str = ph.date.strftime("%Y-%m-%d")
    change_percent = _calculate_change_percent(ph.value, base_value)  # type: ignore[arg-type]  # noqa: E501
    return {"date": date_str, "value": ph.value, "change_percent": change_percent}


def _accumulate_value_by_date(
    all_values: Dict[str, float], date: str, value: float
) -> None:  # noqa: E501
    """日付ごとに価値を集計"""
    if date in all_values:
        all_values[date] += value
    else:
        all_values[date] = value


def _build_performance_data(
    price_history: List[models.PriceHistory], all_values_by_date: Dict[str, float]
) -> List[Dict[str, Any]]:  # noqa: E501
    """価格履歴からパフォーマンスデータを構築"""
    base_value = price_history[0].value  # type: ignore[arg-type]
    performance_data = [
        _create_performance_entry(ph, base_value) for ph in price_history  # type: ignore[arg-type]  # noqa: E501
    ]  # noqa: E501
    for ph in price_history:
        _accumulate_value_by_date(
            all_values_by_date, ph.date.strftime("%Y-%m-%d"), ph.value  # type: ignore[arg-type]  # noqa: E501
        )  # noqa: E501
    return performance_data


def _build_asset_performance(
    asset: models.Asset, performance_data: List[Dict[str, Any]]
) -> Dict[str, Any]:  # noqa: E501
    """資産のパフォーマンスデータを構築"""
    return {
        "id": asset.id,
        "name": asset.name,
        "ticker": asset.ticker,
        "type": asset.type,
        "performance": performance_data,
    }  # noqa: E501


def _process_asset_performance(
    db: Session,
    asset: models.Asset,
    start: date,
    end: date,
    all_values_by_date: Dict[str, float],
) -> Optional[Dict[str, Any]]:  # noqa: E501
    """1つの資産のパフォーマンスを処理"""
    price_history = _query_price_history(db, asset.id, start, end)  # type: ignore[arg-type]  # noqa: E501
    if not price_history:
        return None
    performance_data = _build_performance_data(price_history, all_values_by_date)
    return _build_asset_performance(asset, performance_data)


def _calculate_total_performance(
    all_values_by_date: Dict[str, float],
) -> List[Dict[str, Any]]:  # noqa: E501
    """ポートフォリオ全体のパフォーマンスを計算"""
    dates = sorted(all_values_by_date.keys())
    if not dates:
        return []
    base_total_value = all_values_by_date[dates[0]]
    return [
        _create_total_entry(date, all_values_by_date[date], base_total_value)
        for date in dates
    ]  # noqa: E501


def _create_total_entry(
    date: str, total_value: float, base_value: float
) -> Dict[str, Any]:  # noqa: E501
    """全体パフォーマンスのエントリを作成"""
    change_percent = _calculate_change_percent(total_value, base_value)
    return {"date": date, "value": total_value, "change_percent": change_percent}


def get_performance(db: Session, start_date: str, end_date: str) -> Dict[str, Any]:
    """指定された期間のパフォーマンスデータを取得"""
    start, end = _parse_date_range(start_date, end_date)
    all_values_by_date: Dict[str, float] = {}
    assets_performance = [
        p
        for asset in get_assets(db)
        if (p := _process_asset_performance(db, asset, start, end, all_values_by_date))
    ]  # noqa: E501
    total_performance = _calculate_total_performance(all_values_by_date)
    return {
        "total_performance": total_performance,
        "assets_performance": assets_performance,
    }  # noqa: E501
