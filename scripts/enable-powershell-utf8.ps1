$Utf8NoBomEncoding = [System.Text.UTF8Encoding]::new($false)

if (Get-Command chcp.com -ErrorAction SilentlyContinue) {
  chcp.com 65001 > $null
}

[Console]::InputEncoding = $Utf8NoBomEncoding
[Console]::OutputEncoding = $Utf8NoBomEncoding
$global:OutputEncoding = $Utf8NoBomEncoding

$PSDefaultParameterValues["Export-Csv:Encoding"] = "utf8"
$PSDefaultParameterValues["Out-File:Encoding"] = "utf8"
$PSDefaultParameterValues["Set-Content:Encoding"] = "utf8"

if ($env:PYTHONUTF8 -ne "1") {
  $env:PYTHONUTF8 = "1"
}

if ($env:PYTHONIOENCODING -ne "utf-8") {
  $env:PYTHONIOENCODING = "utf-8"
}
