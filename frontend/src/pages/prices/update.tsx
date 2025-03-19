import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { format } from 'date-fns';

interface Asset {
  id: number;
  name: string;
  ticker: string;
  type: string;
  current_price: number;
  last_updated: string;
}

export default function UpdatePrices() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // バックエンドAPIから資産データを取得
      const response = await axios.get('/api/assets');
      const assetData = response.data.assets || [];
      
      setAssets(assetData);
      // 初期状態では全ての資産を選択
      setSelectedAssets(assetData.map((asset: Asset) => asset.id));
      setError('');
    } catch (err) {
      console.error('Error fetching assets:', err);
      
      // エラーメッセージを表示
      if (axios.isAxiosError(err) && err.response) {
        // APIからのエラーメッセージがある場合はそれを表示
        setError(`資産データの取得に失敗しました: ${err.response.data.detail || err.message}`);
      } else {
        // その他のエラー
        setError('資産データの取得に失敗しました。ネットワーク接続を確認してください。');
      }
      
      // 資産データが取得できない場合は空の配列を設定
      setAssets([]);
      setSelectedAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssetSelection = (assetId: number) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  const selectAll = () => {
    setSelectedAssets(assets.map(asset => asset.id));
  };

  const deselectAll = () => {
    setSelectedAssets([]);
  };

  const updatePrices = async () => {
    if (selectedAssets.length === 0) {
      setError('更新する資産を選択してください。');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      // バックエンドAPIを呼び出して価格を更新
      const response = await axios.post('/api/prices/update', {
        asset_ids: selectedAssets
      });
      
      // 更新された資産情報を取得
      const updatedAssets = response.data.updated_assets;
      
      // 成功メッセージを表示
      setSuccess('価格の更新が完了しました。');
      
      // 資産リストを更新
      if (updatedAssets && updatedAssets.length > 0) {
        // 更新された資産情報で資産リストを更新
        setAssets(assets.map(asset => {
          // 更新された資産を探す
          const updatedAsset = updatedAssets.find((updated: any) => updated.id === asset.id);
          if (updatedAsset) {
            return {
              ...asset,
              current_price: updatedAsset.current_price,
              last_updated: updatedAsset.last_updated
            };
          }
          return asset;
        }));
      } else {
        // 更新された資産情報がない場合は、最新の資産情報を再取得
        fetchAssets();
      }
    } catch (err) {
      console.error('Error updating prices:', err);
      
      // エラーメッセージを表示
      if (axios.isAxiosError(err) && err.response) {
        // APIからのエラーメッセージがある場合はそれを表示
        setError(`価格の更新に失敗しました: ${err.response.data.detail || err.message}`);
      } else {
        // その他のエラー
        setError('価格の更新に失敗しました。ネットワーク接続を確認してください。');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="container">読み込み中...</div>;
  }

  return (
    <>
      <Head>
        <title>価格更新 | 金融資産マネジメントシステム</title>
        <meta name="description" content="保有銘柄の価格を更新する" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <div className="container">
          <h1 className="text-3xl font-bold my-6">価格更新</h1>
          
          {error && <div className="alert alert-danger mb-4">{error}</div>}
          {success && <div className="alert alert-success mb-4">{success}</div>}
          
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">更新する資産を選択</h2>
            
            <div className="mb-4">
              <button 
                className="btn btn-secondary mr-2"
                onClick={selectAll}
                disabled={updating}
              >
                すべて選択
              </button>
              <button 
                className="btn"
                onClick={deselectAll}
                disabled={updating}
              >
                すべて解除
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>選択</th>
                    <th>名称</th>
                    <th>ティッカー</th>
                    <th>種類</th>
                    <th>現在価格</th>
                    <th>最終更新日</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedAssets.includes(asset.id)}
                          onChange={() => toggleAssetSelection(asset.id)}
                          disabled={updating}
                        />
                      </td>
                      <td>{asset.name}</td>
                      <td>{asset.ticker}</td>
                      <td>{asset.type}</td>
                      <td>{asset.current_price.toLocaleString()}円</td>
                      <td>{asset.last_updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <button 
              className="btn btn-primary"
              onClick={updatePrices}
              disabled={updating || selectedAssets.length === 0}
            >
              {updating ? '更新中...' : '選択した資産の価格を更新'}
            </button>
          </div>
          
          <div>
            <button 
              className="btn"
              onClick={() => router.push('/')}
              disabled={updating}
            >
              ホームに戻る
            </button>
            <button 
              className="btn btn-secondary ml-4"
              onClick={() => router.push('/portfolio')}
              disabled={updating}
            >
              ポートフォリオを見る
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
