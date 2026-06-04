import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = "https://avofpueaxoxsfefsuskn.supabase.co";
export const SUPABASE_KEY = "sb_publishable_PMPJWyxglYFIHVkcRqBKYQ_s-k9CmVl";

export const spClient = createClient(SUPABASE_URL, SUPABASE_KEY);

export const BUDYNKI_FRAKCYJNE = {
    ludzie: ['iron_mine', 'silver_shaft', 'cathedral'],
    krasnoludy: ['deep_shaft', 'rune_forge', 'brewery'],
    nieumarli: ['graveyard', 'blood_fountain', 'ice_spire'],
    elfy: ['sacred_grove', 'crystal_cave', 'observatory'],
    orkowie: ['bone_pit', 'tannery', 'beast_cages'],
    demony: ['sulfur_fissure', 'volcanic_crater', 'chaos_altar']
};

export const BALANS_BUDYNKOW = {
    // --- GŁÓWNE ---
    town_hall: { name: "Ratusz", maxLvl: 20, wzrostKosztu: 1.26, woodBaza: 90, stoneBaza: 80, prodBaza: 0, resProd: null, timeBaza: 30, kategoria: "Główne" },
    houses: { name: "Domostwa", maxLvl: 30, wzrostKosztu: 1.22, woodBaza: 40, stoneBaza: 25, prodBaza: 1, resProd: "population", timeBaza: 10, kategoria: "Główne" },

    // --- SUROWCE ---
    lumberjack: { name: "Tartak", maxLvl: 30, wzrostKosztu: 1.25, woodBaza: 60, stoneBaza: 50, prodBaza: 5, resProd: "wood", timeBaza: 15, kategoria: "Surowce" },
    quarry: { name: "Kamieniołom", maxLvl: 30, wzrostKosztu: 1.27, woodBaza: 75, stoneBaza: 40, prodBaza: 4, resProd: "stone", timeBaza: 20, kategoria: "Surowce" },
    coal_mine: { name: "Smolarnia", maxLvl: 30, wzrostKosztu: 1.28, woodBaza: 120, stoneBaza: 90, prodBaza: 3, resProd: "coal", timeBaza: 35, kategoria: "Surowce" },
    farm: { name: "Farma", maxLvl: 30, wzrostKosztu: 1.24, woodBaza: 50, stoneBaza: 30, prodBaza: 6, resProd: "food", timeBaza: 12, kategoria: "Surowce" },
    mint: { name: "Mennica", maxLvl: 20, wzrostKosztu: 1.32, woodBaza: 200, stoneBaza: 180, prodBaza: 2, resProd: "gold", timeBaza: 45, kategoria: "Surowce" },

    // --- SPECJALNE (Nauka, Magia, Frakcyjne) ---
    academy: { name: "Akademia", maxLvl: 20, wzrostKosztu: 1.35, woodBaza: 250, stoneBaza: 300, prodBaza: 1, resProd: "knowledge", timeBaza: 60, kategoria: "Specjalne" },
    essence_altar: { name: "Ołtarz Esencji", maxLvl: 20, wzrostKosztu: 1.34, woodBaza: 180, stoneBaza: 220, prodBaza: 1, resProd: "essence", timeBaza: 50, kategoria: "Specjalne" },
    iron_mine: { name: "Kopalnia Żelaza", maxLvl: 25, wzrostKosztu: 1.29, woodBaza: 130, stoneBaza: 110, prodBaza: 2, resProd: "iron", timeBaza: 40, kategoria: "Specjalne" },
    silver_shaft: { name: "Srebrny Szyb", maxLvl: 20, wzrostKosztu: 1.33, woodBaza: 220, stoneBaza: 250, prodBaza: 2, resProd: "silver", timeBaza: 55, kategoria: "Specjalne" },
    cathedral: { name: "Katedra", maxLvl: 10, wzrostKosztu: 1.45, woodBaza: 500, stoneBaza: 600, prodBaza: 1, resProd: "relics", timeBaza: 120, kategoria: "Specjalne" },
    deep_shaft: { name: "Głęboki Szyb", maxLvl: 25, wzrostKosztu: 1.30, woodBaza: 140, stoneBaza: 120, prodBaza: 2, resProd: "mithril", timeBaza: 42, kategoria: "Specjalne" },
    rune_forge: { name: "Kuźnia Run", maxLvl: 20, wzrostKosztu: 1.34, woodBaza: 200, stoneBaza: 280, prodBaza: 2, resProd: "runestones", timeBaza: 58, kategoria: "Specjalne" },
    brewery: { name: "Browar Głębinowy", maxLvl: 15, wzrostKosztu: 1.38, woodBaza: 300, stoneBaza: 200, prodBaza: 1, resProd: "ale", timeBaza: 70, kategoria: "Specjalne" },
    graveyard: { name: "Cmentarzysko", maxLvl: 25, wzrostKosztu: 1.26, woodBaza: 80, stoneBaza: 60, prodBaza: 3, resProd: "corpses", timeBaza: 25, kategoria: "Specjalne" },
    blood_fountain: { name: "Fontanna Krwi", maxLvl: 20, wzrostKosztu: 1.32, woodBaza: 190, stoneBaza: 190, prodBaza: 2, resProd: "blood", timeBaza: 48, kategoria: "Specjalne" },
    ice_spire: { name: "Lodowa Iglica", maxLvl: 10, wzrostKosztu: 1.48, woodBaza: 450, stoneBaza: 650, prodBaza: 1, resProd: "black_frost", timeBaza: 130, kategoria: "Specjalne" },
    sacred_grove: { name: "Święty Gaj", maxLvl: 25, wzrostKosztu: 1.28, woodBaza: 110, stoneBaza: 90, prodBaza: 3, resProd: "elderwood", timeBaza: 32, kategoria: "Specjalne" },
    crystal_cave: { name: "Kryształowa Jaskinia", maxLvl: 20, wzrostKosztu: 1.35, woodBaza: 150, stoneBaza: 300, prodBaza: 1, resProd: "crystals", timeBaza: 65, kategoria: "Specjalne" },
    observatory: { name: "Obserwatorium", maxLvl: 15, wzrostKosztu: 1.40, woodBaza: 350, stoneBaza: 350, prodBaza: 1, resProd: "stardust", timeBaza: 85, kategoria: "Specjalne" },
    bone_pit: { name: "Dół na Kości", maxLvl: 25, wzrostKosztu: 1.25, woodBaza: 70, stoneBaza: 50, prodBaza: 4, resProd: "bones", timeBaza: 22, kategoria: "Specjalne" },
    tannery: { name: "Garbarnia", maxLvl: 20, wzrostKosztu: 1.30, woodBaza: 160, stoneBaza: 120, prodBaza: 2, resProd: "hides", timeBaza: 40, kategoria: "Specjalne" },
    beast_cages: { name: "Klatki Bestii", maxLvl: 15, wzrostKosztu: 1.42, woodBaza: 400, stoneBaza: 250, prodBaza: 1, resProd: "tusks", timeBaza: 90, kategoria: "Specjalne" },
    sulfur_fissure: { name: "Siarkowa Szczelina", maxLvl: 25, wzrostKosztu: 1.29, woodBaza: 120, stoneBaza: 130, prodBaza: 2, resProd: "sulfur", timeBaza: 38, kategoria: "Specjalne" },
    volcanic_crater: { name: "Wulkaniczny Krater", maxLvl: 20, wzrostKosztu: 1.36, woodBaza: 250, stoneBaza: 350, prodBaza: 1, resProd: "obsidian", timeBaza: 75, kategoria: "Specjalne" },
    chaos_altar: { name: "Ołtarz Zniszczenia", maxLvl: 10, wzrostKosztu: 1.50, woodBaza: 600, stoneBaza: 600, prodBaza: 1, resProd: "chaos_flame", timeBaza: 150, kategoria: "Specjalne" }
};