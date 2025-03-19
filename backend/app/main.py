from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import os
from datetime import datetime, timedelta

from .database import get_db, engine
from . import models, schemas, crud
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

# データベースの初期化
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="金融資産マネジメントAPI")

# CORSの設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限する
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "金融資産マネジメントAPIへようこそ"}

# 資産関連のエンドポイント
@app.get("/assets", response_model=schemas.AssetList)
def get_assets(db: Session = Depends(get_db)):
    """
    保有している全ての資産を取得します。
    """
    try:
        assets = crud.get_assets(db)
        summary = crud.get_assets_summary(db)
        return {"assets": assets, "summary": summary}
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"データベースエラー: {str(e)}",
        )

@app.post("/assets", response_model=schemas.Asset)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(get_db)):
    """
    新しい資産を追加します。
    """
    try:
        return crud.create_asset(db=db, asset=asset)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"データベースエラー: {str(e)}",
        )

@app.get("/assets/{asset_id}", response_model=schemas.Asset)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    """
    特定の資産の詳細を取得します。
    """
    asset = crud.get_asset(db, asset_id=asset_id)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID {asset_id} の資産は見つかりませんでした",
        )
    return asset

@app.put("/assets/{asset_id}", response_model=schemas.Asset)
def update_asset(
    asset_id: int, asset_update: schemas.AssetUpdate, db: Session = Depends(get_db)
):
    """
    特定の資産を更新します。
    """
    asset = crud.get_asset(db, asset_id=asset_id)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID {asset_id} の資産は見つかりませんでした",
        )
    try:
        return crud.update_asset(db=db, asset_id=asset_id, asset_update=asset_update)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"データベースエラー: {str(e)}",
        )

@app.delete("/assets/{asset_id}", response_model=schemas.Asset)
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    """
    特定の資産を削除します。
    """
    asset = crud.get_asset(db, asset_id=asset_id)
    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ID {asset_id} の資産は見つかりませんでした",
        )
    try:
        return crud.delete_asset(db=db, asset_id=asset_id)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"データベースエラー: {str(e)}",
        )

# 価格更新のエンドポイント
@app.post("/prices/update", response_model=schemas.PriceUpdateResponse)
def update_prices(
    update_request: schemas.PriceUpdateRequest, db: Session = Depends(get_db)
):
    """
    選択された資産の価格を更新します。
    """
    try:
        updated_assets = crud.update_prices(db=db, asset_ids=update_request.asset_ids)
        return {"updated_assets": updated_assets, "updated_at": datetime.now()}
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"データベースエラー: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"価格更新エラー: {str(e)}",
        )

# パフォーマンス分析のエンドポイント
@app.get("/performance", response_model=schemas.PortfolioPerformance)
def get_performance(
    start_date: str, end_date: str, db: Session = Depends(get_db)
):
    """
    指定された期間のパフォーマンスデータを取得します。
    """
    try:
        # 日付形式の検証
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="日付形式が無効です。YYYY-MM-DD形式で指定してください。",
            )

        # 開始日が終了日より後の場合はエラー
        if start > end:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="開始日は終了日より前である必要があります。",
            )

        return crud.get_performance(db=db, start_date=start_date, end_date=end_date)
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"データベースエラー: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"パフォーマンス分析エラー: {str(e)}",
        )
