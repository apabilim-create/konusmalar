// Supabase Configuration
const SUPABASE_URL = 'https://api.ilachatirlatma.com';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNjQxNzY5MjAwLCJleHAiOjE3OTk1MzU2MDB9.Bgt6cMbbssaluViATACTpBIC6_AIgckuHJndSmZHER0';

// Global objeyi ezmemek için client adını değiştirdik
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const listSection = document.getElementById('conversation-list');
const detailSection = document.getElementById('conversation-detail');
const listContainer = document.getElementById('list-container');
const detailContainer = document.getElementById('detail-container');
const detailTitle = document.getElementById('detail-title');
const backBtn = document.getElementById('back-btn');

let allConversations = [];

async function fetchConversations() {
    try {
        const { data, error } = await supabaseClient
            .from('konusmalar')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        allConversations = data || [];
        renderList();
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        listContainer.innerHTML = `<p style="color:red; padding:1rem;">Hata: ${error.message} <br> (Not: Veritabanında 'konusmalar' tablosu yoksa veya RLS izinleri kapalıysa bu hata çıkabilir.)</p>`;
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
        const tel = item.telefon_no || item.telefon || 'Bilinmeyen No';
        const ad = item.kisi_adi || item.isim || 'İsimsiz';
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
            // Aktif sınıfını ayarla
            document.querySelectorAll('.conversation-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            showDetail(key, grouped[key]);
        };
        
        listContainer.appendChild(btn);
    });
}

function showDetail(title, messages) {
    // Mobilde listeyi gizle, detayı göster. Masaüstünde ikisi de yan yana görünür (CSS ile).
    if (window.innerWidth <= 768) {
        listSection.classList.add('mobile-hidden');
        detailSection.classList.add('mobile-active');
    }
    
    // Masaüstünde placeholder'ı gizle
    detailSection.classList.remove('hidden-desktop');
    
    detailTitle.textContent = title;
    detailContainer.innerHTML = '';
    
    if (messages.length === 0) {
        detailContainer.innerHTML = '<p>Bu kişiye ait mesaj bulunamadı.</p>';
        return;
    }

    messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = 'message-item';
        
        const dateStr = msg.created_at ? new Date(msg.created_at).toLocaleString('tr-TR') : '';
        const content = msg.mesaj || msg.icerik || JSON.stringify(msg);
        
        div.innerHTML = `
            ${dateStr ? `<div class="message-date">${dateStr}</div>` : ''}
            <div class="message-content">${content}</div>
        `;
        
        detailContainer.appendChild(div);
    });
    
    // En alta kaydır
    detailContainer.scrollTop = detailContainer.scrollHeight;
}

backBtn.addEventListener('click', () => {
    // Mobilde geri tuşuna basınca
    detailSection.classList.remove('mobile-active');
    listSection.classList.remove('mobile-hidden');
    document.querySelectorAll('.conversation-btn').forEach(b => b.classList.remove('active'));
});

window.addEventListener('DOMContentLoaded', fetchConversations);
