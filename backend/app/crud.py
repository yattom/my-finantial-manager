from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import yfinance as yf
import pandas as pd
import random

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
        last_updated=datetime.now()
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
        value=db_asset.current_value
    )
    db.add(price_history)
    db.commit()

    return db_asset


def update_asset(db: Session, asset_id: int, asset_update: schemas.AssetUpdate) -> models.Asset:
    """
    指定されたIDの資産を更新します。
    """
    db_asset = get_asset(db, asset_id)

    # 更新するフィールドを設定
    update_data = asset_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_asset, key, value)

    # 現在の価値と変化率を更新
    db_asset.update_current_value()
    db_asset.last_updated = datetime.now()

    db.commit()
    db.refresh(db_asset)
    return db_asset


def delete_asset(db: Session, asset_id: int) -> models.Asset:
    """
    指定されたIDの資産を削除します。
    """
    db_asset = get_asset(db, asset_id)
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
    total_performance = (total_gain_loss / total_cost *
                         100) if total_cost > 0 else 0

    # 資産配分の計算
    asset_types = {}
    for asset in assets:
        if asset.type in asset_types:
            asset_types[asset.type] += asset.current_value
        else:
            asset_types[asset.type] = asset.current_value

    asset_allocation = [{"type": k, "value": v}
                        for k, v in asset_types.items()]

    return {
        "total_value": total_value,
        "total_cost": total_cost,
        "total_gain_loss": total_gain_loss,
        "total_performance": total_performance,
        "asset_allocation": asset_allocation
    }

# 価格更新関連のCRUD操作


def update_prices(db: Session, asset_ids: List[int]) -> List[models.Asset]:
    """
    指定された資産の価格を更新します。
    """
    updated_assets = []

    for asset_id in asset_ids:
        asset = get_asset(db, asset_id)
        if not asset:
            continue

        # Yahoo Finance APIを使用して最新の価格を取得
        try:
            ticker = yf.Ticker(str(asset.ticker) + '.T')
            ticker_data = ticker.history(period="1d")

            if not ticker_data.empty:
                # 最新の終値を取得
                new_price = ticker_data['Close'].iloc[-1]
                print(f"Retrieved price for {asset.ticker}: {new_price}")
            else:
                # データが取得できない場合はスキップ
                print(f"No data available for {asset.ticker}")
                continue

            # 資産の価格を更新
            asset.current_price = new_price
            asset.update_current_value()
            asset.last_updated = datetime.now()

            # 価格履歴に新しいデータを追加
            price_history = models.PriceHistory(
                asset_id=asset.id,
                date=datetime.now().date(),
                price=new_price,
                value=asset.current_value
            )
            db.add(price_history)
        except Exception as e:
            print(f"Error updating price for asset {asset.id}: {str(e)}")

    db.commit()
    print(f'{updated_assets=}')
    return updated_assets

# パフォーマンス分析関連のCRUD操作


def get_performance(db: Session, start_date: str, end_date: str) -> schemas.PortfolioPerformance:
    """
    指定された期間のパフォーマンスデータを取得します。
    """
    # 日付をdatetime型に変換
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()

    # 全ての資産を取得
    assets = get_assets(db)

    # 各資産のパフォーマンスデータを取得
    assets_performance = []
    all_values_by_date = {}  # 日付ごとの全資産の合計価値

    for asset in assets:
        # 価格履歴を取得
        price_history = (
            db.query(models.PriceHistory)
            .filter(
                models.PriceHistory.asset_id == asset.id,
                models.PriceHistory.date >= start,
                models.PriceHistory.date <= end
            )
            .order_by(models.PriceHistory.date)
            .all()
        )

        # 価格履歴がない場合はスキップ
        if not price_history:
            continue

        # 最初の価格を基準にパフォーマンスを計算
        base_value = price_history[0].value
        performance_data = []

        for ph in price_history:
            # 変化率を計算（%）
            change_percent = ((ph.value / base_value) - 1) * \
                100 if base_value > 0 else 0

            # 日付文字列
            date_str = ph.date.strftime("%Y-%m-%d")

            # パフォーマンスデータを追加
            performance_data.append({
                "date": date_str,
                "value": ph.value,
                "change_percent": change_percent
            })

            # 全資産の合計価値を日付ごとに集計
            if date_str in all_values_by_date:
                all_values_by_date[date_str] += ph.value
            else:
                all_values_by_date[date_str] = ph.value

        # 資産のパフォーマンスデータを追加
        assets_performance.append({
            "id": asset.id,
            "name": asset.name,
            "ticker": asset.ticker,
            "type": asset.type,
            "performance": performance_data
        })

    # ポートフォリオ全体のパフォーマンスを計算
    total_performance = []

    # 日付でソート
    dates = sorted(all_values_by_date.keys())

    if dates:
        # 最初の合計価値を基準にパフォーマンスを計算
        base_total_value = all_values_by_date[dates[0]]

        for date in dates:
            total_value = all_values_by_date[date]
            change_percent = ((total_value / base_total_value) -
                              1) * 100 if base_total_value > 0 else 0

            total_performance.append({
                "date": date,
                "value": total_value,
                "change_percent": change_percent
            })

    return {
        "total_performance": total_performance,
        "assets_performance": assets_performance
    }
