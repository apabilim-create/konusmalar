// Supabase Configuration
const SUPABASE_URL = 'https://api.ilachatirlatma.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.Bgt6cMbbssaluViATACTpBIC6_AIgckuHJndSmZHER0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listSection = document.getElementById('conversation-list');
const detailSection = document.getElementById('conversation-detail');
const listContainer = document.getElementById('list-container');
const detailContainer = document.getElementById('detail-container');
const detailTitle = document.getElementById('detail-title');
const backBtn = document.getElementById('back-btn');
const pageTitle = document.getElementById('page-title');

// Sidebar Navigation Elements
const navKonusmalar = document.getElementById('nav-konusmalar');
const navRandevular = document.getElementById('nav-randevular');
const viewKonusmalar = document.getElementById('view-konusmalar');
const viewRandevular = document.getElementById('view-randevular');

// Sidebar Navigation Logic
navKonusmalar.addEventListener('click', () => {
    navKonusmalar.classList.add('active');
    navRandevular.classList.remove('active');
    viewKonusmalar.classList.remove('hidden-view');
    viewRandevular.classList.add('hidden-view');
    pageTitle.textContent = 'Konuşmalar';
});

navRandevular.addEventListener('click', () => {
    navRandevular.classList.add('active');
    navKonusmalar.classList.remove('active');
    viewRandevular.classList.remove('hidden-view');
    viewKonusmalar.classList.add('hidden-view');
    pageTitle.textContent = 'Randevu Ekranı';
});

let allConversations = [];

async function fetchConversations() {
    try {
        const { data, error } = await supabaseClient
            .from('konusmalar')
            .select('*')
            .order('olusturulma_zamani', { ascending: true }); // Doğru kolon adı

        if (error) throw error;
        
        allConversations = data || [];
        renderList();
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        listContainer.innerHTML = `<p style="color:red; padding:1rem;">Hata: ${error.message}</p>`;
    }
}

function renderList() {
    listContainer.innerHTML = '';
    
    if (allConversations.length === 0) {
        listContainer.innerHTML = '<p style="padding:1rem;">Henüz kayıtlı konuşma bulunmuyor.</p>';
        return;
    }

    const grouped = {};
    allConversations.forEach(item => {
        // WhatsApp numaralarındaki @s.whatsapp.net kısmını temizle (isteğe bağlı ama güzel durur)
        let tel = item.telefon_numarasi || 'Bilinmeyen No';
        if(tel.includes('@')) tel = tel.split('@')[0];

        const ad = item.kisi_adi && item.kisi_adi.trim() !== '' ? item.kisi_adi : 'İsimsiz';
        const key = `${tel} - ${ad}`;
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });

    Object.keys(grouped).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'conversation-btn';
        btn.innerHTML = `
            <span>${key}</span>
            <span class="btn-icon">➔</span>
        `;
        
        btn.onclick = () => {
            document.querySelectorAll('.conversation-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            showDetail(key, grouped[key]);
        };
        
        listContainer.appendChild(btn);
    });
}

function showDetail(title, messages) {
    if (window.innerWidth <= 768) {
        listSection.classList.add('mobile-hidden');
        detailSection.classList.add('mobile-active');
    }
    
    detailSection.classList.remove('hidden-desktop');
    detailTitle.textContent = title;
    detailContainer.innerHTML = '';
    
    if (messages.length === 0) {
        detailContainer.innerHTML = '<p>Bu kişiye ait mesaj bulunamadı.</p>';
        return;
    }

    messages.forEach(msg => {
        const dateStr = msg.olusturulma_zamani ? new Date(msg.olusturulma_zamani).toLocaleString('tr-TR') : '';
        const isim = msg.kisi_adi && msg.kisi_adi.trim() !== '' ? msg.kisi_adi : 'Kullanıcı';

        // Kullanıcı Mesajı (Sol)
        if (msg.kullanici_mesaji && msg.kullanici_mesaji.trim() !== '') {
            const divKullanici = document.createElement('div');
            divKullanici.className = 'message-item';
            divKullanici.innerHTML = `
                ${dateStr ? `<div class="message-date">${dateStr}</div>` : ''}
                <div class="message-content"><strong>${isim}:</strong> <br>${msg.kullanici_mesaji}</div>
            `;
            detailContainer.appendChild(divKullanici);
        }

        // Asistan Yanıtı (Sağ)
        if (msg.asistan_yaniti && msg.asistan_yaniti.trim() !== '') {
            const divAsistan = document.createElement('div');
            divAsistan.className = 'message-item asistan-msg';
            divAsistan.innerHTML = `
                <div class="message-content"><strong>Asistan:</strong> <br>${msg.asistan_yaniti}</div>
            `;
            detailContainer.appendChild(divAsistan);
        }
    });
    
    detailContainer.scrollTop = detailContainer.scrollHeight;
}

backBtn.addEventListener('click', () => {
    detailSection.classList.remove('mobile-active');
    listSection.classList.remove('mobile-hidden');
    document.querySelectorAll('.conversation-btn').forEach(b => b.classList.remove('active'));
});

// ==========================================
// GOOGLE CALENDAR (RANDEVU) İŞLEMLERİ
// ==========================================

const btnShowAddForm = document.getElementById('btn-show-add-form');
const addAppointmentForm = document.getElementById('add-appointment-form');
const btnCancelAppointment = document.getElementById('btn-cancel-appointment');
const btnSaveAppointment = document.getElementById('btn-save-appointment');
const appointmentsList = document.getElementById('appointments-list');
const aptMsg = document.getElementById('apt-msg');

// Formu Göster/Gizle
btnShowAddForm.addEventListener('click', () => {
    addAppointmentForm.classList.remove('hidden-form');
});

btnCancelAppointment.addEventListener('click', () => {
    addAppointmentForm.classList.add('hidden-form');
    clearAptForm();
});

function clearAptForm() {
    document.getElementById('apt-summary').value = '';
    document.getElementById('apt-start').value = '';
    document.getElementById('apt-end').value = '';
    document.getElementById('apt-desc').value = '';
    aptMsg.innerHTML = '';
}

// Randevuları Getir
async function fetchAppointments() {
    appointmentsList.innerHTML = '<p class="loading">Takvim yükleniyor...</p>';
    try {
        const response = await fetch('/api/calendar/events');
        if (!response.ok) throw new Error('API Hatası');
        
        const events = await response.json();
        renderAppointments(events);
    } catch (error) {
        console.error('Randevu getirme hatası:', error);
        appointmentsList.innerHTML = '<p style="color:red;">Randevular yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>';
    }
}

// Randevuları Ekrana Çiz
function renderAppointments(events) {
    if (!events || events.length === 0) {
        appointmentsList.innerHTML = '<p>Yaklaşan randevu bulunmuyor.</p>';
        return;
    }

    appointmentsList.innerHTML = '';
    events.forEach(event => {
        // Tam gün etkinliklerinde dateTime yerine date gelir
        const startRaw = event.start.dateTime || event.start.date;
        const endRaw = event.end.dateTime || event.end.date;

        const startDate = new Date(startRaw).toLocaleString('tr-TR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit' 
        });
        
        const endDate = new Date(endRaw).toLocaleTimeString('tr-TR', { hour: '2-digit', minute:'2-digit' });

        const div = document.createElement('div');
        div.className = 'apt-item';
        div.innerHTML = `
            <div class="apt-title">${event.summary || '(Başlıksız Randevu)'}</div>
            <div class="apt-time">🕒 ${startDate} - ${endDate}</div>
            ${event.description ? `<div style="margin-top:5px; font-size:0.9rem; color:#555;">${event.description}</div>` : ''}
        `;
        appointmentsList.appendChild(div);
    });
}

// Yeni Randevu Kaydet
btnSaveAppointment.addEventListener('click', async () => {
    const summary = document.getElementById('apt-summary').value;
    const start = document.getElementById('apt-start').value;
    const end = document.getElementById('apt-end').value;
    const desc = document.getElementById('apt-desc').value;

    if (!summary || !start || !end) {
        aptMsg.innerHTML = '<span style="color:red;">Lütfen başlık, başlangıç ve bitiş zamanını girin.</span>';
        return;
    }

    // Google Calendar API için format (ISO 8601 offsetli)
    const startDate = new Date(start).toISOString();
    const endDate = new Date(end).toISOString();

    btnSaveAppointment.disabled = true;
    btnSaveAppointment.textContent = 'Kaydediliyor...';
    aptMsg.innerHTML = '';

    try {
        const response = await fetch('/api/calendar/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                summary: summary,
                description: desc,
                startDateTime: startDate,
                endDateTime: endDate
            })
        });

        const data = await response.json();

        if (response.ok) {
            aptMsg.innerHTML = '<span style="color:green;">Randevu başarıyla eklendi!</span>';
            setTimeout(() => {
                addAppointmentForm.classList.add('hidden-form');
                clearAptForm();
                fetchAppointments(); // Listeyi yenile
            }, 1500);
        } else {
            throw new Error(data.error || 'Bilinmeyen hata');
        }
    } catch (error) {
        aptMsg.innerHTML = `<span style="color:red;">Hata: ${error.message}</span>`;
    } finally {
        btnSaveAppointment.disabled = false;
        btnSaveAppointment.textContent = 'Kaydet';
    }
});

// Sayfa yüklendiğinde ve tab değiştiğinde randevuları da getir
navRandevular.addEventListener('click', () => {
    // Diğer kodlar zaten yukarıda navRandevular listener'ında var (class ekleme çıkarma vs)
    // Biz burada sadece ekstra fetch işlemini tetikleyeceğiz.
    fetchAppointments();
});

