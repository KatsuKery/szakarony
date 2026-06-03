// Połączenie z Twoim Supabase
const SUPABASE_URL = "https://avofpueaxoxsfefsuskn.supabase.co";
const SUPABASE_KEY = "sb_publishable_PMPJWyxglYFIHVkcRqBKYQ_s-k9CmVl";
const spClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase zainicjalizowany pomyślnie!");

// Pobranie elementów HTML
const emailInput = document.getElementById("email");
const hasloInput = document.getElementById("haslo");
const btnZaloguj = document.getElementById("btn-zaloguj");
const btnZarejestruj = document.getElementById("btn-zarejestruj");
const btnWyloguj = document.getElementById("btn-wyloguj");
const sekcjaAuth = document.getElementById("sekcja-auth");
const sekcjaGra = document.getElementById("sekcja-gra");

// Obiekt przechowujący dane aktywnego gracza
let stanGracza = {
    id: null,
    wioska: null,
    surowce: null,
    budynki: null,
    kolejkaBudowy: []
};

// Zmienna przechowująca identyfikator pętli czasu
let interwalProdukcji = null;

// --- REJESTRARJA NOWEGO GRACZA + TWORZENIE WIOSKI ---
btnZarejestruj.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = hasloInput.value;

    if (!email || !password) return alert("Wpisz email i hasło!");

    const { data: authData, error: authError } = await spClient.auth.signUp({
        email: email,
        password: password,
    });

    if (authError) return alert("Błąd rejestracji: " + authError.message);
    if (!authData.user) return alert("Błąd krytyczny: Nie utworzono użytkownika.");

    const userId = authData.user.id;

    const losoweX = Math.floor(Math.random() * 80) + 10;
    const losoweY = Math.floor(Math.random() * 80) + 10;

    const { error: villageError } = await spClient.from('villages').insert({
        id: userId,
        name: "Osada " + email.split('@')[0],
        pos_x: losoweX,
        pos_y: losoweY,
        is_premium: false,
        last_update: new Date().toISOString()
    });

    if (villageError) return alert("Błąd tworzenia wioski: " + villageError.message);

    const { error: resError } = await spClient.from('village_resources').insert({
        village_id: userId,
        wood: 150,
        stone: 120,
        bread: 20,
        gold_coins: 50
    });

    if (resError) return alert("Błąd generowania zasobów: " + resError.message);

    const { error: buildError } = await spClient.from('village_buildings').insert({
        village_id: userId,
        town_hall: 1,
        lumberjack: 1,
        quarry: 1,
        farm: 1,
        well: 1
    });

    if (buildError) return alert("Błąd wznoszenia budynków startowych: " + buildError.message);

    alert("Wioska i gospodarka zostały pomyślnie zainicjalizowane! Możesz się zalogować.");
});

// --- LOGOWANIE + POBRANIE DANYCH Z 3 TABEL ---
btnZaloguj.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = hasloInput.value;

    if (!email || !password) return alert("Wpisz email i hasło!");

    const { data: authData, error: authError } = await spClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (authError) return alert("Nie udało się zalogować: " + authError.message);

    stanGracza.id = authData.user.id;

    await odswiezDaneZ_Bazy();
    await obliczCzasOffline();

    alert("Witaj w swojej osadzie!");
    pokazGre();
});

// --- FUNKCJA POBIERAJĄCA DANE Z SUPABASE ---
async function odswiezDaneZ_Bazy() {
    if (!stanGracza.id) return;

    const { data: vData } = await spClient.from('villages').select('*').eq('id', stanGracza.id).single();
    const { data: rData } = await spClient.from('village_resources').select('*').eq('village_id', stanGracza.id).single();
    const { data: bData } = await spClient.from('village_buildings').select('*').eq('village_id', stanGracza.id).single();
    const { data: qData } = await spClient.from('construction_queue').select('*').eq('village_id', stanGracza.id).order('finish_time', { ascending: true });

    stanGracza.wioska = vData;
    stanGracza.surowce = rData;
    stanGracza.budynki = bData;
    stanGracza.kolejkaBudowy = qData || [];

    aktualizujInterfejs();
    await renderujMape();

    if (!interwalProdukcji) {
        odpalZegarProdukcji();
    }
}

// --- SYSTEM OBLICZANIA PRODUKCJI OFFLINE ---
async function obliczCzasOffline() {
    if (!stanGracza.wioska || !stanGracza.surowce || !stanGracza.budynki) return;

    const dataOstatnia = new Date(stanGracza.wioska.last_update);
    const dataAktualna = new Date();

    const roznicaSekund = Math.floor((dataAktualna - dataOstatnia) / 1000);

    if (roznicaSekund < 2) return;

    console.log(`Gracza nie było przez: ${roznicaSekund} sekund. Naliczam produkcję offline...`);

    let wyprodukowano = { wood: 0, stone: 0, wheat: 0, water: 0, iron_ore: 0, coal: 0 };

    for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
        if (config.resProd) {
            const lvl = stanGracza.budynki[kodBudynku] || 0;
            const przyrostNaSekunde = lvl * config.prodBaza;
            wyprodukowano[config.resProd] = przyrostNaSekunde * roznicaSekund;
        }
    }

    const zaktualizowaneSurowce = {
        wood: Math.floor(stanGracza.surowce.wood + wyprodukowano.wood),
        stone: Math.floor(stanGracza.surowce.stone + wyprodukowano.stone),
        wheat: Math.floor(stanGracza.surowce.wheat + wyprodukowano.wheat),
        water: Math.floor(stanGracza.surowce.water + wyprodukowano.water),
        iron_ore: Math.floor(stanGracza.surowce.iron_ore + wyprodukowano.iron_ore),
        coal: Math.floor(stanGracza.surowce.coal + wyprodukowano.coal)
    };

    const nowyCzasISO = dataAktualna.toISOString();

    const { error: errRes } = await spClient
        .from('village_resources')
        .update(zaktualizowaneSurowce)
        .eq('village_id', stanGracza.id);

    const { error: errTime } = await spClient
        .from('villages')
        .update({ last_update: nowyCzasISO })
        .eq('id', stanGracza.id);

    if (!errRes && !errTime) {
        console.log("Gospodarka offline zsynchronizowana z Supabase pomyślnie!");
        stanGracza.surowce.wood = zaktualizowaneSurowce.wood;
        stanGracza.surowce.stone = zaktualizowaneSurowce.stone;
        stanGracza.surowce.wheat = zaktualizowaneSurowce.wheat;
        stanGracza.surowce.water = zaktualizowaneSurowce.water;
        stanGracza.surowce.iron_ore = zaktualizowaneSurowce.iron_ore;
        stanGracza.surowce.coal = zaktualowaneSurowce.coal;
        stanGracza.wioska.last_update = nowyCzasISO;

        aktualizujInterfejs();
    }
}

// --- FUNKCJA ODŚWIEŻAJĄCA ELEMENTY INTERFEJSU ---
function aktualizujInterfejs() {
    document.getElementById("nazwa-wioski").innerText = stanGracza.wioska.name;
    document.getElementById("wioska-x").innerText = stanGracza.wioska.pos_x;
    document.getElementById("wioska-y").innerText = stanGracza.wioska.pos_y;

    document.getElementById("res-wood").innerText = Math.floor(stanGracza.surowce.wood);
    document.getElementById("res-stone").innerText = Math.floor(stanGracza.surowce.stone);
    document.getElementById("res-iron-ore").innerText = Math.floor(stanGracza.surowce.iron_ore || 0);
    document.getElementById("res-coal").innerText = Math.floor(stanGracza.surowce.coal || 0);
    document.getElementById("res-wheat").innerText = Math.floor(stanGracza.surowce.wheat || 0);
    document.getElementById("res-water").innerText = Math.floor(stanGracza.surowce.water || 0);
    document.getElementById("res-flour").innerText = Math.floor(stanGracza.surowce.flour || 0);
    document.getElementById("res-iron-ingot").innerText = Math.floor(stanGracza.surowce.iron_ingot || 0);
    document.getElementById("res-bread").innerText = Math.floor(stanGracza.surowce.bread || 0);
    document.getElementById("res-gold-coins").innerText = Math.floor(stanGracza.surowce.gold_coins || 0);

    for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
        if (config.resProd) {
            const lvl = stanGracza.budynki[kodBudynku] || 0;
            const prodNaGodzine = Math.floor(lvl * config.prodBaza * 3600);
            const elementProd = document.getElementById(`prod-${config.resProd}`);
            if (elementProd) elementProd.innerText = "+" + prodNaGodzine;
        }
    }

    const kontener = document.getElementById("kontener-budynkow");
    kontener.innerHTML = "";

    const poziomRatusza = stanGracza.budynki.town_hall || 1;

    for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
        const lvl = stanGracza.budynki[kodBudynku] || 0;
        const koszt = obliczKoszt(kodBudynku, lvl);

        const czasSekundy = obliczCzasBudowy(kodBudynku, lvl, poziomRatusza);
        let czasTekst = czasSekundy + "s";
        if (czasSekundy >= 60) {
            const minuty = Math.floor(czasSekundy / 60);
            const sekundy = czasSekundy % 60;
            czasTekst = `${minuty}m ${sekundy}s`;
        }

        const budovaWTle = stanGracza.kolejkaBudowy.find(q => q.building_type === kodBudynku);

        let infoO_Produkcji = "";
        if (config.resProd) {
            const aktualnaProd = Math.floor(lvl * config.prodBaza * 3600);
            const nastepnaProd = Math.floor((lvl + 1) * config.prodBaza * 3600);
            infoO_Produkcji = `⚙️ Produkcja: <b>+${aktualnaProd}/h</b> <span style="color: #27ae60;">(po ulepszeniu: +${nastepnaProd}/h)</span>`;
        } else {
            if (kodBudynku === "town_hall") {
                infoO_Produkcji = `🏛️ <i>Skraca czas wznoszenia innych budynków</i>`;
            } else {
                infoO_Produkcji = `✨ <i>Budynek przetwórczy / technologiczny</i>`;
            }
        }

        let przyciskHTML = `<button class="btn-budowy" onclick="rozbudujBudynek('${kodBudynku}')">Rozbuduj</button>`;
        if (budovaWTle) {
            const pozostałoSekund = Math.max(0, Math.floor((new Date(budovaWTle.finish_time) - new Date()) / 1000));
            przyciskHTML = `<button class="btn-budowy" style="background-color: #e67e22;" disabled>Budowa: <span id="timer-${kodBudynku}">${pozostałoSekund}s</span></button>`;
        }

        const budynekHTML = `
            <div class="budynek-wiersz">
                <div class="budynek-info">
                    <span><strong>${config.name}</strong> (Poziom ${lvl})</span>
                    ${przyciskHTML}
                </div>
                <div style="font-size: 0.85em; color: #2c3e50; margin-top: 2px;">
                    ${infoO_Produkcji}
                </div>
                <div class="koszt-tekst" style="margin-top: 2px;">
                    Koszt: 🪵 <b>${koszt.wood}</b> | 🪨 <b>${koszt.stone}</b> | ⏱️ Czas: <b>${czasTekst}</b>
                </div>
            </div>
        `;
        kontener.innerHTML += budynekHTML;
    }
}

// --- LOGIKA SYSTEMU MAPY ŚWIATA ---
async function fetchNearbyVillages() {
    const radius = 3;
    const minX = stanGracza.wioska.pos_x - radius;
    const maxX = stanGracza.wioska.pos_x + radius;
    const minY = stanGracza.wioska.pos_y - radius;
    const maxY = stanGracza.wioska.pos_y + radius;

    const { data, error } = await spClient
        .from('villages')
        .select('id, name, pos_x, pos_y')
        .gte('pos_x', minX)
        .lte('pos_x', maxX)
        .gte('pos_y', minY)
        .lte('pos_y', maxY);

    if (error) {
        console.error("Błąd podczas pobierania sąsiadów mapy:", error.message);
        return [];
    }
    return data;
}

async function renderujMape() {
    const mapGrid = document.getElementById('map-grid');
    if (!mapGrid) return;

    mapGrid.innerHTML = "";

    const radius = 3;
    const nearbyVillages = await fetchNearbyVillages();

    const mapaWioch = {};
    nearbyVillages.forEach(v => {
        mapaWioch[`${v.pos_x}_${v.pos_y}`] = v;
    });

    for (let y = stanGracza.wioska.pos_y - radius; y <= stanGracza.wioska.pos_y + radius; y++) {
        for (let x = stanGracza.wioska.pos_x - radius; x <= stanGracza.wioska.pos_x + radius; x++) {

            const cell = document.createElement('div');
            cell.className = 'map-cell';

            const klucz = `${x}_${y}`;
            const wioskaNaPolu = mapaWioch[klucz];

            if (x === stanGracza.wioska.pos_x && y === stanGracza.wioska.pos_y) {
                cell.classList.add('my-village');
                cell.textContent = "🏠";
            } else if (wioskaNaPolu) {
                cell.classList.add('enemy-village');
                cell.textContent = "🏰";
            } else {
                cell.classList.add('empty-field');
                cell.textContent = "🌲";
            }

            cell.addEventListener('click', () => pokazSzczegolyPola(x, y, wioskaNaPolu));
            mapGrid.appendChild(cell);
        }
    }
}

function pokazSzczegolyPola(x, y, wioska) {
    const detailInfo = document.getElementById('detail-info');
    if (!detailInfo) return;

    if (wioska) {
        const czyMoja = wioska.id === stanGracza.id;
        detailInfo.innerHTML = `
            <strong>Typ:</strong> ${czyMoja ? "Twoja Wioska" : "Wioska Gracza"}<br>
            <strong>Nazwa:</strong> ${wioska.name}<br>
            <strong>Współrzędne:</strong> (${x}|${y})<br>
            ${czyMoja ? '' : '<button onclick="alert(\'Mechanika napadów wkrótce!\')">Wyślij atak</button>'}
        `;
    } else {
        detailInfo.innerHTML = `
            <strong>Typ:</strong> Dzika głusza (Puste Pole)<br>
            <strong>Współrzędne:</strong> (${x}|${y})<br>
            <small>Brak osad na tym terenie. Idealne miejsce pod przyszłą ekspansję.</small>
        `;
    }
}

// --- SILNIK CZASU GRY ---
function odpalZegarProdukcji() {
    interwalProdukcji = setInterval(async () => {
        if (!stanGracza.surowce || !stanGracza.budynki) return;

        for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
            if (config.resProd) {
                const lvl = stanGracza.budynki[kodBudynku] || 0;
                stanGracza.surowce[config.resProd] += lvl * config.prodBaza;
            }
        }

        document.getElementById("res-wood").innerText = Math.floor(stanGracza.surowce.wood);
        document.getElementById("res-stone").innerText = Math.floor(stanGracza.surowce.stone);
        document.getElementById("res-iron-ore").innerText = Math.floor(stanGracza.surowce.iron_ore || 0);
        document.getElementById("res-coal").innerText = Math.floor(stanGracza.surowce.coal || 0);
        document.getElementById("res-wheat").innerText = Math.floor(stanGracza.surowce.wheat || 0);
        document.getElementById("res-water").innerText = Math.floor(stanGracza.surowce.water || 0);

        let aktualnaData = new Date();
        let wymaganeOdswiezenieBazy = false;

        for (const zadanie of stanGracza.kolejkaBudowy) {
            const elementTimer = document.getElementById(`timer-${zadanie.building_type}`);
            const czasKoncowy = new Date(zadanie.finish_time);
            const roznica = Math.max(0, Math.floor((czasKoncowy - aktualnaData) / 1000));

            if (elementTimer) {
                elementTimer.innerText = roznica + "s";
            }

            if (roznica <= 0) {
                wymaganeOdswiezenieBazy = true;
            }
        }

        if (wymaganeOdswiezenieBazy) {
            clearInterval(interwalProdukcji);
            interwalProdukcji = null;

            console.log("Budowa ukończona! Synchronizuję dane z Supabase...");

            let teraz = new Date();
            for (const zadanie of [...stanGracza.kolejkaBudowy]) {
                if (new Date(zadanie.finish_time) <= teraz) {
                    await spClient.from('village_buildings').update({ [zadanie.building_type]: zadanie.target_level }).eq('village_id', stanGracza.id);
                    await spClient.from('construction_queue').delete().eq('id', zadanie.id);
                }
            }
            await odswiezDaneZ_Bazy();
        }

    }, 1000);
}

// --- ROZBUDOWA BUDYNKU (ZAPIS DO KOLEJKI) ---
async function rozbudujBudynek(typ) {
    if (!stanGracza.budynki || !stanGracza.surowce || !stanGracza.wioska) return;

    const config = BALANS_BUDYNKOW[typ];
    const obecnyLvl = stanGracza.budynki[typ] || 0;

    if (obecnyLvl >= config.maxLvl) {
        return alert(`Maksymalny poziom rozbudowy dla: ${config.name} (${config.maxLvl})!`);
    }

    const maxKolejka = stanGracza.wioska.is_premium ? 5 : 2;
    if (stanGracza.kolejkaBudowy.length >= maxKolejka) {
        return alert(`Kolejka budowy jest pełna! Maksymalna liczba budów: ${maxKolejka}. Rozszerz osadę do Konta Premium, aby zwiększyć limit do 5.`);
    }

    if (stanGracza.kolejkaBudowy.some(q => q.building_type === typ)) {
        return alert("Ten budynek już znajduje się w kolejce budowy!");
    }

    const koszt = obliczKoszt(typ, obecnyLvl);

    if (stanGracza.surowce.wood < koszt.wood || stanGracza.surowce.stone < koszt.stone) {
        return alert(`Za mało zasobów na rozbudowę ${config.name}! Wymagane: 🪵 ${koszt.wood}, 🪨 ${koszt.stone}.`);
    }

    clearInterval(interwalProdukcji);
    interwalProdukcji = null;

    const poziomRatusza = stanGracza.budynki.town_hall || 1;
    const czasTrwaniaSekundy = obliczCzasBudowy(typ, obecnyLvl, poziomRatusza);

    const noweDrewno = Math.floor(stanGracza.surowce.wood - koszt.wood);
    const nowyKamien = Math.floor(stanGracza.surowce.stone - koszt.stone);

    const dataZakonczenia = new Date();
    dataZakonczenia.setSeconds(dataZakonczenia.getSeconds() + czasTrwaniaSekundy);

    const { error: errRes } = await spClient.from('village_resources').update({ wood: noweDrewno, stone: nowyKamien }).eq('village_id', stanGracza.id);

    if (errRes) {
        alert("Błąd potrącania kosztów: " + errRes.message);
        odpalZegarProdukcji();
        return;
    }

    const { error: errQueue } = await spClient.from('construction_queue').insert({
        village_id: stanGracza.id,
        building_type: typ,
        target_level: obecnyLvl + 1,
        finish_time: dataZakonczenia.toISOString()
    });

    await spClient.from('villages').update({ last_update: new Date().toISOString() }).eq('id', stanGracza.id);

    if (errQueue) {
        alert("Błąd dodawania do kolejki budowy: " + errQueue.message);
    } else {
        console.log(`Pomyślnie dodano do kolejki: ${config.name}. Czas budowy: ${czasTrwaniaSekundy}s.`);
    }

    await odswiezDaneZ_Bazy();
}

// --- WYLOGOWANIE ---
btnWyloguj.addEventListener("click", async () => {
    clearInterval(interwalProdukcji);
    interwalProdukcji = null;

    if (stanGracza.id && stanGracza.surowce) {
        await spClient.from('village_resources').update({
            wood: Math.floor(stanGracza.surowce.wood),
            stone: Math.floor(stanGracza.surowce.stone),
            wheat: Math.floor(stanGracza.surowce.wheat),
            water: Math.floor(stanGracza.surowce.water),
            iron_ore: Math.floor(stanGracza.surowce.iron_ore),
            coal: Math.floor(stanGracza.surowce.coal)
        }).eq('village_id', stanGracza.id);

        await spClient.from('villages').update({ last_update: new Date().toISOString() }).eq('id', stanGracza.id);
    }

    await spClient.auth.signOut();
    pokazEkranLogowania();
});

// --- OBSŁUGA PRZEŁĄCZANIA ZAKŁADEK NAWIGACJI ---
document.querySelectorAll('.btn-zakladka').forEach(przycisk => {
    przycisk.addEventListener('click', (e) => {
        // 1. Usunięcie klasy 'aktywna' ze wszystkich przycisków i dodanie do klikniętego
        document.querySelectorAll('.btn-zakladka').forEach(b => b.classList.remove('aktywna'));
        e.target.classList.add('aktywna');

        // 2. Ukrycie wszystkich widoków zakładki
        document.querySelectorAll('.zakladka-tresc').forEach(tresc => tresc.classList.add('ukryty'));

        // 3. Pokazanie wybranego widoku na podstawie atrybutu data-cel
        const celId = e.target.getAttribute('data-cel');
        document.getElementById(celId).classList.remove('ukryty');
    });
});

// --- FUNKCJE POMOCNICZE ---
function pokazGre() {
    sekcjaAuth.style.display = "none";
    sekcjaGra.style.display = "block";
}

function pokazEkranLogowania() {
    sekcjaAuth.style.display = "block";
    sekcjaGra.style.display = "none";
    emailInput.value = "";
    hasloInput.value = "";

    // Reset zakładki na domyślną pierwszą przy wylogowaniu
    document.querySelectorAll('.btn-zakladka').forEach(b => b.classList.remove('aktywna'));
    document.querySelector('[data-cel="widok-ogolny"]').classList.add('aktywna');
    document.querySelectorAll('.zakladka-tresc').forEach(tresc => tresc.classList.add('ukryty'));
    document.getElementById('widok-ogolny').classList.remove('ukryty');
}