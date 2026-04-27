// Supabase Configuration
const SUPABASE_URL = 'https://api.ilachatirlatma.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.Bgt6cMbbssaluViATACTpBIC6_AIgckuHJndSmZHER0';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const listSection = document.getElementById('conversation-list');
const detailSection = document.getElementById('conversation-detail');
const listContainer = document.getElementById('list-container');
const detailContainer = document.getElementById('detail-container');
const detailTitle = document.getElementById('detail-title');
const backBtn = document.getElementById('back-btn');

// Bütün verileri tutacağımız değişken
let allConversations = [];

async function fetchConversations() {
    try {
        // Tablodan verileri çekiyoruz (tarihe göre sıralı)
        const { data, error } = await supabase
            .from('konusmalar')
            .select('*')
            .order('created_at', { ascending: true }); // İlk baştan sona doğru

        if (error) throw error;
        
        allConversations = data || [];
        renderList();
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        listContainer.innerHTML = `<p style="color:red;">Veriler yüklenirken hata oluştu: ${error.message}</p>`;
    }
}

function renderList() {
    listContainer.innerHTML = '';
    
    if (allConversations.length === 0) {
        listContainer.innerHTML = '<p>Henüz kayıtlı konuşma bulunmuyor.</p>';
        return;
    }

    // Telefon no ve kişi adına göre gruplama (Benzersiz kişileri bulmak için)
    const grouped = {};
    allConversations.forEach(item => {
        // null veya undefined olan değerleri boş string yap
        const tel = item.telefon_no || 'Bilinmeyen No';
        const ad = item.kisi_adi || 'İsimsiz';
        const key = `${tel} - ${ad}`;
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(item);
    });

    // Listeyi ekrana bas
    Object.keys(grouped).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'conversation-btn';
        
        // Buton içeriği
        btn.innerHTML = `
            <span>${key}</span>
            <span style="font-size: 0.8em; color: #666;">Konuşmalar ➔</span>
        `;
        
        // Tıklama olayı
        btn.onclick = () => showDetail(key, grouped[key]);
        
        listContainer.appendChild(btn);
    });
}

function showDetail(title, messages) {
    // Listeyi gizle, detayı göster
    listSection.classList.add('hidden');
    detailSection.classList.remove('hidden');
    
    // Başlığı ayarla
    detailTitle.textContent = title;
    
    // Mesajları temizle ve ekle
    detailContainer.innerHTML = '';
    
    if (messages.length === 0) {
        detailContainer.innerHTML = '<p>Bu kişiye ait mesaj bulunamadı.</p>';
        return;
    }

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message-item';
        
        // Tarih formatlama
        const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleString('tr-TR') : '';
        const content = msg.mesaj || msg.icerik || JSON.stringify(msg); // Mesaj kolonu adı farklıysa diye fallback
        
        div.innerHTML = `
            ${dateStr ? `<div class="message-date">${dateStr}</div>` : ''}
            <div class="message-content">${content}</div>
        `;
        
        detailContainer.appendChild(div);
    });
}

// Geri butonu
backBtn.addEventListener('click', () => {
    detailSection.classList.add('hidden');
    listSection.classList.remove('hidden');
});

// Sayfa yüklendiğinde verileri çek
window.addEventListener('DOMContentLoaded', fetchConversations);
