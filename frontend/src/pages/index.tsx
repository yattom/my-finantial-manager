import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>金融資産マネジメントシステム</title>
        <meta name="description" content="個人向け金融資産マネジメントシステム" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div className="container">
          <h1 className="text-3xl font-bold my-6">金融資産マネジメントシステム</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">ポートフォリオ概要</h2>
              <p className="mb-4">あなたの金融資産の概要を確認できます。</p>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/portfolio')}
              >
                ポートフォリオを見る
              </button>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">資産追加</h2>
              <p className="mb-4">新しい株式や投資信託を追加します。</p>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/assets/add')}
              >
                資産を追加
              </button>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">パフォーマンス分析</h2>
              <p className="mb-4">期間を指定して資産のパフォーマンスを分析します。</p>
              <button 
                className="btn btn-primary"
                onClick={() => router.push('/performance')}
              >
                パフォーマンスを分析
              </button>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">価格更新</h2>
              <p className="mb-4">保有銘柄の最新価格を取得します。</p>
              <button 
                className="btn btn-secondary"
                onClick={() => router.push('/prices/update')}
              >
                価格を更新
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
