import { useEffect } from 'react';
import { Company } from '../lib/supabase'; // Companyの型をインポート

// メタディスクリプションを更新するヘルパー関数
const updateMetaDescription = (description: string) => {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', description);
};

// カスタムフックの定義
export const useSeo = (currentPage: string, selectedCompany: Company | null) => {
  useEffect(() => {
    let title = '就活基地Webアプリ | ES・面接・企業情報の一元管理';
    let description = 'ES提出、Webテスト、面接、締切日を企業ごとに一括管理できる就活基地Webアプリです。効率的な就職活動をサポートします。';

    // ページごとの動的な設定
    if (currentPage === 'company' && selectedCompany) {
      title = `${selectedCompany.name} - 企業詳細 | 就活基地`;
      description = `${selectedCompany.name}の基本情報、選考フロー、ES/Webテスト締切をまとめて確認。${selectedCompany.name}に関する全てのタスクをここで管理します。`;
    } else if (currentPage === 'analysis' && selectedCompany) {
      title = `${selectedCompany.name} - 企業分析 | 就活基地`;
      description = `${selectedCompany.name}の企業分析・対策ページ。SWOT分析や独自のメモを記録し、面接・ES対策を強化します。`;
    } else if (currentPage === 'es' && selectedCompany) {
      title = `${selectedCompany.name} - ES管理 | 就活基地`;
      description = `${selectedCompany.name}向けのES作成・管理ページ。過去の提出内容やテーマを保存し、効率的なES対策を可能にします。`;
    } else if (currentPage === 'interview' && selectedCompany) {
      title = `${selectedCompany.name} - 面接管理 | 就活基地`;
      description = `${selectedCompany.name}の面接対策と記録ページ。面接官、質問内容、対策状況を詳細に記録し、選考突破を目指します。`;
    }
    
    // タイトルとディスクリプションを更新
    document.title = title;
    updateMetaDescription(description);

  }, [currentPage, selectedCompany]);
};