/**
 * Generate 3D heart surface positions using parametric equation.
 */
export function generateHeart(count = 80000) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const brightness = new Float32Array(count);
    const scale = 0.18;

    for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;

        const x = 16 * Math.pow(Math.sin(u), 3);
        const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
        const z = Math.sin(v) * Math.sqrt(Math.abs(x)) * 0.8;

        positions[i * 3] = x * scale + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = y * scale + 2 + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 2] = z * scale + (Math.random() - 0.5) * 0.3;

        // #ff758c → #ff7eb3 gradient based on height
        const t = (y * scale + 4) / 8;
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.46 + t * 0.03;
        colors[i * 3 + 2] = 0.55 + t * 0.15;

        brightness[i] = 0.5 + t * 0.5;
    }

    return { positions, colors, brightness };
}
