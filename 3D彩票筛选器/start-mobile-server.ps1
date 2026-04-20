$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir

$port = 8090
$ip = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not $ip) {
  $ip = "localhost"
}

Write-Host ""
Write-Host "3D 彩票筛选器本地服务已启动" -ForegroundColor Green
Write-Host "电脑访问: http://127.0.0.1:$port" -ForegroundColor Cyan
Write-Host "手机访问: http://$ip`:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host "请保持本窗口打开，关闭窗口即停止服务。" -ForegroundColor DarkYellow
Write-Host ""

python -m http.server $port --bind 0.0.0.0
