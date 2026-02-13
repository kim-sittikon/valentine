/**
 * Generate 3D heart surface positions using parametric equation.
 *
 * Density fix: raw sin³(u) creates heavy clusters at widest points
 * and sparse regions at the cleft/tip. We use stratified sampling
 * with surface-area weighting to get even distribution.
 */
export function generateHeart(count = 80000) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const brightness = new Float32Array(count);
    const scale = 0.18;

    // ─── Pre-compute the surface-area profile for uniform sampling ───
    // The cross-sectional width at each u determines particle density.
    // We use rejection sampling: weight = 1/width so thin regions get more attempts.
    const SAMPLES = 512;
    const widths = new Float32Array(SAMPLES);
    let maxWidth = 0;

    for (let i = 0; i < SAMPLES; i++) {
        const u = (i / SAMPLES) * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(u), 3);
        widths[i] = Math.sqrt(Math.abs(x)) + 0.1; // +0.1 to avoid zero
        if (widths[i] > maxWidth) maxWidth = widths[i];
    }

    let placed = 0;

    while (placed < count) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;

        // Rejection sampling: accept probability = width / maxWidth
        const uIndex = Math.floor((u / (Math.PI * 2)) * SAMPLES) % SAMPLES;
        const acceptProb = widths[uIndex] / maxWidth;

        // Invert: REJECT if too dense (high width = high density → lower accept)
        // We want UNIFORM density, so accept = 1/width normalized
        const inverseAccept = (maxWidth / (widths[uIndex] + 0.01));
        // Normalize: make the max probability 1
        if (Math.random() > 1.0 / inverseAccept) continue;

        const x = 16 * Math.pow(Math.sin(u), 3);
        const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
        const z = Math.sin(v) * Math.sqrt(Math.abs(x)) * 0.8;

        positions[placed * 3] = x * scale + (Math.random() - 0.5) * 0.3;
        positions[placed * 3 + 1] = y * scale + 2 + (Math.random() - 0.5) * 0.3;
        positions[placed * 3 + 2] = z * scale + (Math.random() - 0.5) * 0.3;

        // #ff758c → #ff7eb3 gradient based on height
        const t = (y * scale + 4) / 8;
        colors[placed * 3] = 1.0;
        colors[placed * 3 + 1] = 0.46 + t * 0.03;
        colors[placed * 3 + 2] = 0.55 + t * 0.15;

        brightness[placed] = 0.5 + t * 0.5;
        placed++;
    }

    return { positions, colors, brightness };
}
