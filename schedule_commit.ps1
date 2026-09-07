# Auto Commit Scheduler at Midnight (00:00:00 WIB)
$workDir = "G:\MasterJangkir project\portal-wawancara-rijal-dakwah"
Set-Location -Path $workDir
$logFile = Join-Path $workDir "schedule_commit.log"

function Write-Log {
    param([string]$message)
    $timeStr = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $line = "[$timeStr] $message"
    Write-Output $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Write-Log "=== AUTO-COMMIT SCHEDULER AKTIF ==="
Write-Log "Target Waktu: Jam 12 Malam (00:00:00 WIB, 7 September 2026)"

while ($true) {
    $now = Get-Date
    # Jika sudah memasuki jam 00:00 WIB atau lebih
    if ($now.Hour -eq 0 -and $now.Day -eq 7) {
        Write-Log "WAKTU TERCAPAI: TEPAT JAM 12 MALAM (00:00 WIB)!"
        Write-Log "Memulai eksekusi Git Add, Commit, dan Push ke GitHub Pages..."
        
        try {
            $addRes = & "C:\Program Files\Git\cmd\git.exe" add index.html 2>&1
            Write-Log "Git Add: $addRes"

            $commitRes = & "C:\Program Files\Git\cmd\git.exe" commit -m "Penutupan sesi pendaftaran dan peralihan ke tahap seleksi berkas" 2>&1
            Write-Log "Git Commit: $commitRes"

            $pushRes = & "C:\Program Files\Git\cmd\git.exe" push origin main 2>&1
            Write-Log "Git Push: $pushRes"

            Write-Log "=== SELESAI! PERUBAHAN RESMI LIVE DI GITHUB PAGES ==="
        } catch {
            Write-Log "ERROR: $($_.Exception.Message)"
        }
        break
    } else {
        $midnight = (Get-Date).Date.AddDays(1)
        $diff = $midnight - $now
        $totalSeconds = [int]$diff.TotalSeconds
        $mins = [int][Math]::Floor($totalSeconds / 60)
        $secs = $totalSeconds % 60

        Write-Log "Status: Menunggu jam 12 malam... Sisa waktu: $mins menit $secs detik."
        Start-Sleep -Seconds 15
    }
}
