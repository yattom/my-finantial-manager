import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface FormData {
  name: string;
  ticker: string;
  type: string;
  quantity: number;
  purchase_price: number;
  purchase_date: Date;
}

export default function AddAsset() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    ticker: '',
    type: '株式',
    quantity: 0,
    purchase_price: 0,
    purchase_date: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' || name === 'purchase_price' ? parseFloat(value) : value,
    });
  };

  const handleDateChange = (date: Date) => {
    setFormData({
      ...formData,
      purchase_date: date,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 実際のAPIが実装されたら、このURLを変更する
      await axios.post('/api/assets', {
        ...formData,
        purchase_date: format(formData.purchase_date, 'yyyy-MM-dd'),
      });
      
      // 成功したらポートフォリオページに戻る
      router.push('/portfolio');
    } catch (err) {
      console.error('Error adding asset:', err);
      setError('資産の追加に失敗しました。');
      
      // 開発中は成功したことにする
      setTimeout(() => {
        router.push('/portfolio');
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>資産追加 | 金融資産マネジメントシステム</title>
        <meta name="description" content="新しい資産を追加する" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <div className="container">
          <h1 className="text-3xl font-bold my-6">資産追加</h1>
          
          {error && <div className="alert alert-danger mb-4">{error}</div>}
          
          <div className="card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name" className="form-label">名称</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="ticker" className="form-label">ティッカーシンボル</label>
                <input
                  type="text"
                  id="ticker"
                  name="ticker"
                  className="form-input"
                  value={formData.ticker}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="type" className="form-label">種類</label>
                <select
                  id="type"
                  name="type"
                  className="form-input"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="株式">株式</option>
                  <option value="投資信託">投資信託</option>
                  <option value="ETF">ETF</option>
                  <option value="債券">債券</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="quantity" className="form-label">数量</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  className="form-input"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="purchase_price" className="form-label">購入価格（円）</label>
                <input
                  type="number"
                  id="purchase_price"
                  name="purchase_price"
                  className="form-input"
                  value={formData.purchase_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="purchase_date" className="form-label">購入日</label>
                <DatePicker
                  id="purchase_date"
                  selected={formData.purchase_date}
                  onChange={handleDateChange}
                  dateFormat="yyyy/MM/dd"
                  className="form-input"
                  locale={ja}
                  required
                />
              </div>
              
              <div className="mt-6">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? '処理中...' : '追加する'}
                </button>
                <button 
                  type="button" 
                  className="btn ml-4"
                  onClick={() => router.push('/portfolio')}
                  disabled={loading}
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
