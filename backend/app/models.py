from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Date, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

class Asset(Base):
    """
    資産モデル
    """
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    ticker = Column(String, index=True)
    type = Column(String, index=True)  # 株式、投資信託、ETF、債券など
    quantity = Column(Float)
    purchase_price = Column(Float)
    purchase_date = Column(Date)
    current_price = Column(Float)
    current_value = Column(Float)  # quantity * current_price
    performance = Column(Float)  # (current_price - purchase_price) / purchase_price * 100
    last_updated = Column(DateTime, default=func.now())
    
    # 関連するデータ
    price_history = relationship("PriceHistory", back_populates="asset", cascade="all, delete-orphan")
    
    def update_current_value(self):
        """
        現在の価値と変化率を計算して更新します。
        """
        self.current_value = self.quantity * self.current_price
        self.performance = ((self.current_price - self.purchase_price) / self.purchase_price) * 100


class PriceHistory(Base):
    """
    価格履歴モデル
    """
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))
    date = Column(Date, index=True)
    price = Column(Float)
    value = Column(Float)  # quantity * price
    
    # 関連するデータ
    asset = relationship("Asset", back_populates="price_history")
