# Beschreibung

Dieses Set aus zwei Skripten liest kontinuierlich den DOCSIS-Status einer Vodafone-Station aus und speichert die Daten in einer csv-Datei ab.

## Die Skripte erzeugen 

**Get-DDOCSIS-Status.js**

Das Skript verwendet Puppeteer, um einen Chrome-Browser im Headless-Modus zu öffnen. Nach dem Login navigiert es automatisch zur DOCSIS-Statusseite. Dort extrahiert das Skript die Inhalte der 'Downstream' und 'Upstream' Tabellen und speichert diese in Form von JSON-Dateien. Dieser Prozess wiederholt sich automatisch alle fünf Sekunden.

**ProcessJSON.ps1**

Das PowerShell-Skript verarbeitet die zuvor erzeugten JSON-Dateien, indem es ihren Inhalt nacheinander in zwei CSV-Dateien ("Ausgabe-Downstream.csv" und "Ausgabe-Upstream.csv") einfügt. Die resultierenden CSV-Dateien können dann zur Analyse oder Visualisierung in Anwendungen wie Microsoft Excel importiert werden. Zudem prüft das Skript, ob das Node.js-Skript noch läuft und startet dieses ggf. neu.

**Entwicklungshinweise**

Die Codebasis für diese Skripte wurde mit Unterstützung durch ChatGPT entwickelt.

## Installation

- [Node.js](https://nodejs.org/en/download/package-manager) herunterladen und installieren
- [Puppeteer](https://pptr.dev/guides/installation) installieren `npm i puppeteer`
- Ausführung von PowerShell-Skripten erlauben: `Set-EcecutionPolicy RemoteSigned`
- Skript Get-DOCSIS-Status.js öffnen und URL der Vodafone-Station + Passwort eintragen
- Skript ProcessJSON.ps1 öffnen und ggf. den Pfad anpassen
- Aufgabe in Aufgabenplanung erstellen\
  (z.B. Trigger: Täglich, nach Auslösung alle 2 Minuten\
  Aktion: Programm starten; Programm/Skript: powershell; Argumente: -File "C:\DOCSIS-Status\ProcessJSON.ps1"; Starten in: C:\puppeteer\DOCSIS-Status)