package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	// SQLiteのドライバ
	// database/sqlを経由して利用するため、ブランクインポートとする
	_ "github.com/mattn/go-sqlite3"
)

func InsertPersonAndImage(db *sql.DB, name string, imagePath string) (int64, error) {
	imageData, err := ioutil.ReadFile(imagePath)
	if err != nil {
		return 0, err
	}

	sqlIns := `INSERT INTO persons(name, imagedata) VALUES (?, ?);`
	result, err := db.Exec(sqlIns, name, imageData)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return id, nil
}

func RetrievePersonAndImage(db *sql.DB, id int, outputPath string) (string, error) {
	sqlQuery := `SELECT name, imagedata FROM persons WHERE id = ?;`
	row := db.QueryRow(sqlQuery, id)

	var name string
	var imageData []byte
	err := row.Scan(&name, &imageData)
	if err != nil {
		return "", err
	}

	err = ioutil.WriteFile(outputPath, imageData, 0644)
	if err != nil {
		return "", err
	}

	return name, nil

}

func handler(w http.ResponseWriter, r *http.Request) {
	b, err := ioutil.ReadAll(r.Body)
	if err != nil {
		fmt.Fprintln(w, err)
		return
	}
	fmt.Fprintln(w, string(b))
	log.Print(w, string(b))
}

func main() {
	// ここでDBに接続されるとは限らない
	db, err := sql.Open("sqlite3", "./be-live")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// DBの接続確認
	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	//DDL文実行
	ddl3 := `
	CREATE TABLE IF NOT EXISTS persons (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	imagedata BLOB);`

	if _, err := db.Exec(ddl3); err != nil {
		log.Fatal(err)
	}

	//ここからhttpサーバ
	mux := http.NewServeMux()
	mux.HandleFunc("/", handler)
	server := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}
	server.ListenAndServe()

}
