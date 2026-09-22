# Destindere Orhei-Vest – V1.7

V1.7 păstrează și adaugă: redenumirea fiecărui modul (același nume este folosit și în Header), comportament configurabil după începerea evenimentului pentru Countdown/Date/Participare, sincronizarea statusului Admin cu starea efectivă, login DESTINDERI JW MOLDOVA verificat în Google Sheets și sesiune locală.

## Login / Google Sheets

Apps Script creează automat foaia `Utilizatori` la prima autentificare. Coloane: `ID`, `Nume`, `Prenume`, `Congregație`, `Activ`, `CreatedAt`, `UpdatedAt`. Adaugă persoanele autorizate în această foaie. Login-ul compară Nume + Prenume + Congregație, ignorând diferențele de majuscule și spații. Sesiunea este păstrată local în `localStorage`.

## Instalare

1. În Google Apps Script înlocuiește codul cu `google/apps-script.js`, apoi publică/deploy ca Web App.
2. Păstrează URL-ul Web App în `config.js` la `apiUrl`.
3. În Google Sheets, foaia `Utilizatori` poate fi creată automat sau creată prin prima încercare de login.
4. Adaugă utilizatorii autorizați în foaie cu `Activ = DA`.
5. Deschide `login.html` pentru autentificare.
6. Adminul rămâne la `admin.html`; configurația lui este păstrată local în browser.
