// Dane konfiguracyjne dla wszystkich budynków w grze
const BALANS_BUDYNKOW = {
    town_hall: { name: "Ratusz", maxLvl: 20, wzrostKosztu: 1.26, woodBaza: 90, stoneBaza: 80, prodBaza: 0, resProd: null, timeBaza: 30 },
    lumberjack: { name: "Tartak", maxLvl: 30, wzrostKosztu: 1.25, woodBaza: 60, stoneBaza: 50, prodBaza: 0.5, resProd: "wood", timeBaza: 15 },
    quarry: { name: "Kamieniołom", maxLvl: 30, wzrostKosztu: 1.27, woodBaza: 75, stoneBaza: 40, prodBaza: 0.4, resProd: "stone", timeBaza: 20 },
    coal_mine: { name: "Kopalnia Węgla", maxLvl: 30, wzrostKosztu: 1.28, woodBaza: 120, stoneBaza: 90, prodBaza: 0.3, resProd: "coal", timeBaza: 35 },
    farm: { name: "Farma", maxLvl: 30, wzrostKosztu: 1.24, woodBaza: 50, stoneBaza: 30, prodBaza: 0.6, resProd: "food", timeBaza: 12 }
};

// Funkcja obliczająca koszt dla dowolnego budynku i poziomu
function obliczKoszt(kodBudynku, obecnyPoziom) {
    const b = BALANS_BUDYNKOW[kodBudynku];
    if (!b) return { wood: 0, stone: 0 };

    let kosztWood = Math.floor(b.woodBaza * Math.pow(b.wzrostKosztu, obecnyPoziom));
    let kosztStone = Math.floor(b.stoneBaza * Math.pow(b.wzrostKosztu, obecnyPoziom));

    return { wood: kosztWood, stone: kosztStone };
}

// Funkcja obliczająca czas budowy w sekundach z uwzględnieniem poziomu Ratusza
function obliczCzasBudowy(kodBudynku, obecnyPoziom, poziomRatusza) {
    const b = BALANS_BUDYNKOW[kodBudynku];
    if (!b) return 0;

    let czasPodstawowy = b.timeBaza * Math.pow(1.2, obecnyPoziom);
    let czynnikRatusza = poziomRatusza * 0.1 + 0.9;
    let ostatecznyCzas = Math.floor(czasPodstawowy / czynnikRatusza);

    return ostatecznyCzas < 1 ? 1 : ostatecznyCzas;
}