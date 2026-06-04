import { BALANS_BUDYNKOW, BUDYNKI_FRAKCYJNE } from './config.js';
import { BALANS_JEDNOSTEK } from './units.js';
import { obliczKoszt, obliczCzasBudowy } from './engine.js';

function bezpiecznyTekst(id, wartosc) {
    const el = document.getElementById(id);
    if (el) el.innerText = Math.floor(wartosc || 0);
}

export function aktualizujInterfejs(stan) {
    if (!stan.wioska) return;

    document.getElementById("nazwa-wioski").innerText = stan.wioska.name;
    document.getElementById("wioska-x").innerText = stan.wioska.pos_x;
    document.getElementById("wioska-y").innerText = stan.wioska.pos_y;
    document.getElementById("wioska-frakcja").innerText = stan.wioska.faction || "Nieznana";

    bezpiecznyTekst("res-wood", stan.surowce.wood);
    bezpiecznyTekst("res-stone", stan.surowce.stone);
    bezpiecznyTekst("res-coal", stan.surowce.coal);
    bezpiecznyTekst("res-food", stan.surowce.food);
    bezpiecznyTekst("res-gold", stan.surowce.gold);
    bezpiecznyTekst("res-population", stan.surowce.population);
    bezpiecznyTekst("res-knowledge", stan.surowce.knowledge);
    bezpiecznyTekst("res-essence", stan.surowce.essence);

    for (const [kod, cfg] of Object.entries(BALANS_BUDYNKOW)) {
        if (cfg.resProd) {
            const poziom = stan.budynki[kod] || 0;
            bezpiecznyTekst(`prod-${cfg.resProd}`, poziom * cfg.prodBaza * 60);
        }
    }

    const frakcja = stan.wioska.faction;
    const wszystkieFrakcje = ['ludzie', 'krasnoludy', 'nieumarli', 'elfy', 'orkowie', 'demony'];
    wszystkieFrakcje.forEach(f => {
        const blok = document.getElementById(`frakcja-${f}`);
        if (blok) blok.style.display = (f === frakcja) ? 'flex' : 'none';
    });

    const mapowanieFrakcji = {
        ludzie: { iron: 'res-iron', silver: 'res-silver', relics: 'res-relics' },
        krasnoludy: { mithril: 'res-mithril', runestones: 'res-runestones', ale: 'res-ale' },
        nieumarli: { corpses: 'res-corpses', blood: 'res-blood', black_frost: 'res-black_frost' },
        elfy: { elderwood: 'res-elderwood', crystals: 'res-crystals', stardust: 'res-stardust' },
        orkowie: { bones: 'res-bones', hides: 'res-hides', tusks: 'res-tusks' },
        demony: { sulfur: 'res-sulfur', obsidian: 'res-obsidian', chaos_flame: 'res-chaos_flame' }
    };

    if (mapowanieFrakcji[frakcja]) {
        for (const [klucz, elementId] of Object.entries(mapowanieFrakcji[frakcja])) {
            bezpiecznyTekst(elementId, stan.surowce[klucz]);
        }
    }

    // --- RENDEROWANIE BUDYNKÓW ---
    const kontenerBudynkow = document.getElementById("kontener-budynkow");
    if (kontenerBudynkow) {
        kontenerBudynkow.innerHTML = "";
        const poziomRatusza = stan.budynki.town_hall || 1;
        const wszystkieUnikalne = Object.values(BUDYNKI_FRAKCYJNE).flat();

        const grupy = { "Główne": [], "Surowce": [], "Specjalne": [], "Wojskowe": [] };
        for (const [kod, config] of Object.entries(BALANS_BUDYNKOW)) {
            if (wszystkieUnikalne.includes(kod) && !BUDYNKI_FRAKCYJNE[frakcja]?.includes(kod)) continue;
            const kat = config.kategoria || "Inne";
            if (!grupy[kat]) grupy[kat] = [];
            grupy[kat].push({ kod, config });
        }

        for (const [nazwaKat, budynki] of Object.entries(grupy)) {
            if (budynki.length === 0) continue;
            kontenerBudynkow.innerHTML += `<h3 style="margin: 20px 0 5px 0; border-bottom: 2px solid #ccc;">${nazwaKat}</h3>`;

            for (const { kod, config } of budynki) {
                const lvl = stan.budynki[kod] || 0;
                const koszt = obliczKoszt(kod, lvl);
                const czas = obliczCzasBudowy(kod, lvl, poziomRatusza);
                const budowa = stan.kolejka.find(q => q.building_type === kod);

                let przycisk = budowa
                    ? `<button disabled>Budowa: ${Math.max(0, Math.floor((new Date(budowa.finish_time) - new Date()) / 1000))}s</button>`
                    : `<button onclick="window.rozbudujBudynek('${kod}')">Rozbuduj</button>`;

                kontenerBudynkow.innerHTML += `
                    <div class="budynek-wiersz">
                        <div><strong>${config.name}</strong> (lvl ${lvl})</div>
                        <div class="budynek-akcje" style="text-align: right;">
                            <div style="font-size: 0.8em; margin-bottom: 5px;">🪵${koszt.wood} 🪨${koszt.stone} | ${czas >= 60 ? Math.floor(czas / 60) + 'm' : czas + 's'}</div>
                            ${przycisk}
                        </div>
                    </div>`;
            }
        }
    }

    // --- RENDEROWANIE KOSZAR ---
    const kontenerWojska = document.getElementById("kontener-wojska");
    if (kontenerWojska) {
        kontenerWojska.innerHTML = "";

        const ikony = {
            wood: '🪵', stone: '🪨', coal: '🔥', food: '🍞', gold: '💰', pop: '👥',
            iron: '⛏️', silver: '🥈', relics: '🏺', mithril: '🛡️', runestones: '🪨', ale: '🍺',
            corpses: '🦴', blood: '🩸', black_frost: '❄️', elderwood: '🌳', crystals: '💎', stardust: '✨',
            bones: '💀', hides: '⛺', tusks: '🐗', sulfur: '🌋', obsidian: '🪨', chaos_flame: '🔥'
        };

        const wszystkieSurowceKeys = Object.keys(ikony);
        const isPremium = stan.wioska.is_premium || false;
        const maxSlots = isPremium ? 3 : 1;

        // Nagłówek informujący o statusie konta Premium i zajętych slotach w kolejce szkolenia
        let aktualneTaski = stan.kolejkaWojsko ? stan.kolejkaWojsko.length : 0;
        kontenerWojska.innerHTML += `
            <div style="background: #f1f2f6; padding: 10px; border-radius: 5px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid ${isPremium ? '#f1c40f' : '#7f8c8d'};">
                <div>
                    Status konta: <strong style="color: ${isPremium ? '#f39c12' : '#2c3e50'};">${isPremium ? '👑 PREMIUM' : '👤 ZWYKŁE'}</strong>
                    <br><small style="color: #7f8c8d;">Kolejka rekrutacji: <strong>${aktualneTaski} / ${maxSlots}</strong> slotów</small>
                </div>
                <button onclick="window.przelaczPremium()" style="background: ${isPremium ? '#e74c3c' : '#f1c40f'}; color: ${isPremium ? 'white' : 'black'}; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 0.85em; font-weight: bold;">
                    ${isPremium ? 'Wyłącz Premium (Test)' : 'Włącz Premium (Test)'}
                </button>
            </div>
        `;

        for (const [kod, config] of Object.entries(BALANS_JEDNOSTEK)) {
            if (config.faction !== frakcja) continue;

            const posiadane = stan.jednostki && stan.jednostki[kod] ? stan.jednostki[kod] : 0;

            // --- PRZELICZNIK MAX ---
            let maxMozliwe = Infinity;
            let maKoszty = false;

            wszystkieSurowceKeys.forEach(res => {
                if (config[res] && config[res] > 0) {
                    maKoszty = true;
                    const posiadaneRes = stan.surowce[res] || 0;
                    const ileZtego = Math.floor(posiadaneRes / config[res]);
                    if (ileZtego < maxMozliwe) maxMozliwe = ileZtego;
                }
            });
            if (!maKoszty || maxMozliwe === Infinity) maxMozliwe = 0;

            // Renderowanie statusu odliczania kolejki szkolenia wojskowego
            const zleceniaWojska = stan.kolejkaWojsko ? stan.kolejkaWojsko.filter(q => q.unit_type === kod) : [];
            let tekstKolejki = '';

            if (zleceniaWojska.length > 0) {
                tekstKolejki = zleceniaWojska.map(q => {
                    const sekundy = Math.max(0, Math.floor((new Date(q.finish_time) - new Date()) / 1000));
                    return `<br><span style="color: #e67e22; font-size: 0.9em; font-weight: bold;">⏳ W szkoleniu: ${q.quantity} (zostało ${sekundy >= 60 ? Math.floor(sekundy / 60) + 'm ' + (sekundy % 60) + 's' : sekundy + 's'})</span>`;
                }).join('');
            }

            let kosztyTekst = Object.keys(config)
                .filter(k => ikony[k] && config[k] > 0)
                .map(k => `${ikony[k]}${config[k]}`)
                .join(' ');

            kontenerWojska.innerHTML += `
                <div class="budynek-wiersz" style="padding: 15px; border: 1px solid #ddd; margin-bottom: 10px; border-radius: 5px; background: #fff;">
                    <div style="flex: 1;">
                        <strong style="font-size: 1.1em;">${config.name}</strong> <span style="color:#27ae60; font-weight:bold;">(Masz: ${posiadane})</span>
                        ${tekstKolejki}
                        <br><small style="color: #7f8c8d;">Rola: ${config.role} | ⚔️${config.att} Atak | 🛡️${config.def} Obrona | 🐎Szybkość: ${config.speed}m/pole</small>
                        <div style="font-size: 0.85em; margin-top: 5px; color: #34495e;">Koszt jedn.: ${kosztyTekst} | ⏱️${config.time}s</div>
                    </div>
                    <div class="budynek-akcje" style="text-align: right; min-width: 180px;">
                        <div style="margin-bottom: 8px;">
                            <input type="number" id="ile-${kod}" value="1" min="1" max="${maxMozliwe}" style="width: 60px; padding: 5px; text-align: center; border-radius: 3px; border: 1px solid #ccc;">
                            <span onclick="document.getElementById('ile-${kod}').value = ${maxMozliwe}" style="cursor: pointer; text-decoration: underline; font-size: 0.85em; color: #2980b9; margin-left: 5px; font-weight: bold;">
                                (Max: ${maxMozliwe})
                            </span>
                        </div>
                        <button onclick="window.rekrutujJednostke('${kod}', parseInt(document.getElementById('ile-${kod}').value) || 1)" 
                                style="width: 100%; padding: 7px; background: #27ae60; color: white; border: none; border-radius: 3px; cursor: pointer; font-weight: bold;"
                                ${maxMozliwe === 0 ? 'disabled style="background:#bdc3c7; cursor:not-allowed;"' : ''}>
                            Rekrutuj
                        </button>
                    </div>
                </div>`;
        }
    }
}

export function renderujMape(stan, listaWioch, klikFn) {
    const mapGrid = document.getElementById('map-grid');
    if (!mapGrid) return;
    mapGrid.innerHTML = "";
    const radius = 3;
    const mapaWioch = {};
    listaWioch.forEach(v => mapaWioch[`${v.pos_x}_${v.pos_y}`] = v);

    for (let y = stan.wioska.pos_y - radius; y <= stan.wioska.pos_y + radius; y++) {
        for (let x = stan.wioska.pos_x - radius; x <= stan.wioska.pos_x + radius; x++) {
            const cell = document.createElement('div');
            cell.className = 'map-cell';
            const wioska = mapaWioch[`${x}_${y}`];
            if (x === stan.wioska.pos_x && y === stan.wioska.pos_y) { cell.classList.add('my-village'); cell.textContent = "🏠"; }
            else if (wioska) { cell.classList.add('enemy-village'); cell.textContent = "🏰"; }
            else { cell.classList.add('empty-field'); cell.textContent = "🌲"; }
            cell.addEventListener('click', () => klikFn(x, y, wioska, stan.id));
            mapGrid.appendChild(cell);
        }
    }
}

export function pokazSzczegolyPola(x, y, wioska, stanGraczaId) {
    const detailInfo = document.getElementById('detail-info');
    if (detailInfo) detailInfo.innerHTML = wioska ? `Wioska: ${wioska.name} (${wioska.faction})` : `Dzika głusza (${x}|${y})`;
}