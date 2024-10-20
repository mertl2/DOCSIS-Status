const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const baseurl = 'http://192.168.178.1';
  const password = 'DeinPasswortHier';
  
  // Funktion zum Extrahieren und Speichern der Tabellendaten
  async function extractAndSaveTableData(reloadPage = true) {
    if (reloadPage == true) {
	  // Zur Unterseite navigieren
	  console.log('DOCSIS Status wird neu geladen...');
	  await page.reload({ waitUntil: 'networkidle0' });
	  await waitForProgressBar();
	}
	
	// Warten, bis die Seite vollständig geladen ist
    await page.waitForSelector('#sta_docsis_status_table_downstream', { visible: true });
	await new Promise(resolve => setTimeout(resolve, 500));

    // Aktuellen Zeitstempel erzeugen
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Downstream-Tabelle extrahieren
    const downstreamData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#sta_docsis_status_table_downstream tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.innerText.trim());
      });
    });

    // Upstream-Tabelle extrahieren
    const upstreamData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#sta_docsis_status_table_upstream tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('th, td'));
        return cells.map(cell => cell.innerText.trim());
      });
    });

    // Daten in JSON-Dateien speichern
    fs.writeFileSync(`${timestamp}_downstreamData.json`, JSON.stringify(downstreamData, null, 2));
    fs.writeFileSync(`${timestamp}_upstreamData.json`, JSON.stringify(upstreamData, null, 2));

    console.log(`${timestamp}: Tabellendaten wurden gespeichert.`);
  
    // Nach Abschluss 5 Sekunden warten und dann die Funktion erneut aufrufen
    setTimeout(async () => { await extractAndSaveTableData(); }, 5000);
  }
  
  // Funktion zum Abwarten der Ladeanimation
  async function waitForProgressBar() {
	const progressBarActive = await page.$('#nprogress') !== null;
    if (progressBarActive) {
      console.log('Warten, bis Ladevorgang abgeschlossen ist...');
	  try {
        await page.waitForFunction(() => { return !document.querySelector('#nprogress'); }, { timeout: 20000 });
      } catch (error) {
        console.log('Der Ladeindikator "#nprogress" ist nicht rechtzeitig verschwunden.');
	    throw error;
      }
    }
  }
  
  // Browser starten
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null
	//, args: ['--start-maximized'], // Startet den Browser im maximierten Fenster
  });
  const page = await browser.newPage();

  // Login-Seite aufrufen und warten, bis sie vollständig geladen ist
  await page.goto(baseurl + '/#/login', { waitUntil: 'networkidle0' });
  waitForProgressBar()
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Login-Daten eingeben
  try {
    // Warten, bis das Passwortfeld vorhanden ist
	await page.waitForSelector('#password', { visible: true });
    await page.type('#password', password);
  } catch (error) {
    console.error('Fehler beim Eingeben des Passworts:', error);
    await browser.close();
    process.exit();
  }
  
  try {
    // Warten, bis der Login-Button verfügbar ist
    await page.waitForSelector('#login-button', { visible: true });
    // Login-Button klicken
    await page.click('#login-button');
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch {
    console.error('Fehler beim Senden der Login-Daten:', error);
    await browser.close();
    process.exit();
  }
 
  // Prüfen, ob das Modal erschienen ist
  const sessionModalVisible = await page.$('#login_user_already_logged_modal') !== null;

  if (sessionModalVisible) {
    console.log('login_user_already_logged_modal ist erschienen. Klicke auf den Button mit der ID "terminateSessionBtn".');
    // Warten, bis der Button verfügbar und sichtbar ist
    await page.waitForSelector('#terminateSessionBtn', { visible: true });
	await new Promise(resolve => setTimeout(resolve, 500));
	await page.click('#terminateSessionBtn');
	await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    console.log('login_user_already_logged_modal ist nicht erschienen.');
  }
 
   // Prüfen, ob das Modal erschienen ist
  const PasswordReminderVisible = await page.$('#change_default_password_modal') !== null;

  if (PasswordReminderVisible) {
    console.log('change_default_password_modal ist erschienen. Klicke auf den Button mit der ID "CancelCdpButton".');
	// Warten, bis der Button verfügbar und sichtbar ist
    await page.waitForSelector('#CancelCdpButton', { visible: true });
	await new Promise(resolve => setTimeout(resolve, 1000));
    await page.click('#CancelCdpButton');
	await new Promise(resolve => setTimeout(resolve, 500));
  } else {
    console.log('change_default_password_modal ist nicht erschienen.');
  }
  
  await waitForProgressBar();
  
  // Gebe Übersichtsseite Zeit zum Laden
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('Navigiere zum DOCSIS Status...');
  await page.goto(baseurl + '/#/status/status/docsis_status', { waitUntil: 'networkidle0' });
  await waitForProgressBar();

  // Erste Datenextraktion
  await extractAndSaveTableData(false);
})();
