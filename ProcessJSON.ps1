# Verzeichnis, in dem sich die JSON-Dateien befinden
$directory = "C:\DOCSIS-Status"

# Dynamisches Erstellen der Ausgabe-CSV-Dateinamen mit heutigem Datum
$datePrefix = (Get-Date).ToString("yyyyMMdd")
$outputDownCsv = "$directory\csv\$datePrefix-Ausgabe-Downstram.csv"
$outputUpCsv = "$directory\csv\$datePrefix-Ausgabe-Upstram.csv"

# Wenn die Ausgabe-CSV noch nicht existiert, erstelle sie mit Kopfzeile
if (!(Test-Path $outputDownCsv)) {
    "Zeitstempel,Kanal ID,Kanaltyp,Frequenz (MHz),Modulation,Empf. Signalstärke (dBmV/dBµV),SNR/MER (dB),Lock Status" | Out-File -FilePath $outputDownCsv -Encoding UTF8
}

if (!(Test-Path $outputUpCsv)) {
    "Zeitstempel,Kanal ID,Kanaltyp,Frequenz (MHz),Modulation,Send. Signalstärke (dBmV/dBµV),Ranging Status" | Out-File -FilePath $outputUpCsv -Encoding UTF8
}

# Alle JSON-Dateien im Verzeichnis sortiert nach Erstellungszeit
Get-ChildItem -Path $directory -Filter '*streamData.json' | Sort-Object CreationTime | ForEach-Object {
    Try {
        $file = $_.FullName
        $jsonContent = Get-Content $file -Encoding UTF8 | ConvertFrom-Json

        $headers = $jsonContent[0]
        $dataRows = $jsonContent | Select-Object -Skip 1

        $timestampString = $_.BaseName.Split('_')[0]
        $timestampString = $timestampString.TrimEnd('Z')
        $datePart, $timePart = $timestampString -split 'T'
        $timeComponents = $timePart -split '-'
        $timeString = "{0}:{1}:{2}.{3}" -f $timeComponents[0], $timeComponents[1], $timeComponents[2], $timeComponents[3]
        $timestampString = "$datePart $timeString"
        $timestamp = [DateTime]::ParseExact($timestampString, 'yyyy-MM-dd HH:mm:ss.fff', $null)
        $timestampFormatted = $timestamp.ToString('yyyy-MM-dd HH:mm:ss.fff')

        foreach ($row in $dataRows) {
            $data = @{}
            for ($i = 0; $i -lt $headers.Count; $i++) {
                $data[$headers[$i]] = $row[$i]
            }

            if ($file -like "*_downstreamData.json") {
                $line = "$timestampFormatted,$($data['Kanal ID']),$($data['Kanaltyp']),$($data['Frequenz (MHz)']),$($data['Modulation']),$($data['Empf. Signalstärke (dBmV/dBµV)']),$($data['SNR/MER (dB)']),$($data['Lock Status'])"
                Add-Content -Path $outputDownCsv -Value $line
            }

            if ($file -like "*_upstreamData.json") {
                $line = "$timestampFormatted,$($data['Kanal ID']),$($data['Kanaltyp']),$($data['Frequenz (MHz)']),$($data['Modulation']),$($data['Send. Signalstärke (dBmV/dBµV)']),$($data['Ranging Status'])"
                Add-Content -Path $outputUpCsv -Value $line
            }
        }

        # Verarbeitete Datei löschen, wenn keine Fehler aufgetreten sind
        Remove-Item $file
    }
    Catch {
        Write-Error "Fehler bei der Verarbeitung der Datei: $file. Fehler: $_"
    }
}

# Prüfen, ob der Prozess "node.exe" läuft
$nodeProcess = Get-Process node -ErrorAction SilentlyContinue

if ($null -eq $nodeProcess) {
    # Wenn der Prozess nicht läuft, starte die Node.js-Anwendung
    $cmdCommand = "cmd /K node `"Get-DOCSIS-Status.js`""
    Start-Process "cmd" -ArgumentList "/K", "node `"$directory\Get-DOCSIS-Status 1.js`"" -NoNewWindow -WorkingDirectory $directory
    Write-Host "Node.js-Anwendung gestartet."
} else {
    Write-Host "Node.exe läuft bereits."
}