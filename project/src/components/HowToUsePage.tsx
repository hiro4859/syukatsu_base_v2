import { BookOpen, Home, Building2, FileText, MessageSquare, BarChart3, List } from 'lucide-react';
import { useSeo } from '../hooks/useSeo';

export default function HowToUsePage() {
  useSeo('使い方 | 就活基地', 'サイトの使い方と各機能の詳細説明');

  const sections = [
    {
      id: 'company-management',
      icon: Building2,
      title: '1. 企業の追加と一覧管理',
      description: '企業を登録し、効率的に管理するための基本機能です',
      features: [
        {
          title: '企業の追加',
          content: 'まずは選考中、または検討している企業をリストに追加しましょう。',
        },
        {
          title: '企業カードの活用',
          content: '登録すると「企業カード」が生成されます。カードをクリックすると「企業詳細ページ」へ移動します。',
        },
        {
          title: '整理・検索機能',
          content: 'カードは「業界ごとの絞り込み」や、「締切順・登録日順・志望度順」での並び替えが可能です。',
        },
      ],
    },
    {
      id: 'company-detail',
      icon: Building2,
      title: '2. 企業詳細ページ（基本情報・選考フロー）',
      description: '企業の基本情報と選考の進捗を一元管理できます',
      features: [
        {
          title: '基本情報の入力',
          content: '企業名、画像、業界、URL、マイページID・パスワード、現在の状況、次回選考日、ES・Webテスト締切、テスト形式、志望度、メモを管理できます。',
        },
        {
          title: '採用フローの登録',
          content: '各フローはデフォルトから登録できるほか、自由にカスタムして追加も可能です。順番は右側の矢印で自由に変更できます。',
        },
        {
          title: 'タスク管理',
          content: '企業ごとのタスクと、その実行日を登録して管理できます。',
        },
      ],
    },
    {
      id: 'es-page',
      icon: FileText,
      title: '3. ES（エントリーシート）ページ',
      description: 'ESの作成と管理を効率化する専用ページです',
      features: [
        {
          title: '台本の編集・保存',
          content: '企業ごとのES台本を編集し、整理して保存できる専用ページです。',
        },
        {
          title: '分析データの参照',
          content: '分析ページに移動することなく、ESを書きながらその場で直接「企業分析」の内容を確認できます。',
        },
        {
          title: '文字数チェック',
          content: '指定の文字数以内かチェックできる機能を搭載しています。',
        },
        {
          title: 'テンプレート・コピー機能',
          content: '納得のいくESが書けたら「テンプレート保存」しましょう。別の企業で同じ内容（自己PRやガクチカ等）を使いたい時に、すぐに読み出すことができます。コピー機能も利用可能です。',
        },
      ],
    },
    {
      id: 'interview-page',
      icon: MessageSquare,
      title: '4. 面接対策ページ',
      description: '面接の準備と振り返りを記録・管理できます',
      features: [
        {
          title: '面接台本の作成',
          content: 'テーマ、話す内容、詳細な台本を編集・保存できます。',
        },
        {
          title: '分析データの同時確認',
          content: 'ESページ同様、企業分析の内容を直接見ながら対策を練ることが可能です。',
        },
        {
          title: '振り返り・評価',
          content: '面接終了後の振り返りや、満足度を入力する欄があり、次回の選考に活かせます。',
        },
        {
          title: 'テンプレート読み込み',
          content: '保存したテンプレートを呼び出して、効率的に準備ができます。',
        },
      ],
    },
    {
      id: 'company-analysis',
      icon: BarChart3,
      title: '5. 企業分析ページ',
      description: '企業研究の内容を体系的に整理できます',
      features: [
        {
          title: '豊富な入力項目',
          content: '基礎情報、事業、製品、企業文化、理念など、デフォルトで20個の項目を用意しています。',
        },
        {
          title: '項目のカスタマイズ',
          content: '「カスタムフィールド」から項目の追加・非表示・削除ができるため、説明会などのメモにも最適です。',
        },
      ],
    },
    {
      id: 'top-page-features',
      icon: Home,
      title: '6. トップページの便利な機能',
      description: '締切管理とクイックアクセスで効率的に作業できます',
      features: [
        {
          title: '直近の締切エリアの表示切替',
          content: '「直近の締切」エリアは右上のアイコンで折りたたみ・展開が可能です。また「全て表示」ボタンで全ての締切を一覧表示できます。',
        },
        {
          title: 'タスクの追加',
          content: '締切エリア内の「タスクを追加」ボタンから、自由にタスクを登録できます。タスク名と期限を設定し、企業を選択することも、選択せずに自由なタスクとして登録することもできます。',
        },
        {
          title: '企業ごとのタスク表示',
          content: '企業カードの「タスク」ボタンをクリックすると、その企業に紐付けられたタスクと締切が一覧表示されます。',
        },
        {
          title: 'クイックアクセス',
          content: '表示されている締切をクリックすると、その企業の詳細ページへ直接移動できます。',
        },
      ],
    },
    {
      id: 'menu-and-list',
      icon: List,
      title: '7. メニューバーと一括管理',
      description: '全ての情報を横断的に確認・管理できます',
      features: [
        {
          title: 'ナビゲーション',
          content: '左上の三本線（メニューバー）から、ES一覧、面接一覧、使い方、アカウント設定ページへ飛べます。',
        },
        {
          title: '全データの一括閲覧',
          content: '「ES一覧」「面接一覧」の各ページでは、テンプレート保存した台本や、各企業ごとに保存したすべてのES・面接台本を一元的に確認することが可能です。',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-blue-600" />
            アプリの使い方ガイド
          </h1>
          <p className="text-slate-600 mt-3 text-lg">
            このアプリは、就職活動における企業情報、選考ステータス、提出書類、面接対策を一括管理できるツールです。
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Icon className="w-8 h-8" />
                    {section.title}
                  </h2>
                  <p className="text-blue-100 mt-2">{section.description}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {section.features.map((feature, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-sm font-bold">
                            {index + 1}
                          </span>
                          {feature.title}
                        </h3>
                        <p className="text-slate-700 leading-relaxed">{feature.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
