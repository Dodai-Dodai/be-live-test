# peerjsサーバのインストール

## localhostで動かす場合のみ以下の手順を踏む

参考
https://reffect.co.jp/html/webrtcpeerjs


npm init -yコマンドを実行してpackage.jsonファイルを作成する
```sh
npm init -y
```

peerJSの サーバのライブラリを インストールします。
```sh
npm install peer
```

npxコマンドを利用した peerJS サーバを起動します。ここではポートの9000番で起動
```sh
npx peerjs --port 9000
```


## ホスト側
cast.htmlを開いて待機

## ゲスト側
viewer.htmlを開いて、フォームに自身のIDを入力
入力したIDがpeerIDとして使用される。