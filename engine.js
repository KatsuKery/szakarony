// engine.js
import { BALANS_BUDYNKOW } from './config.js';

export function obliczKoszt(kodBudynku, obecnyPoziom) {
    const b = BALANS_BUDYNKOW[kodBudynku];
    if (!b) return { wood: 0, stone: 0 };
    return {
        wood: Math.floor(b.woodBaza * Math.pow(b.wzrostKosztu, obecnyPoziom)),
        stone: Math.floor(b.stoneBaza * Math.pow(b.wzrostKosztu, obecnyPoziom))
    };
}

export function obliczCzasBudowy(kodBudynku, obecnyPoziom, poziomRatusza) {
    const b = BALANS_BUDYNKOW[kodBudynku];
    if (!b) return 0;
    let czasPodstawowy = b.timeBaza * Math.pow(1.2, obecnyPoziom);
    let czynnikRatusza = poziomRatusza * 0.1 + 0.9;
    return Math.max(1, Math.floor(czasPodstawowy / czynnikRatusza));
}