# Express Book Review

Online book review application (IBM Node.js capstone) built with **Express**, **JWT + express-session**, and **Axios**.

## Run it

```bash
cd final_project
npm install
npm start          # http://localhost:5000
```

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | – | All books |
| GET | `/isbn/:isbn` | – | Book by ISBN |
| GET | `/author/:author` | – | Books by author |
| GET | `/title/:title` | – | Books by title |
| GET | `/review/:isbn` | – | Reviews of a book |
| POST | `/register` | – | Register `{username, password}` |
| POST | `/customer/login` | – | Login, sets session cookie |
| PUT | `/customer/auth/review/:isbn?review=...` | ✔ | Add or modify your review |
| DELETE | `/customer/auth/review/:isbn` | ✔ | Delete your review |
| GET | `/async/books`, `/async/isbn/:isbn`, `/async/author/:author`, `/async/title/:title` | – | Same data fetched through Axios (async/await and Promise chains) in `router/general.js` |

## Generate the cURL output files

```bash
cd final_project
./capture_outputs.sh <your-github-username>
```

This creates `githubrepo`, `getallbooks`, `getbooksbyISBN`, `getbooksbyauthor`, `getbooksbytitle`, `getbookreview`, `register`, `login`, `reviewadded` and `deletereview`.
