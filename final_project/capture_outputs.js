// Usage (works in Windows Command Prompt, PowerShell, Git Bash, Mac, Linux):
//   node capture_outputs.js <github-username> [repo-name]
// Example:
//   node capture_outputs.js Swayam-0804 expressBookReviews
//
// Starts the server, runs the real curl commands from the assignment, and saves
// "command + output" into the files the graded questions ask for.
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GITHUB_USER = process.argv[2];
const REPO = process.argv[3] || 'expressBookReview';
const BASE = 'http://localhost:5000';
const JAR = 'cookies.txt';

if (!GITHUB_USER) {
  console.error('Usage: node capture_outputs.js <github-username> [repo-name]');
  process.exit(1);
}
process.chdir(__dirname);

if (spawnSync('curl', ['--version']).error) {
  console.error('curl was not found. Install curl or use Git Bash, then try again.');
  process.exit(1);
}

// How the command is shown inside the output files (bash-style quoting)
const show = (args) =>
  'curl ' + args.map((a) => (/^[A-Za-z0-9_@%+=:,.\/-]+$/.test(a) ? a : `'${a}'`)).join(' ');

const json = (obj) => JSON.stringify(obj);
const H = ['-H', 'Content-Type: application/json'];

const steps = [
  ['githubrepo',       ['-s', `https://api.github.com/repos/${GITHUB_USER}/${REPO}`]],
  ['getallbooks',      ['-s', `${BASE}/`]],
  ['getbooksbyISBN',   ['-s', `${BASE}/isbn/1`]],
  ['getbooksbyauthor', ['-s', `${BASE}/author/Chinua%20Achebe`]],
  ['getbooksbytitle',  ['-s', `${BASE}/title/Pride%20and%20Prejudice`]],
  ['getbookreview',    ['-s', `${BASE}/review/1`]],
  ['register',         ['-s', '-X', 'POST', `${BASE}/register`, ...H, '-d', json({ username: 'user1', password: 'pwd1' })]],
  ['login',            ['-s', '-c', JAR, '-X', 'POST', `${BASE}/customer/login`, ...H, '-d', json({ username: 'user1', password: 'pwd1' })]],
  ['reviewadded',      ['-s', '-b', JAR, '-X', 'PUT', `${BASE}/customer/auth/review/1?review=Excellent%20classic%20novel`]],
  ['deletereview',     ['-s', '-b', JAR, '-X', 'DELETE', `${BASE}/customer/auth/review/1`]],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try { fs.unlinkSync(JAR); } catch (e) {}

  let exited = false;
  const server = spawn(process.execPath, ['index.js'], { stdio: 'ignore' });
  server.on('exit', () => { exited = true; });

  const stop = () => {
    try { server.kill(); } catch (e) {}
    try { fs.unlinkSync(JAR); } catch (e) {}
  };

  let ready = false;
  for (let i = 0; i < 40 && !ready; i++) {
    await sleep(500);
    if (exited) {
      console.error('The server could not start. Port 5000 is probably busy: stop any other running server (Ctrl + C) and try again.');
      stop();
      process.exit(1);
    }
    ready = spawnSync('curl', ['-s', '-f', `${BASE}/`]).status === 0;
  }
  if (!ready) {
    console.error('The server did not respond in time.');
    stop();
    process.exit(1);
  }

  for (const [file, args] of steps) {
    const result = spawnSync('curl', args, { encoding: 'utf8' });
    const output = (result.stdout || '') + (result.stderr || '');
    fs.writeFileSync(file, `$ ${show(args)}\n\n${output}\n`);
    console.log(`saved -> ${file}`);
  }
  stop();

  // Quick sanity checks
  const read = (f) => fs.readFileSync(f, 'utf8');
  console.log('\n--- Checks ---');
  try {
    const gh = JSON.parse(read('githubrepo').split('\n').slice(2).join('\n'));
    if (gh.fork === true && gh.parent) {
      console.log(`githubrepo : OK (fork of ${gh.parent.full_name})`);
    } else if (gh.message) {
      console.log(`githubrepo : PROBLEM - GitHub says "${gh.message}". Check the username and repo name.`);
    } else {
      console.log('githubrepo : PROBLEM - this repository is not a fork.');
    }
  } catch (e) {
    console.log('githubrepo : PROBLEM - could not read GitHub response (no internet?).');
  }
  console.log('register   : ' + (read('register').includes('successfully registered') ? 'OK' : 'PROBLEM'));
  console.log('login      : ' + (read('login').includes('successfully logged in') ? 'OK' : 'PROBLEM'));
  console.log('reviewadded: ' + (read('reviewadded').includes('user1') ? 'OK' : 'PROBLEM'));
  console.log('deletereview: ' + (read('deletereview').includes('deleted') ? 'OK' : 'PROBLEM'));
})();
