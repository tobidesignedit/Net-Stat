@echo off
echo Starting local preview server on http://localhost:8000 ...
start "" "http://localhost:8000"
python -m http.server 8000
