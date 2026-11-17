#!/usr/bin/env bash
# Usage:  ./capture_outputs.sh <your-github-username>
# Starts the server, runs every cURL command from the assignment and saves
# "command + output" into the files the graded questions ask for.
set -u
cd "$(dirname "$0")"

GITHUB_USER="${1:-YOUR_GITHUB_USERNAME}"
BASE="http://localhost:5000"
JAR="cookies.txt"

rm -f "$JAR"
node index.js > server.log 2>&1 &
SERVER_PID=$!
trap 'kill $SERVER_PID 2>/dev/null; rm -f "$JAR"' EXIT

for _ in $(seq 1 30); do
  curl -s "$BASE/" > /dev/null && break
  sleep 0.5
done

# capture <file> <command string>  ->  file contains "$ command" then its output
capture() {
  local file="$1" cmd="$2"
  { echo "\$ $cmd"; echo; eval "$cmd"; echo; } > "$file" 2>&1
  echo "saved -> $file"
}

# Q1 - fork check (needs internet and your real fork)
capture githubrepo "curl -s https://api.github.com/repos/$GITHUB_USER/expressBookReview"

# Q2 - Q5 - public routes
capture getallbooks    "curl -s $BASE/"
capture getbooksbyISBN "curl -s $BASE/isbn/1"
capture getbooksbyauthor "curl -s $BASE/author/Chinua%20Achebe"
capture getbooksbytitle  "curl -s $BASE/title/Pride%20and%20Prejudice"

# Q6 - initial review (empty before anyone reviews)
capture getbookreview "curl -s $BASE/review/1"

# Q7 - register
capture register "curl -s -X POST $BASE/register -H 'Content-Type: application/json' -d '{\"username\":\"user1\",\"password\":\"pwd1\"}'"

# Q8 - login (session cookie saved in $JAR)
capture login "curl -s -c $JAR -X POST $BASE/customer/login -H 'Content-Type: application/json' -d '{\"username\":\"user1\",\"password\":\"pwd1\"}'"

# Q9 - add / modify a review
capture reviewadded "curl -s -b $JAR -X PUT '$BASE/customer/auth/review/1?review=Excellent%20classic%20novel'"

# Q10 - delete the review
capture deletereview "curl -s -b $JAR -X DELETE $BASE/customer/auth/review/1"
