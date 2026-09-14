Set-Location $PSScriptRoot
Start-Process "http://localhost:8743/control.html"
python -m http.server 8743
