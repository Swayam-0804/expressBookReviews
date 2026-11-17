const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Base URL the Axios helpers use to call this same server
const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

/* ------------------------------------------------------------------ *
 *  Public routes (Tasks 1 - 6): serve data straight from booksdb.js
 * ------------------------------------------------------------------ */

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop
public_users.get('/', (req, res) => {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn]);
  }
  return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

// Get book details based on author
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const booksbyauthor = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, title: books[isbn].title, reviews: books[isbn].reviews }));

  if (booksbyauthor.length > 0) {
    return res.status(200).json({ booksbyauthor });
  }
  return res.status(404).json({ message: `No books found for author "${req.params.author}"` });
});

// Get all books based on title
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const booksbytitle = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, author: books[isbn].author, reviews: books[isbn].reviews }));

  if (booksbytitle.length > 0) {
    return res.status(200).json({ booksbytitle });
  }
  return res.status(404).json({ message: `No books found with title "${req.params.title}"` });
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn].reviews);
  }
  return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

/* ------------------------------------------------------------------ *
 *  Axios client (Tasks 10 - 13): promise callbacks and async/await
 *  Each helper calls the public routes above through Axios.
 * ------------------------------------------------------------------ */

// Task 10 - all books, using async/await
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// Task 11 - book by ISBN, using a Promise chain (.then / .catch)
const getBookByISBN = (isbn) => {
  return axios
    .get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data);
};

// Task 12 - books by author, using a Promise chain (.then / .catch)
const getBooksByAuthor = (author) => {
  return axios
    .get(`${BASE_URL}/author/${encodeURIComponent(author)}`)
    .then((response) => response.data);
};

// Task 13 - books by title, using async/await
const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
};

// Forward Axios errors (404 etc.) to the client with their original status
const sendAxiosError = (res, error) => {
  const status = error.response ? error.response.status : 500;
  const data = error.response ? error.response.data : { message: error.message };
  return res.status(status).json(data);
};

// Task 10: GET /async/books
public_users.get('/async/books', async (req, res) => {
  try {
    const data = await getAllBooks();
    return res.status(200).json(data);
  } catch (error) {
    return sendAxiosError(res, error);
  }
});

// Task 11: GET /async/isbn/:isbn
public_users.get('/async/isbn/:isbn', (req, res) => {
  getBookByISBN(req.params.isbn)
    .then((data) => res.status(200).json(data))
    .catch((error) => sendAxiosError(res, error));
});

// Task 12: GET /async/author/:author
public_users.get('/async/author/:author', (req, res) => {
  getBooksByAuthor(req.params.author)
    .then((data) => res.status(200).json(data))
    .catch((error) => sendAxiosError(res, error));
});

// Task 13: GET /async/title/:title
public_users.get('/async/title/:title', async (req, res) => {
  try {
    const data = await getBooksByTitle(req.params.title);
    return res.status(200).json(data);
  } catch (error) {
    return sendAxiosError(res, error);
  }
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
