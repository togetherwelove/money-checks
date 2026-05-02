. "$PSScriptRoot\enable-powershell-utf8.ps1"

$KoreanText = "한글 테스트: 알뜰 가계부"
Write-Output $KoreanText

if ($KoreanText -ne "한글 테스트: 알뜰 가계부") {
  throw "Korean string round-trip failed."
}

Write-Output "UTF-8 설정 완료"
