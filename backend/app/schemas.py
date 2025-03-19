from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import date, datetime

# 資産スキーマ
class AssetBase(BaseModel):
    name: str
    ticker: str
    type: str
    quantity: float
    purchase_price: float
    purchase_date: date

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    ticker: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[float] = None
    purchase_price: Optional[float] = None
    purchase_date: Optional[date] = None
    current_price: Optional[float] = None

class Asset(AssetBase):
    id: int
    current_price: float
    current_value: float
    performance: float
    last_updated: datetime

    model_config = ConfigDict(from_attributes=True)

# 資産サマリースキーマ
class AssetSummary(BaseModel):
    total_value: float
    total_cost: float
    total_gain_loss: float
    total_performance: float
    asset_allocation: List[Dict[str, Any]]

class AssetList(BaseModel):
    assets: List[Asset]
    summary: AssetSummary

# 価格履歴スキーマ
class PriceHistoryBase(BaseModel):
    date: date
    price: float
    value: float

class PriceHistoryCreate(PriceHistoryBase):
    asset_id: int

class PriceHistory(PriceHistoryBase):
    id: int
    asset_id: int

    model_config = ConfigDict(from_attributes=True)

# 価格更新スキーマ
class PriceUpdateRequest(BaseModel):
    asset_ids: List[int]

class PriceUpdateResponse(BaseModel):
    updated_assets: List[Asset]
    updated_at: datetime

# パフォーマンスデータスキーマ
class PerformanceData(BaseModel):
    date: str
    value: float
    change_percent: float

class AssetPerformance(BaseModel):
    id: int
    name: str
    ticker: str
    type: str
    performance: List[PerformanceData]

class PortfolioPerformance(BaseModel):
    total_performance: List[PerformanceData]
    assets_performance: List[AssetPerformance]
