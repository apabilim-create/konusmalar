const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 80;

app.use(cors());
app.use(express.json());

// Google Calendar Yetkilendirmesi
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CALENDAR_ID = 'apabilim@yahoo.com';

let auth;
if (process.env.GOOGLE_CREDENTIALS) {
    // Dokploy'da çevre değişkeni olarak yüklendiğinde buradan okur
    const keysEnvVar = process.env.GOOGLE_CREDENTIALS;
    const keys = JSON.parse(keysEnvVar);
    auth = google.auth.fromJSON(keys);
    auth.scopes = SCOPES;
} else {
    // Yerel test için dosyadan okur
    const KEYFILEPATH = path.join(__dirname, 'google-credentials.json');
    auth = new google.auth.GoogleAuth({
        keyFile: KEYFILEPATH,
        scopes: SCOPES,
    });
}

const calendar = google.calendar({ version: 'v3', auth });

// Takvim etkinliklerini getirme
app.get('/api/calendar/events', async (req, res) => {
    try {
        const response = await calendar.events.list({
            calendarId: CALENDAR_ID,
            timeMin: new Date().toISOString(), // Bugünden sonrasını getir
            maxResults: 50,
            singleEvents: true,
            orderBy: 'startTime',
        });
        res.json(response.data.items);
    } catch (error) {
        console.error('Takvim API Hatası:', error);
        res.status(500).json({ error: 'Etkinlikler alınamadı', details: error.message });
    }
});

// Yeni etkinlik (randevu) ekleme
app.post('/api/calendar/add', async (req, res) => {
    const { summary, description, startDateTime, endDateTime } = req.body;

    if (!summary || !startDateTime || !endDateTime) {
        return res.status(400).json({ error: 'Eksik parametreler (summary, startDateTime, endDateTime gereklidir)' });
    }

    const event = {
        summary: summary,
        description: description || '',
        start: {
            dateTime: startDateTime, // Beklenen format: '2023-10-15T09:00:00+03:00'
            timeZone: 'Europe/Istanbul',
        },
        end: {
            dateTime: endDateTime,
            timeZone: 'Europe/Istanbul',
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });
        res.json({ success: true, event: response.data });
    } catch (error) {
        console.error('Etkinlik ekleme hatası:', error);
        res.status(500).json({ error: 'Randevu eklenemedi', details: error.message });
    }
});

// Statik dosyaları sunma (index.html, style.css, app.js vs.)
app.use(express.static(__dirname));

// Tüm diğer rotaları index.html'e yönlendir (SPA davranışı için - gerçi bizde tek sayfa ama güvence)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
