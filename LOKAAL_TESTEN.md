# Smart Pilot - Lokaal Testen Instructies

## ⚡ Quick Start (Makkelijkste Manier)

### Optie 1: Batch Script (Aanbevolen)

Dubbelklik op:
```
RUN_LOCALLY.bat
```

Dit doet automatisch:
1. Check Node.js installatie
2. Installeer dependencies (indien nodig)
3. Build de app
4. Start met logging enabled

### Optie 2: Handmatig

Open **Command Prompt** in deze folder en run:

```bash
npm install
npm run build
npm start
```

---

## 📋 Log Bestanden Bekijken

### Tijdens het draaien

De logs verschijnen in je terminal waar je `npm start` hebt gedraaid.

### Log File

Dubbelklik op:
```
VIEW_LOGS.bat
```

Of open handmatig:
```
%APPDATA%\smart-pilot\logs\smart-pilot.log
```

Sneltoets:
- `Win+R` → `%APPDATA%\smart-pilot\logs` → `Enter`

---

## 🔍 Wat te Checken in Logs

### Startup Sequence

Zoek naar deze berichten in de logs:

✅ **Success**:
```
[info] Smart Pilot v1.0.0 starting...
[info] ELECTRON-LOG INITIALIZED
[info] App ready event fired
[info] BrowserWindow created successfully
[info] Page finished loading successfully
[info] Window ready to show
```

❌ **Errors**:
```
[error] Failed to load index.html: ENOENT
[error] Failed to load page: -105
[error] UNCAUGHT EXCEPTION: ...
```

### Veel Voorkomende Errors

#### Error 1: "Cannot find module"
```
[error] Error: Cannot find module '../shared/utils/logger'
```

**Oplossing**:
```bash
npm run build
```

#### Error 2: "ENOENT: no such file or directory"
```
[error] Failed to load index.html: ENOENT
```

**Oplossing**:
```bash
npm run build:renderer
```

#### Error 3: "Failed to load page: -105"
```
[error] Failed to load page: { errorCode: -105, errorDescription: '...' }
```

Dit betekent dat `index.html` niet gevonden kan worden.

**Check**:
```bash
dir dist\renderer\index.html
```

Moet bestaan! Als niet:
```bash
npm run build:renderer
```

---

## 🛠️ Development Mode

Voor live reload tijdens development:

```bash
# Terminal 1: Start Vite dev server
npm run dev:renderer

# Terminal 2: Start Electron
npm run dev:main
```

Of gebruik:
```bash
npm run dev
```

Dit start beide automatisch.

**Voordeel**: Wijzigingen in code worden direct zichtbaar zonder rebuild.

---

## 🐛 Debugging

### DevTools Openen

Als de app draait:
- Druk `Ctrl+Shift+I`
- Of `F12`

### Console Tab

Hier zie je:
- Alle `console.log()` statements
- JavaScript errors met stack traces
- React component errors

### Network Tab

Check hier:
- WebSocket connecties naar `wss://192.168.2.5/ws`
- API calls naar `https://192.168.2.5/api`
- Failed requests

### Sources Tab

- Bekijk bron code
- Set breakpoints
- Step through code

---

## 📊 Test Checklist

### 1. App Start
- [ ] Window opent
- [ ] Splash screen verschijnt
- [ ] Geen JavaScript errors in console
- [ ] Log file is aangemaakt

### 2. Connectiviteit
- [ ] Backend bereikbaar: `curl -k https://192.168.2.5/health`
- [ ] WebSocket verbindt
- [ ] Geen CORS errors

### 3. UI Componenten
- [ ] TitleBar laadt
- [ ] Settings panel opent
- [ ] Window list toont data (mock of real)

---

## 🔧 Common Fixes

### Reset Alles

```bash
# Stop app (Ctrl+C)
# Delete build output
rmdir /s /q dist

# Delete dependencies
rmdir /s /q node_modules

# Fresh install
npm install

# Fresh build
npm run build

# Try again
npm start
```

### Clear User Data

```bash
# Delete app data folder
rmdir /s /q "%APPDATA%\smart-pilot"

# Run app again
npm start
```

---

## 📝 Logs Sturen voor Debug

Als je een issue wilt rapporteren, stuur:

1. **Complete log file**:
   ```
   %APPDATA%\smart-pilot\logs\smart-pilot.log
   ```

2. **Console output** van terminal

3. **DevTools Console** screenshot (Ctrl+Shift+I)

4. **System info**:
   ```bash
   node --version
   npm --version
   systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
   ```

---

## 🎯 Specifieke Problemen

### Portable versie crasht met JS error

**Test eerst built versie**:
```bash
npm start
```

Als dit werkt maar portable niet, dan is het een packaging issue.

**Check portable log**:
De portable app maakt ook logs aan in:
```
[PORTABLE_APP_FOLDER]\resources\app\logs\smart-pilot.log
```

### Installer werkt niet

**Test built versie eerst**:
```bash
npm start
```

Als dit werkt, rebuild installer:
```bash
npm run package
```

Check output in `release/` folder.

---

## 🚀 Als het Werkt

Als `npm start` succesvol werkt:

1. **Check logs** - Alles OK?
2. **Test features** - Buttons, panels, etc.
3. **Check WebSocket** - Verbinding OK?
4. **Test settings** - Persistent?

Dan kunnen we kijken waarom portable/installer niet werkt.

Vaak is het issue:
- Verkeerde paths in production build
- Missing files in electron-builder config
- Permissions issues

---

## 📞 Hulp Nodig?

Run deze commando's en stuur output:

```bash
# Environment info
node --version
npm --version

# Build output
npm run build 2>&1 > build-log.txt

# Start en kopieer alle output
npm start 2>&1 > run-log.txt

# Log file
copy "%APPDATA%\smart-pilot\logs\smart-pilot.log" smart-pilot-log.txt
```

Stuur alle `.txt` files.

---

**Success!** 🎉

Als je logs met errors ziet, laat me weten en we fixen het!
