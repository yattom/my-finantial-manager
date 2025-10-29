"""
パフォーマンス計算のための型とクラス

オブジェクト指向設計により、責任を適切なクラスに分離:
- PerformanceDataPoint: 単一のパフォーマンスデータポイント
- AssetPerformanceCalculator: 個別資産のパフォーマンス計算
- DateValueAggregator: 日付ごとの値の集計
- PortfolioPerformanceCalculator: ポートフォリオ全体のパフォーマンス計算
- PerformanceCalculator: 全体のオーケストレーション
"""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, List

from sqlalchemy.orm import Session

from . import models


@dataclass
class PerformanceDataPoint:
    """パフォーマンスの単一データポイント"""

    date: str
    value: float
    change_percent: float

    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "date": self.date,
            "value": self.value,
            "change_percent": self.change_percent,
        }


class AssetPerformanceCalculator:
    """個別資産のパフォーマンス計算を担当"""

    def __init__(self, asset: models.Asset, price_history: List[models.PriceHistory]):
        self.asset = asset
        self.price_history = price_history

    def calculate(self) -> List[PerformanceDataPoint]:
        """
        資産のパフォーマンスデータを計算

        Returns:
            パフォーマンスデータポイントのリスト
        """
        if not self.price_history:
            return []

        base_value = float(self.price_history[0].value)  # type: ignore[arg-type]
        performance_data: List[PerformanceDataPoint] = []

        for ph in self.price_history:
            change_percent = self._calculate_change_percent(
                float(ph.value), base_value  # type: ignore[arg-type]
            )
            date_str = ph.date.strftime("%Y-%m-%d")  # type: ignore[union-attr]

            performance_data.append(
                PerformanceDataPoint(
                    date=date_str,
                    value=float(ph.value),  # type: ignore[arg-type]
                    change_percent=change_percent,
                )
            )

        return performance_data

    @staticmethod
    def _calculate_change_percent(current_value: float, base_value: float) -> float:
        """変化率を計算（%）"""
        if base_value <= 0:
            return 0.0
        return ((current_value / base_value) - 1) * 100


class DateValueAggregator:
    """日付ごとの値の集計を担当"""

    def __init__(self) -> None:
        self._values_by_date: Dict[str, float] = {}

    def add_value(self, date_str: str, value: float) -> None:
        """指定された日付に値を追加"""
        if date_str in self._values_by_date:
            self._values_by_date[date_str] += value
        else:
            self._values_by_date[date_str] = value

    def get_sorted_dates(self) -> List[str]:
        """ソートされた日付のリストを返す"""
        return sorted(self._values_by_date.keys())

    def get_value(self, date_str: str) -> float:
        """指定された日付の値を返す"""
        return self._values_by_date.get(date_str, 0.0)


class PortfolioPerformanceCalculator:
    """ポートフォリオ全体のパフォーマンス計算を担当"""

    def __init__(self, aggregator: DateValueAggregator):
        self.aggregator = aggregator

    def calculate(self) -> List[PerformanceDataPoint]:
        """
        ポートフォリオ全体のパフォーマンスを計算

        Returns:
            ポートフォリオのパフォーマンスデータポイントのリスト
        """
        dates = self.aggregator.get_sorted_dates()
        if not dates:
            return []

        base_total_value = self.aggregator.get_value(dates[0])
        performance_data: List[PerformanceDataPoint] = []

        for date_str in dates:
            total_value = self.aggregator.get_value(date_str)
            change_percent = self._calculate_change_percent(
                total_value, base_total_value
            )

            performance_data.append(
                PerformanceDataPoint(
                    date=date_str, value=total_value, change_percent=change_percent
                )
            )

        return performance_data

    @staticmethod
    def _calculate_change_percent(current_value: float, base_value: float) -> float:
        """変化率を計算（%）"""
        if base_value <= 0:
            return 0.0
        return ((current_value / base_value) - 1) * 100


class PriceHistoryFetcher:
    """価格履歴のデータベースクエリを担当"""

    def __init__(self, db: Session):
        self.db = db

    def fetch(
        self, asset_id: int, start_date: date, end_date: date
    ) -> List[models.PriceHistory]:
        """
        指定された資産と期間の価格履歴を取得

        Args:
            asset_id: 資産ID
            start_date: 開始日
            end_date: 終了日

        Returns:
            価格履歴のリスト
        """
        return (
            self.db.query(models.PriceHistory)
            .filter(
                models.PriceHistory.asset_id == asset_id,
                models.PriceHistory.date >= start_date,
                models.PriceHistory.date <= end_date,
            )
            .order_by(models.PriceHistory.date)
            .all()
        )


class PerformanceCalculator:
    """
    パフォーマンス計算のメインオーケストレーター

    責任:
    - 全体のフローの調整
    - 個別の計算クラスの協調
    - 最終結果の構築
    """

    def __init__(self, db: Session):
        self.db = db
        self.price_history_fetcher = PriceHistoryFetcher(db)

    def calculate_performance(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        指定された期間のパフォーマンスデータを計算

        Args:
            start_date: 開始日（YYYY-MM-DD形式）
            end_date: 終了日（YYYY-MM-DD形式）

        Returns:
            パフォーマンスデータ（total_performance と assets_performance）
        """
        # 日付をdatetime型に変換
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        # 全ての資産を取得
        assets = self.db.query(models.Asset).all()

        # 日付ごとの値を集計するためのアグリゲーター
        date_aggregator = DateValueAggregator()

        # 各資産のパフォーマンスを計算
        assets_performance_data: List[Dict[str, Any]] = []

        for asset in assets:
            asset_data = self._calculate_asset_performance(
                asset, start, end, date_aggregator
            )
            if asset_data:
                assets_performance_data.append(asset_data)

        # ポートフォリオ全体のパフォーマンスを計算
        portfolio_calculator = PortfolioPerformanceCalculator(date_aggregator)
        total_performance_data = portfolio_calculator.calculate()

        return {
            "total_performance": [dp.to_dict() for dp in total_performance_data],
            "assets_performance": assets_performance_data,
        }

    def _calculate_asset_performance(
        self,
        asset: models.Asset,
        start_date: date,
        end_date: date,
        date_aggregator: DateValueAggregator,
    ) -> Dict[str, Any] | None:
        """
        個別資産のパフォーマンスを計算し、日付アグリゲーターに値を追加

        Args:
            asset: 資産
            start_date: 開始日
            end_date: 終了日
            date_aggregator: 日付ごとの値を集計するアグリゲーター

        Returns:
            資産のパフォーマンスデータ（履歴がない場合はNone）
        """
        # 価格履歴を取得
        price_history = self.price_history_fetcher.fetch(
            int(asset.id), start_date, end_date  # type: ignore[arg-type]
        )

        if not price_history:
            return None

        # パフォーマンスを計算
        asset_calculator = AssetPerformanceCalculator(asset, price_history)
        performance_data = asset_calculator.calculate()

        # 日付アグリゲーターに値を追加
        for data_point in performance_data:
            date_aggregator.add_value(data_point.date, data_point.value)

        return {
            "id": asset.id,
            "name": asset.name,
            "ticker": asset.ticker,
            "type": asset.type,
            "performance": [dp.to_dict() for dp in performance_data],
        }
