import { BALANS_BUDYNKOW, BUDYNKI_FRAKCYJNE } from './config.js';
import { obliczKoszt, obliczCzasBudowy } from './engine.js';

export function aktualizujInterfejs(stan) {
    if (!stan.wioska) return;
    document.getElementById("nazwa-wioski").innerText = stan.wioska.name;
    document.getElementById("wioska-x").innerText = stan.wioska.pos_x;
    document.getElementById("wioska-y").innerText = stan.wioska.pos_y;
    document.getElementById("wioska-frakcja").innerText = stan.wioska.faction || "Nieznana";

    document.getElementById("res-wood").innerText = Math.floor(stan.surowce.wood || 0);
    document.getElementById("res-stone").innerText = Math.floor(stan.surowce.stone || 0);
    document.getElementById("res-coal").innerText = Math.floor(stan.surowce.coal || 0);
    document.getElementById("res-food").innerText = Math.floor(stan.surowce.food || 0);
    document.getElementById("res-gold").innerText = Math.floor(stan.surowce.gold || 0);
    document.getElementById("res-population").innerText = Math.floor(stan.surowce.population || 0);
    document.getElementById("res-knowledge").innerText = Math.floor(stan.surowce.knowledge || 0);
    document.getElementById("res-essence").innerText = Math.floor(stan.surowce.essence || 0);

    const frakcja = stan.wioska.faction;
    const wszystkieFrakcje = ['ludzie', 'krasnoludy', 'nieumarli', 'elfy', 'orkowie', 'demony'];
    wszystkieFrakcje.forEach(f => {
        const blok = document.getElementById(`frakcja-${f}`);
        if (blok) blok.style.display = (f === frakcja) ? 'flex' : 'none';
    });

    const kontener = document.getElementById("kontener-budynkow");
    if (!kontener) return;
    kontener.innerHTML = "";
    const poziomRatusza = stan.budynki.town_hall || 1;
    const wszystkieUnikalne = Object.values(BUDYNKI_FRAKCYJNE).flat();

    for (const [kod, config] of Object.entries(BALANS_BUDYNKOW)) {
        if (wszystkieUnikalne.includes(kod) && !BUDYNKI_FRAKCYJNE[frakcja]?.includes(kod)) continue;
        const lvl = stan.budynki[kod] || 0;
        const koszt = obliczKoszt(kod, lvl);
        const czas = obliczCzasBudowy(kod, lvl, poziomRatusza);
        const budowa = stan.kolejka.find(q => q.building_type === kod);

        let czasTekst = czas >= 60 ? `${Math.floor(czas / 60)}m ${czas % 60}s` : `${czas}s`;
        let przycisk = budowa
            ? `<button disabled>Budowa: ${Math.max(0, Math.floor((new Date(budowa.finish_time) - new Date()) / 1000))}s</button>`
            : `<button onclick="window.rozbudujBudynek('${kod}')">Rozbuduj</button>`;

        kontener.innerHTML += `
            <div class="budynek-wiersz">
                <div><strong>${config.name}</strong> (lvl ${lvl}) ${przycisk}</div>
                <div style="font-size: 0.8em;">Koszt: 🪵${koszt.wood} 🪨${koszt.stone} | Czas: ${czasTekst}</div>
            </div>`;
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
            if (x === stan.wioska.pos_x && y === stan.wioska.pos_y) cell.textContent = "🏠";
            else if (wioska) cell.textContent = "🏰";
            else cell.textContent = "🌲";
            cell.addEventListener('click', () => klikFn(x, y, wioska, stan.id));
            mapGrid.appendChild(cell);
        }
    }
}

export function pokazSzczegolyPola(x, y, wioska, stanGraczaId) {
    const detailInfo = document.getElementById('detail-info');
    if (detailInfo) {
        detailInfo.innerHTML = wioska ? `Wioska: ${wioska.name} (${wioska.faction})` : `Dzika głusza (${x}|${y})`;
    }
}