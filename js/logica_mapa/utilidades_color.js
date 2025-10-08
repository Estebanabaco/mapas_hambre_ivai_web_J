const lerp = (a, b, t) => a + (b - a) * t;

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
};

const rgbToHex = (r, g, b) => "#" + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).padStart(6, '0');

export function createColorPalette(values, isPercentage = false) {
    const domain = values.filter(v => v !== null && !isNaN(v));
    if (domain.length === 0) return () => '#d9d9d9';

    const min = Math.min(...domain);
    const max = Math.max(...domain);

    const colorStrings = ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
    const colorRGBs = colorStrings.map(hexToRgb);
    const numColors = colorRGBs.length;

    return (value) => {
        if (value === null || isNaN(value)) return '#d9d9d9';

        const clampedValue = Math.max(min, Math.min(value, max));
        const t = (max - min) > 0 ? (clampedValue - min) / (max - min) : 0;

        const colorIndex = t * (numColors - 1);
        const i = Math.floor(colorIndex);
        const j = Math.min(i + 1, numColors - 1);
        const localT = colorIndex - i;

        const r = lerp(colorRGBs[i][0], colorRGBs[j][0], localT);
        const g = lerp(colorRGBs[i][1], colorRGBs[j][1], localT);
        const b = lerp(colorRGBs[i][2], colorRGBs[j][2], localT);

        return rgbToHex(r, g, b);
    };
}
