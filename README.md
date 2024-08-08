# vue-sqlite3-wasm

Sqlite-wasmを利用したやることリストのサンプルVueプロジェクトです．  

## セットアップ
```
npm install
```

ブラウザでOPFSを確認したい場合，OPFS Explorerなどの拡張機能をインストールする．  

## 起動
```
npm run dev
```

## 構成
* Typescript
* Vue3(Composition APIを使用)
* Vuetify
* Sqlite-wasm

## ファイル構成

**main.ts**  
Vueのエントリポイント

**App.vue**  
やることリストの画面ファイル

**constants.ts**  
定数定義ファイル

**composable**  
App.vueのCompositionを分離したもの

**sqlite3フォルダ**  
sqlite-wasmをラップしたSqliteDriverを定義したもの

**clientsフォルダ**  
SqliteDriverをラップしたもの  
Web APIへの切り替えはここを拡張することを想定