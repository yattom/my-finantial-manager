import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 型定義
interface Asset {
  id: number;
  name: string;
  ticker: string;
  type: string;
  quantity: number;
  current_price: number;
  current_value: number;
  purchase_price: number;
  purchase_date: string;
  performance: number;
}

interface AssetSummary {
  total_value: number;
  total_cost: number;
  total_gain_loss: number;
  total_performance: number;
  asset_allocation: {
    type: string;
    value: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Portfolio() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 実際のAPIが実装されたら、このURLを変更する
        const response = await axios.get('/api/assets');
        setAssets(response.data.assets);
        setSummary(response.data.summary);
        setError('');
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError('ポートフォリオデータの取得に失敗しました。');
        
        // 開発用のダミーデータ
        const dummyAssets: Asset[] = [
          {
            id: 1,
            name: '日本株式インデックス',
            ticker: '1234',
            type: '投資信託',
            quantity: 100,
            current_price: 15000,
            current_value: 1500000,
            purchase_price: 14000,
            purchase_date: '2023-01-15',
            performance: 7.14
          },
          {
            id: 2,
            name: '米国株式インデックス',
            ticker: '5678',
            type: '投資信託',
            quantity: 50,
            current_price: 25000,
            current_value: 1250000,
            purchase_price: 22000,
            purchase_date: '2023-02-20',
            performance: 13.64
          },
          {
            id: 3,
            name: 'トヨタ自動車',
            ticker: '7203',
            type: '株式',
            quantity: 200,
            current_price: 2500,
            current_value: 500000,
            purchase_price: 2200,
            purchase_date: '2023-03-10',
            performance: 13.64
          }
        ];
        
        const dummySummary: AssetSummary = {
          total_value: 3250000,
          total_cost: 3000000,
          total_gain_loss: 250000,
          total_performance: 8.33,
          asset_allocation: [
            { type: '投資信託', value: 2750000 },
            { type: '株式', value: 500000 }
          ]
        };
        
        setAssets(dummyAssets);
        setSummary(dummySummary);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="container">読み込み中...</div>;
  }

  return (
    <>
      <Head>
        <title>ポートフォリオ | 金融資産マネジメントシステム</title>
        <meta name="description" content="あなたの金融資産ポートフォリオ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <div className="container">
          <h1 className="text-3xl font-bold my-6">ポートフォリオ概要</h1>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">資産概要</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-light-text-color">総資産額</p>
                    <p className="text-2xl font-bold">{summary.total_value.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-light-text-color">総投資額</p>
                    <p className="text-2xl font-bold">{summary.total_cost.toLocaleString()}円</p>
                  </div>
                  <div>
                    <p className="text-light-text-color">総損益</p>
                    <p className={`text-2xl font-bold ${summary.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.total_gain_loss.toLocaleString()}円
                    </p>
                  </div>
                  <div>
                    <p className="text-light-text-color">パフォーマンス</p>
                    <p className={`text-2xl font-bold ${summary.total_performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.total_performance.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">資産配分</h2>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={summary.asset_allocation}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="type"
                      >
                        {summary.asset_allocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()}円`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">保有資産一覧</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>名称</th>
                    <th>種類</th>
                    <th>数量</th>
                    <th>現在価格</th>
                    <th>現在価値</th>
                    <th>購入価格</th>
                    <th>パフォーマンス</th>
                    <th>アクション</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id}>
                      <td>{asset.name}</td>
                      <td>{asset.type}</td>
                      <td>{asset.quantity}</td>
                      <td>{asset.current_price.toLocaleString()}円</td>
                      <td>{asset.current_value.toLocaleString()}円</td>
                      <td>{asset.purchase_price.toLocaleString()}円</td>
                      <td className={asset.performance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {asset.performance.toFixed(2)}%
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary btn-sm mr-2"
                          onClick={() => router.push(`/assets/${asset.id}`)}
                        >
                          詳細
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              className="btn btn-secondary"
              onClick={() => router.push('/assets/add')}
            >
              資産を追加
            </button>
            <button 
              className="btn btn-primary ml-4"
              onClick={() => router.push('/')}
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
