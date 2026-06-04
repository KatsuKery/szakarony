// Połączenie z Twoim Supabase
const SUPABASE_URL = "https://avofpueaxoxsfefsuskn.supabase.co";
const SUPABASE_KEY = "sb_publishable_PMPJWyxglYFIHVkcRqBKYQ_s-k9CmVl";
const spClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Supabase zainicjalizowany pomyślnie!");

// Mapa budynków unikalnych do filtrowania (dodane do logiki)
const BUDYNKI_FRAKCYJNE = {
    ludzie: ['iron_mine', 'silver_shaft', 'cathedral'],
    krasnoludy: ['deep_shaft', 'rune_forge', 'brewery'],
    nieumarli: ['graveyard', 'blood_fountain', 'ice_spire'],
    elfy: ['sacred_grove', 'crystal_cave', 'observatory'],
    orkowie: ['bone_pit', 'tannery', 'beast_cages'],
    demony: ['sulfur_fissure', 'volcanic_crater', 'chaos_altar']
};

// Pobranie elementów HTML
const emailInput = document.getElementById("email");
const hasloInput = document.getElementById("haslo");
const selektorFrakcji = document.getElementById("frakcja");
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

let interwalProdukcji = null;

// --- REJESTRACJA NOWEGO GRACZA + TWORZENIE WIOSKI ---
btnZarejestruj.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = hasloInput.value;
    const wybranaFrakcja = selektorFrakcji.value;

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
        faction: wybranaFrakcja,
        last_update: new Date().toISOString()
    });

    if (villageError) return alert("Błąd tworzenia wioski: " + villageError.message);

    const { error: resError } = await spClient.from('village_resources').insert({
        village_id: userId,
        wood: 150, stone: 120, coal: 50, food: 100,
        gold: 50, population: 10, knowledge: 0, essence: 0,
        iron: 0, silver: 0, relics: 0,
        mithril: 0, runestones: 0, ale: 0,
        corpses: 0, blood: 0, black_frost: 0,
        elderwood: 0, crystals: 0, stardust: 0,
        bones: 0, hides: 0, tusks: 0,
        sulfur: 0, obsidian: 0, chaos_flame: 0
    });

    if (resError) return alert("Błąd generowania zasobów: " + resError.message);

    const { error: buildError } = await spClient.from('village_buildings').insert({
        village_id: userId,
        town_hall: 1, lumberjack: 1, quarry: 1, coal_mine: 1, farm: 1
    });

    if (buildError) return alert("Błąd wznoszenia budynków startowych: " + buildError.message);

    alert("Wioska " + wybranaFrakcja + " została pomyślnie zainicjalizowana! Możesz się zalogować.");
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

    console.log(`Naliczam produkcję offline za ${roznicaSekund} sekund.`);

    let wyprodukowano = { wood: 0, stone: 0, coal: 0, food: 0 };

    for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
        if (config.resProd) {
            const lvl = stanGracza.budynki[kodBudynku] || 0;
            const przyrostNaSekunde = lvl * config.prodBaza;
            wyprodukowano[config.resProd] += przyrostNaSekunde * roznicaSekund;
        }
    }

    const zaktualizowaneSurowce = {
        wood: Math.floor(stanGracza.surowce.wood + wyprodukowano.wood),
        stone: Math.floor(stanGracza.surowce.stone + wyprodukowano.stone),
        coal: Math.floor(stanGracza.surowce.coal + wyprodukowano.coal),
        food: Math.floor(stanGracza.surowce.food + wyprodukowano.food)
    };

    const nowyCzasISO = dataAktualna.toISOString();

    await spClient.from('village_resources').update(zaktualizowaneSurowce).eq('village_id', stanGracza.id);
    await spClient.from('villages').update({ last_update: nowyCzasISO }).eq('id', stanGracza.id);

    stanGracza.surowce.wood = zaktualizowaneSurowce.wood;
    stanGracza.surowce.stone = zaktualizowaneSurowce.stone;
    stanGracza.surowce.coal = zaktualizowaneSurowce.coal;
    stanGracza.surowce.food = zaktualizowaneSurowce.food;
    stanGracza.wioska.last_update = nowyCzasISO;

    aktualizujInterfejs();
}

// --- FUNKCJA ODŚWIEŻAJĄCA ELEMENTY INTERFEJSU ---
function aktualizujInterfejs() {
    if (!stanGracza.wioska) return;
    document.getElementById("nazwa-wioski").innerText = stanGracza.wioska.name;
    document.getElementById("wioska-x").innerText = stanGracza.wioska.pos_x;
    document.getElementById("wioska-y").innerText = stanGracza.wioska.pos_y;
    document.getElementById("wioska-frakcja").innerText = stanGracza.wioska.faction || "Nieznana";

    document.getElementById("res-wood").innerText = Math.floor(stanGracza.surowce.wood || 0);
    document.getElementById("res-stone").innerText = Math.floor(stanGracza.surowce.stone || 0);
    document.getElementById("res-coal").innerText = Math.floor(stanGracza.surowce.coal || 0);
    document.getElementById("res-food").innerText = Math.floor(stanGracza.surowce.food || 0);
    document.getElementById("res-gold").innerText = Math.floor(stanGracza.surowce.gold || 0);
    document.getElementById("res-population").innerText = Math.floor(stanGracza.surowce.population || 0);
    document.getElementById("res-knowledge").innerText = Math.floor(stanGracza.surowce.knowledge || 0);
    document.getElementById("res-essence").innerText = Math.floor(stanGracza.surowce.essence || 0);

    const frakcja = stanGracza.wioska.faction;
    const wszystkieFrakcje = ['ludzie', 'krasnoludy', 'nieumarli', 'elfy', 'orkowie', 'demony'];

    wszystkieFrakcje.forEach(f => {
        const blok = document.getElementById(`frakcja-${f}`);
        if (blok) blok.style.display = 'none';
    });

    const aktywnyBlok = document.getElementById(`frakcja-${frakcja}`);
    if (aktywnyBlok) aktywnyBlok.style.display = 'flex';

    if (frakcja === "ludzie") {
        document.getElementById("res-iron").innerText = Math.floor(stanGracza.surowce.iron || 0);
        document.getElementById("res-silver").innerText = Math.floor(stanGracza.surowce.silver || 0);
        document.getElementById("res-relics").innerText = Math.floor(stanGracza.surowce.relics || 0);
    } else if (frakcja === "krasnoludy") {
        document.getElementById("res-mithril").innerText = Math.floor(stanGracza.surowce.mithril || 0);
        document.getElementById("res-runestones").innerText = Math.floor(stanGracza.surowce.runestones || 0);
        document.getElementById("res-ale").innerText = Math.floor(stanGracza.surowce.ale || 0);
    } else if (frakcja === "nieumarli") {
        document.getElementById("res-corpses").innerText = Math.floor(stanGracza.surowce.corpses || 0);
        document.getElementById("res-blood").innerText = Math.floor(stanGracza.surowce.blood || 0);
        document.getElementById("res-black_frost").innerText = Math.floor(stanGracza.surowce.black_frost || 0);
    } else if (frakcja === "elfy") {
        document.getElementById("res-elderwood").innerText = Math.floor(stanGracza.surowce.elderwood || 0);
        document.getElementById("res-crystals").innerText = Math.floor(stanGracza.surowce.crystals || 0);
        document.getElementById("res-stardust").innerText = Math.floor(stanGracza.surowce.stardust || 0);
    } else if (frakcja === "orkowie") {
        document.getElementById("res-bones").innerText = Math.floor(stanGracza.surowce.bones || 0);
        document.getElementById("res-hides").innerText = Math.floor(stanGracza.surowce.hides || 0);
        document.getElementById("res-tusks").innerText = Math.floor(stanGracza.surowce.tusks || 0);
    } else if (frakcja === "demony") {
        document.getElementById("res-sulfur").innerText = Math.floor(stanGracza.surowce.sulfur || 0);
        document.getElementById("res-obsidian").innerText = Math.floor(stanGracza.surowce.obsidian || 0);
        document.getElementById("res-chaos_flame").innerText = Math.floor(stanGracza.surowce.chaos_flame || 0);
    }

    for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
        if (config.resProd) {
            const lvl = stanGracza.budynki[kodBudynku] || 0;
            const prodNaGodzine = Math.floor(lvl * config.prodBaza * 3600);
            const elementProd = document.getElementById(`prod-${config.resProd}`);
            if (elementProd) elementProd.innerText = "+" + prodNaGodzine;
        }
    }

    const kontener = document.getElementById("kontener-budynkow");
    if (!kontener) return;
    kontener.innerHTML = "";
    const poziomRatusza = stanGracza.budynki.town_hall || 1;

    // --- FILTROWANIE BUDYNKÓW ---
    const wszystkieUnikalneBudynki = Object.values(BUDYNKI_FRAKCYJNE).flat();

    for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
        // Logika filtra: jeśli budynek jest unikalny i nie należy do frakcji - pomiń
        if (wszystkieUnikalneBudynki.includes(kodBudynku) && !BUDYNKI_FRAKCYJNE[frakcja]?.includes(kodBudynku)) {
            continue;
        }

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
        .select('id, name, pos_x, pos_y, faction')
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
            <strong>Frakcja:</strong> <span style="text-transform: capitalize;">${wioska.faction || 'Nieznana'}</span><br>
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
    if (interwalProdukcji) clearInterval(interwalProdukcji);

    interwalProdukcji = setInterval(async () => {
        if (!stanGracza.surowce || !stanGracza.budynki) return;

        // Naliczanie surowców w locie
        for (const [kodBudynku, config] of Object.entries(BALANS_BUDYNKOW)) {
            if (config.resProd) {
                const lvl = stanGracza.budynki[kodBudynku] || 0;
                stanGracza.surowce[config.resProd] += (lvl * config.prodBaza);
            }
        }

        // Aktualizacja UI surowców
        const domWood = document.getElementById("res-wood");
        if (domWood) domWood.innerText = Math.floor(stanGracza.surowce.wood);
        const domStone = document.getElementById("res-stone");
        if (domStone) domStone.innerText = Math.floor(stanGracza.surowce.stone);
        const domCoal = document.getElementById("res-coal");
        if (domCoal) domCoal.innerText = Math.floor(stanGracza.surowce.coal);
        const domFood = document.getElementById("res-food");
        if (domFood) domFood.innerText = Math.floor(stanGracza.surowce.food);

        let aktualnaData = new Date();
        let wymaganeOdswiezenieBazy = false;

        // Obsługa timerów budowy
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
        return alert(`Kolejka budowy jest pełna! Maksymalna liczba budów: ${maxKolejka}.`);
    }

    if (stanGracza.kolejkaBudowy.some(q => q.building_type === typ)) {
        return alert("Ten budynek już znajduje się w kolejce budowy!");
    }

    const koszt = obliczKoszt(typ, obecnyLvl);
    if (stanGracza.surowce.wood < koszt.wood || stanGracza.surowce.stone < koszt.stone) {
        return alert(`Za mało zasobów! Wymagane: 🪵 ${koszt.wood}, 🪨 ${koszt.stone}.`);
    }

    clearInterval(interwalProdukcji);
    interwalProdukcji = null;

    const poziomRatusza = stanGracza.budynki.town_hall || 1;
    const czasTrwaniaSekundy = obliczCzasBudowy(typ, obecnyLvl, poziomRatusza);

    const { error: errRes } = await spClient.from('village_resources').update({
        wood: Math.floor(stanGracza.surowce.wood - koszt.wood),
        stone: Math.floor(stanGracza.surowce.stone - koszt.stone)
    }).eq('village_id', stanGracza.id);

    if (errRes) {
        alert("Błąd potrącania kosztów: " + errRes.message);
        odpalZegarProdukcji();
        return;
    }

    const dataZakonczenia = new Date();
    dataZakonczenia.setSeconds(dataZakonczenia.getSeconds() + czasTrwaniaSekundy);

    await spClient.from('construction_queue').insert({
        village_id: stanGracza.id,
        building_type: typ,
        target_level: obecnyLvl + 1,
        finish_time: dataZakonczenia.toISOString()
    });

    await spClient.from('villages').update({ last_update: new Date().toISOString() }).eq('id', stanGracza.id);
    await odswiezDaneZ_Bazy();
}

// --- WYLOGOWANIE ---
btnWyloguj.addEventListener("click", async () => {
    clearInterval(interwalProdukcji);
    interwalProdukcji = null;

    if (stanGracza.id && stanGracza.surowce) {
        let doZapisu = { ...stanGracza.surowce };
        delete doZapisu.id;
        delete doZapisu.village_id;

        for (let klucz in doZapisu) {
            if (typeof doZapisu[klucz] === 'number') doZapisu[klucz] = Math.floor(doZapisu[klucz]);
        }

        await spClient.from('village_resources').update(doZapisu).eq('village_id', stanGracza.id);
        await spClient.from('villages').update({ last_update: new Date().toISOString() }).eq('id', stanGracza.id);
    }

    await spClient.auth.signOut();
    pokazEkranLogowania();
});

// --- OBSŁUGA PRZEŁĄCZANIA ZAKŁADEK NAWIGACJI ---
document.querySelectorAll('.btn-zakladka').forEach(przycisk => {
    przycisk.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-zakladka').forEach(b => b.classList.remove('aktywna'));
        e.target.classList.add('aktywna');
        document.querySelectorAll('.zakladka-tresc').forEach(tresc => tresc.classList.add('ukryty'));
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

    document.querySelectorAll('.btn-zakladka').forEach(b => b.classList.remove('aktywna'));
    document.querySelector('[data-cel="widok-ogolny"]').classList.add('aktywna');
    document.querySelectorAll('.zakladka-tresc').forEach(tresc => tresc.classList.add('ukryty'));
    document.getElementById('widok-ogolny').classList.remove('ukryty');
}