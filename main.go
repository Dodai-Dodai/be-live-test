package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	_ "github.com/mattn/go-sqlite3"
)

func InsertPersonAndImage(db *sql.DB, name string, imageData []byte) (int64, error) {
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

func RetrievePersonAndImage(db *sql.DB, id int) (string, []byte, error) {
	sqlQuery := `SELECT name, imagedata FROM persons WHERE id = ?;`
	row := db.QueryRow(sqlQuery, id)

	var name string
	var imageData []byte
	err := row.Scan(&name, &imageData)
	if err != nil {
		return "", nil, err
	}
	return name, imageData, nil
}

func addPersonHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	if r.Method != "POST" {
		http.Error(w, "Unsupported method", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name     string `json:"name"`
		ImageURL string `json:"image_url"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	imageData, err := ioutil.ReadFile(req.ImageURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := InsertPersonAndImage(db, req.Name, imageData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Person added with ID: %d\n", id)
}

func getPersonHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	if r.Method != "GET" {
		http.Error(w, "Unsupported method", http.StatusMethodNotAllowed)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "ID is required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	name, imageData, err := RetrievePersonAndImage(db, id)
	if err != nil {
		http.Error(w, "Person not found", http.StatusNotFound)
		return
	}

	log.Print(name)

	// ユーザーの名前と画像データを返す
	w.Header().Set("Content-Type", "image/jpeg") // 適切なMIMEタイプを設定
	w.Write(imageData)                           // 画像データをバイナリ形式で直接返す
}

func main() {
	db, err := sql.Open("sqlite3", "./be-live")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal(err)
	}

	ddl := `
	CREATE TABLE IF NOT EXISTS persons (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	imagedata BLOB);`
	if _, err := db.Exec(ddl); err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/add_person", func(w http.ResponseWriter, r *http.Request) {
		addPersonHandler(w, r, db)
	})
	mux.HandleFunc("/get_person", func(w http.ResponseWriter, r *http.Request) {
		getPersonHandler(w, r, db)
	})
	server := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}
	log.Fatal(server.ListenAndServe())
}
