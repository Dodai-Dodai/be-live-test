package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"

	_ "github.com/mattn/go-sqlite3"
)

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

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

	name := r.FormValue("name")
	file, _, err := r.FormFile("image")
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	defer file.Close()

	imageData, err := ioutil.ReadAll(file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	id, err := InsertPersonAndImage(db, name, imageData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "Person added with ID: %d\n", id)
}

func getPersonNameHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	if r.Method == "OPTIONS" {
		enableCors(&w)
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "GET" {
		http.Error(w, "Unsupported method", http.StatusMethodNotAllowed)
		return
	}

	enableCors(&w)

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

	name, _, err := RetrievePersonAndImage(db, id)
	if err != nil {
		http.Error(w, "Person not found", http.StatusNotFound)
		return
	}

	fmt.Fprintf(w, "Name: %s\n", name)
}

func getPersonImageHandler(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	if r.Method == "OPTIONS" {
		enableCors(&w)
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != "GET" {
		http.Error(w, "Unsupported method", http.StatusMethodNotAllowed)
		return
	}

	enableCors(&w)

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

	_, imageData, err := RetrievePersonAndImage(db, id)
	if err != nil {
		http.Error(w, "Person not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "image/jpeg")
	w.Write(imageData)
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
	mux.HandleFunc("/get_person_name", func(w http.ResponseWriter, r *http.Request) {
		getPersonNameHandler(w, r, db)
	})
	mux.HandleFunc("/get_person_image", func(w http.ResponseWriter, r *http.Request) {
		getPersonImageHandler(w, r, db)
	})
	//index.html
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "index.html")
	})
	server := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}
	log.Fatal(server.ListenAndServe())
}
