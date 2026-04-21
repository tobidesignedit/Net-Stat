NetStat
A quick internet speed checker. No frameworks, no tracking, just JavaScript.

What it does
Runs a download test against Cloudflare's edge network.

Updates the speed every half second while testing.

Keeps a running log of your current, last, and average speeds (stored in localStorage).

Total test counter so you know how many times you've clicked.

How to use it
Clone or download the repo. Open index.html. Click the button.

If you want to serve it locally (sometimes CORS acts up on file://):

bash
python -m http.server 8000
Then go to http://localhost:8000.

How it works
It fetches a 10MB dummy file from speed.cloudflare.com. The timer runs for 7 seconds, calculating bytes received per second. That's it.

Tweaking it
If 7 seconds feels too long or the 10MB file is overkill for mobile, change these lines in script.js:

javascript
const maxTestDurationMs = 7000; // test length
const fileUrl = "https://speed.cloudflare.com/__down?bytes=10000000"; // file size
Issues
If you get an error, it's usually one of three things:

You're offline.

Cloudflare's endpoint is having a moment.

You're running it on file:// and the browser is being strict. Use the python server command above.

License
MIT. Do whatever.

Built by ATLAS Intelligence
