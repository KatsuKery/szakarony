import { spClient } from './config.js';
import * as api from './api.js';
import * as ui from './ui.js';
import * as engine from './engine.js';
import { BALANS_BUDYNKOW } from './config.js';
import { BALANS_JEDNOSTEK } from './units.js';

let stanGracza = { id: null, wioska: null, surowce: null, budynki: null, kolejka: [], jednostki: {}, kolejkaWojsko: [] };
let interwalProdukcji = null;

// --- REJESTRACJA ---
document.getElementById("btn-zarejestruj").addEventListener("click", () => {
    document.getElementById("modal-frakcja").style.display = "flex";
});

document.getElementById("btn-potwierdz-frakcje").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("haslo").value;
    const frakcja = document.getElementById("wybor-frakcji").value;
    document.getElementById("modal-frakcja").style.display = "none";

    const { data: auth, error } = await spClient.auth.signUp({ email, password });
    if (error) return alert(error.message);

    await api.insert('villages', {
        id: auth.user.id,
        name: "Osada " + email.split('@')[0],
        pos_x: Math.floor(Math.random() * 80) + 10,
        pos_y: Math.floor(Math.random() * 80) + 10,
        faction: frakcja,
        last_update: new Date().toISOString()
    });

    // ZMIANA: Każdy surowiec (podstawowy i unikalny) ustawiony na 1000 na start!
    await api.insert('village_resources', {
        village_id: auth.user.id,
        wood: 1000, stone: 1000, coal: 1000, food: 1000, gold: 1000, population: 1000, knowledge: 1000, essence: 1000,
        iron: 1000, silver: 1000, relics: 1000,
        mithril: 1000, runestones: 1000, ale: 1000,
        corpses: 1000, blood: 1000, black_frost: 1000,
        elderwood: 1000, crystals: 1000, stardust: 1000,
        bones: 1000, hides: 1000, tusks: 1000,
        sulfur: 1000, obsidian: 1000, chaos_flame: 1000
    });

    await api.insert('village_buildings', {
        village_id: auth.user.id, town_hall: 1, lumberjack: 1, quarry: 1, coal_mine: 1, farm: 1
    });

    alert("Konto utworzone! Możesz się zalogować.");
});

// --- LOGOWANIE ---
document.getElementById("btn-zaloguj").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("haslo").value;

    const { data, error } = await spClient.auth.signInWithPassword({ email, password });
    if (error) return alert("Błąd logowania: " + error.message);

    stanGracza.id = data.user.id;
    await odswiezDaneZ_Bazy();

    document.getElementById("sekcja-auth").style.display = "none";
    document.getElementById("sekcja-gra").style.display = "block";
    alert("Witaj w swojej osadzie!");
});

// --- GŁÓWNA LOGIKA GRY ---
async function odswiezDaneZ_Bazy() {
    if (!stanGracza.id) return;
    const dane = await api.pobierzDane(stanGracza.id);
    stanGracza = { id: stanGracza.id, ...dane };

    ui.aktualizujInterfejs(stanGracza);

    const wiochy = await api.fetchNearbyVillages(stanGracza.wioska.pos_x, stanGracza.wioska.pos_y);
    ui.renderujMape(stanGracza, wiochy, ui.pokazSzczegolyPola);

    if (!interwalProdukcji) odpalZegarProdukcji();
}

function odpalZegarProdukcji() {
    if (interwalProdukcji) clearInterval(interwalProdukcji);

    interwalProdukcji = setInterval(async () => {
        if (!stanGracza.surowce) return;
        const teraz = new Date();

        // 1. Naliczanie surowców
        for (const [kod, cfg] of Object.entries(BALANS_BUDYNKOW)) {
            if (cfg.resProd && stanGracza.budynki[kod]) {
                let przyrost = stanGracza.budynki[kod] * cfg.prodBaza;
                stanGracza.surowce[cfg.resProd] += Math.floor(przyrost);
            }
        }

        await api.aktualizuj('village_resources', stanGracza.surowce, 'village_id', stanGracza.id);
        ui.aktualizujInterfejs(stanGracza);

        let zaktualizowanoCos = false;

        // 2. Sprawdzanie kolejek budowy
        const doUkonczenia = stanGracza.kolejka.filter(q => new Date(q.finish_time) <= teraz);
        if (doUkonczenia.length > 0) {
            for (const q of doUkonczenia) {
                await api.aktualizuj('village_buildings', { [q.building_type]: stanGracza.budynki[q.building_type] + 1 }, 'village_id', stanGracza.id);
                await api.usunZkolejki(q.id);
            }
            zaktualizowanoCos = true;
        }

        // 3. Sprawdzanie kolejki wojska
        const doUkonczeniaWojsko = stanGracza.kolejkaWojsko.filter(q => new Date(q.finish_time) <= teraz);
        if (doUkonczeniaWojsko.length > 0) {
            for (const q of doUkonczeniaWojsko) {
                const obecnaIlosc = stanGracza.jednostki[q.unit_type] || 0;
                await spClient.from('village_units').upsert({
                    village_id: stanGracza.id,
                    unit_type: q.unit_type,
                    quantity: obecnaIlosc + q.quantity
                });
                await api.usunZkolejkiWojska(q.id);
            }
            zaktualizowanoCos = true;
        }

        if (zaktualizowanoCos) {
            await odswiezDaneZ_Bazy();
        }

    }, 60000);
}

// --- GLOBALNE FUNKCJE DLA HTML ---
window.rozbudujBudynek = async (typ) => {
    const lvl = stanGracza.budynki[typ] || 0;
    const koszt = engine.obliczKoszt(typ, lvl);

    // Dynamiczna walidacja wszystkich surowców
    for (const [surowiec, wymaganaIlosc] of Object.entries(koszt)) {
        const posiadane = stanGracza.surowce[surowiec] || 0;
        if (posiadane < wymaganaIlosc) {
            return alert(`Za mało surowców! Brakuje Ci: ${surowiec}`);
        }
    }

    // Dynamiczne odejmowanie surowców wymaganych przez budynek
    const surowceDoAktualizacji = {};
    for (const [surowiec, wymaganaIlosc] of Object.entries(koszt)) {
        stanGracza.surowce[surowiec] -= wymaganaIlosc;
        surowceDoAktualizacji[surowiec] = stanGracza.surowce[surowiec];
    }

    await api.aktualizuj('village_resources', surowceDoAktualizacji, 'village_id', stanGracza.id);

    const czasBudowy = engine.obliczCzasBudowy(typ, lvl, stanGracza.budynki.town_hall);
    await api.insert('construction_queue', {
        village_id: stanGracza.id,
        building_type: typ,
        target_level: lvl + 1,
        finish_time: new Date(Date.now() + czasBudowy * 1000).toISOString()
    });

    await odswiezDaneZ_Bazy();
};

window.rekrutujJednostke = async function (kod, ilosc) {
    if (!stanGracza.id) return;

    const configJednostki = BALANS_JEDNOSTEK[kod];
    if (!configJednostki) return;

    const wszystkieSurowce = [
        'wood', 'stone', 'coal', 'food', 'gold',
        'iron', 'silver', 'relics', 'mithril', 'runestones', 'ale',
        'corpses', 'blood', 'black_frost', 'elderwood', 'crystals', 'stardust',
        'bones', 'hides', 'tusks', 'sulfur', 'obsidian', 'chaos_flame'
    ];

    // 1. Walidacja kosztów
    for (const res of wszystkieSurowce) {
        if (configJednostki[res] && configJednostki[res] > 0) {
            const wymagane = configJednostki[res] * ilosc;
            const posiadane = stanGracza.surowce[res] || 0;

            if (posiadane < wymagane) {
                alert(`Brakuje Ci surowców na wyszkolenie tej jednostki! Brakuje: ${res}`);
                return;
            }
        }
    }

    // 2. Pobieranie surowców
    const surowceDoAktualizacji = {};
    for (const res of wszystkieSurowce) {
        if (configJednostki[res] && configJednostki[res] > 0) {
            stanGracza.surowce[res] -= configJednostki[res] * ilosc;
            surowceDoAktualizacji[res] = stanGracza.surowce[res];
        }
    }

    try {
        await spClient.from('village_resources').update(surowceDoAktualizacji).eq('village_id', stanGracza.id);

        const czasSzkolenia = configJednostki.time * ilosc;

        await api.insert('unit_queue', {
            village_id: stanGracza.id,
            unit_type: kod,
            quantity: ilosc,
            finish_time: new Date(Date.now() + czasSzkolenia * 1000).toISOString()
        });

        await odswiezDaneZ_Bazy();

    } catch (error) {
        console.error("Błąd podczas rekrutacji:", error);
        alert("Błąd połączenia z bazą. Spróbuj ponownie.");
    }
};

// --- WYLOGOWANIE ---
document.getElementById("btn-wyloguj").addEventListener("click", () => {
    clearInterval(interwalProdukcji);
    spClient.auth.signOut();
    location.reload();
});

// --- OBSŁUGA ZAKŁADEK ---
document.querySelectorAll('.btn-zakladka').forEach(b => {
    b.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-zakladka').forEach(btn => btn.classList.remove('aktywna'));
        e.target.classList.add('aktywna');
        document.querySelectorAll('.zakladka-tresc').forEach(t => t.classList.add('ukryty'));
        document.getElementById(e.target.getAttribute('data-cel')).classList.remove('ukryty');
    });
});
