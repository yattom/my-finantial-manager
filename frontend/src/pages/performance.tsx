import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { format, subMonths, subYears } from 'date-fns';
import { ja } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PerformanceData {
  date: string;
  value: number;
  change_percent: number;
}

interface AssetPerformance {
  id: number;
  name: string;
  ticker: string;
  type: string;
  performance: PerformanceData[];
}

interface PortfolioPerformance {
  total_performance: PerformanceData[];
  assets_performance: AssetPerformance[];
}

export default function Performance() {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [performanceData, setPerformanceData] = useState<PortfolioPerformance | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('6m');

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    fetchPerformanceData();
  }, [startDate, endDate]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      // 実際のAPIが実装されたら、このURLを変更する
      const response = await axios.get('/api/performance', {
        params: {
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        },
      });
      setPerformanceData(response.data);
      
      // 初期状態では全ての資産を選択
      if (response.data && response.data.assets_performance) {
        setSelectedAssets(response.data.assets_performance.map((asset: AssetPerformance) => asset.id));
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError('パフォーマンスデータの取得に失敗しました。');
      
      // 開発用のダミーデータ
      const dummyDates = [];
      const today = new Date();
      for (let i = 180; i >= 0; i -= 7) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dummyDates.push(format(date, 'yyyy-MM-dd'));
      }
      
      const generatePerformanceData = (baseValue: number, volatility: number): PerformanceData[] => {
        let currentValue = baseValue;
        return dummyDates.map((date, index) => {
          const change = (Math.random() - 0.5) * volatility;
          currentValue = currentValue * (1 + change);
          const changePercent = index === 0 ? 0 : ((currentValue / baseValue) - 1) * 100;
          
          return {
            date,
            value: Math.round(currentValue),
            change_percent: parseFloat(changePercent.toFixed(2))
          };
        });
      };
      
      const dummyData: PortfolioPerformance = {
        total_performance: generatePerformanceData(3000000, 0.02),
        assets_performance: [
          {
            id: 1,
            name: '日本株式インデックス',
            ticker: '1234',
            type: '投資信託',
            performance: generatePerformanceData(1500000, 0.03)
          },
          {
            id: 2,
            name: '米国株式インデックス',
            ticker: '5678',
            type: '投資信託',
            performance: generatePerformanceData(1250000, 0.04)
          },
          {
            id: 3,
            name: 'トヨタ自動車',
            ticker: '7203',
            type: '株式',
            performance: generatePerformanceData(500000, 0.05)
          }
        ]
      };
      
      setPerformanceData(dummyData);
      setSelectedAssets(dummyData.assets_performance.map(asset => asset.id));
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    const now = new Date();
    
    switch (range) {
      case '1m':
        setStartDate(subMonths(now, 1));
        break;
      case '3m':
        setStartDate(subMonths(now, 3));
        break;
      case '6m':
        setStartDate(subMonths(now, 6));
        break;
      case '1y':
        setStartDate(subYears(now, 1));
        break;
      case '3y':
        setStartDate(subYears(now, 3));
        break;
      case 'custom':
        // カスタム範囲の場合は何もしない（ユーザーが日付を選択する）
        break;
    }
    
    setEndDate(now);
  };

  const toggleAssetSelection = (assetId: number) => {
    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter(id => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };

  if (loading) {
    return <div className="container">読み込み中...</div>;
  }

  return (
    <>
      <Head>
        <title>パフォーマンス分析 | 金融資産マネジメントシステム</title>
        <meta name="description" content="資産のパフォーマンス分析" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <div className="container">
          <h1 className="text-3xl font-bold my-6">パフォーマンス分析</h1>
          
          {error && <div className="alert alert-danger mb-4">{error}</div>}
          
          <div className="card mb-6">
            <div className="flex flex-wrap items-center mb-4">
              <div className="mr-4 mb-2">
                <button 
                  className={`btn ${timeRange === '1m' ? 'btn-primary' : ''}`}
                  onClick={() => handleTimeRangeChange('1m')}
                >
                  1ヶ月
                </button>
              </div>
              <div className="mr-4 mb-2">
                <button 
                  className={`btn ${timeRange === '3m' ? 'btn-primary' : ''}`}
                  onClick={() => handleTimeRangeChange('3m')}
                >
                  3ヶ月
                </button>
              </div>
              <div className="mr-4 mb-2">
                <button 
                  className={`btn ${timeRange === '6m' ? 'btn-primary' : ''}`}
                  onClick={() => handleTimeRangeChange('6m')}
                >
                  6ヶ月
                </button>
              </div>
              <div className="mr-4 mb-2">
                <button 
                  className={`btn ${timeRange === '1y' ? 'btn-primary' : ''}`}
                  onClick={() => handleTimeRangeChange('1y')}
                >
                  1年
                </button>
              </div>
              <div className="mr-4 mb-2">
                <button 
                  className={`btn ${timeRange === '3y' ? 'btn-primary' : ''}`}
                  onClick={() => handleTimeRangeChange('3y')}
                >
                  3年
                </button>
              </div>
              <div className="mr-4 mb-2">
                <button 
                  className={`btn ${timeRange === 'custom' ? 'btn-primary' : ''}`}
                  onClick={() => handleTimeRangeChange('custom')}
                >
                  カスタム
                </button>
              </div>
            </div>
            
            {timeRange === 'custom' && (
              <div className="flex flex-wrap items-center mb-4">
                <div className="mr-4 mb-2">
                  <label className="form-label">開始日</label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date: Date) => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="yyyy/MM/dd"
                    className="form-input"
                    locale={ja}
                  />
                </div>
                <div className="mb-2">
                  <label className="form-label">終了日</label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date: Date) => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="yyyy/MM/dd"
                    className="form-input"
                    locale={ja}
                  />
                </div>
              </div>
            )}
          </div>
          
          {performanceData && (
            <>
              <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">ポートフォリオ全体のパフォーマンス</h2>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={performanceData.total_performance}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={formatYAxis} />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toLocaleString()}円`, '資産価値']}
                        labelFormatter={(label) => `日付: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="ポートフォリオ価値"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4">
                  <p className="font-semibold">
                    期間パフォーマンス: 
                    <span className={`ml-2 ${performanceData.total_performance[performanceData.total_performance.length - 1].change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {performanceData.total_performance[performanceData.total_performance.length - 1].change_percent.toFixed(2)}%
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="card mb-6">
                <h2 className="text-xl font-semibold mb-4">資産別パフォーマンス</h2>
                
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">表示する資産:</h3>
                  <div className="flex flex-wrap">
                    {performanceData.assets_performance.map((asset, index) => (
                      <div key={asset.id} className="mr-4 mb-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAssets.includes(asset.id)}
                            onChange={() => toggleAssetSelection(asset.id)}
                            className="mr-2"
                          />
                          <span style={{ color: COLORS[index % COLORS.length] }}>
                            {asset.name}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        allowDuplicatedCategory={false}
                        type="category"
                      />
                      <YAxis tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        formatter={(value) => [`${Number(value).toFixed(2)}%`, '変化率']}
                        labelFormatter={(label) => `日付: ${label}`}
                      />
                      <Legend />
                      
                      {performanceData.assets_performance
                        .filter(asset => selectedAssets.includes(asset.id))
                        .map((asset, index) => (
                          <Line
                            key={asset.id}
                            data={asset.performance}
                            type="monotone"
                            dataKey="change_percent"
                            name={asset.name}
                            stroke={COLORS[index % COLORS.length]}
                            activeDot={{ r: 8 }}
                          />
                        ))
                      }
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="card">
                <h2 className="text-xl font-semibold mb-4">資産別パフォーマンス詳細</h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>資産名</th>
                        <th>種類</th>
                        <th>開始時価値</th>
                        <th>現在価値</th>
                        <th>変化額</th>
                        <th>変化率</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.assets_performance.map((asset) => {
                        const firstValue = asset.performance[0].value;
                        const lastValue = asset.performance[asset.performance.length - 1].value;
                        const changeValue = lastValue - firstValue;
                        const changePercent = ((lastValue / firstValue) - 1) * 100;
                        
                        return (
                          <tr key={asset.id}>
                            <td>{asset.name}</td>
                            <td>{asset.type}</td>
                            <td>{firstValue.toLocaleString()}円</td>
                            <td>{lastValue.toLocaleString()}円</td>
                            <td className={changeValue >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {changeValue >= 0 ? '+' : ''}{changeValue.toLocaleString()}円
                            </td>
                            <td className={changePercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          <div className="mt-6">
            <button 
              className="btn btn-primary"
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
