# sqlite3インストールして

https://qiita.com/inakuuun/items/ae5fa17341db76247f88

https://qiita.com/sato_ken09/items/bd0c5d522eb1e20fe61c

# go 動かすよ

```sh
go run main.go
```

# curlする

## 追加

```sh
curl -X POST -H "Content-Type: application/json" -d '{"name":"John Doe", "image_url":"画像の保存場所"}' http://localhost:8080/add_person
```

## 参照(名前)
```id=```のところに値入れる
```sh
curl -X GET 'http://localhost:8080/get_person_name?id=1'
```

## 参照(画像)
```sh
curl -X GET 'http://localhost:8080/get_person_image?id=1' -o person_image.jpg

```