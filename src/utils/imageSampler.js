/**
 * Load an image and sample its bright pixels into 3D particle positions.
 * Returns positions, colors, AND brightness data for delay morph (Section 17A).
 *
 * Pro features:
 *   - Brightness sorting (brightest particles first → smooth reveal)
 *   - Aspect-ratio-aware 3D positioning
 *   - Configurable Z-depth from brightness
 *   - Safety-clamped brightness values
 */
export async function sampleImage(url, sampleSize = 200, maxParticles = 80000) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            const ctx = canvas.getContext('2d');

            // ─── Aspect ratio: contain-fit (letterbox) so face isn't distorted ───
            const aspect = img.width / img.height;
            let drawW, drawH, offsetX, offsetY;

            if (aspect > 1) {
                // Landscape: fit width, letterbox top/bottom
                drawW = sampleSize;
                drawH = sampleSize / aspect;
                offsetX = 0;
                offsetY = (sampleSize - drawH) / 2;
            } else {
                // Portrait: fit height, letterbox left/right
                drawH = sampleSize;
                drawW = sampleSize * aspect;
                offsetX = (sampleSize - drawW) / 2;
                offsetY = 0;
            }

            // Clear to black (letterbox areas won't be sampled)
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, sampleSize, sampleSize);
            ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

            const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

            // ─── 3D spread preserves aspect ratio ───
            const spreadX = aspect >= 1 ? 30 : 30 * aspect;
            const spreadY = aspect >= 1 ? 30 / aspect : 30;

            // ─── Pass 1: Collect bright pixels ───
            const raw = [];
            for (let y = 0; y < sampleSize; y++) {
                for (let x = 0; x < sampleSize; x++) {
                    const i = (y * sampleSize + x) * 4;
                    const r = data[i] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;
                    // Luminance (ITU-R BT.601)
                    const brightness = Math.max(0, Math.min(1, r * 0.299 + g * 0.587 + b * 0.114));

                    if (brightness > 0.08) {
                        const wx = (x / sampleSize - 0.5) * spreadX;
                        const wy = -(y / sampleSize - 0.5) * spreadY;
                        const wz = (brightness - 0.5) * 12; // Z-depth for 3D pop
                        raw.push({ wx, wy, wz, r, g, b, brightness });
                    }
                }
            }

            // ─── Pass 2: Sort by brightness (brightest first → fastest morph) ───
            raw.sort((a, b) => b.brightness - a.brightness);

            // ─── Pass 3: Fill particle buffers ───
            const positions = new Float32Array(maxParticles * 3);
            const colors = new Float32Array(maxParticles * 3);
            const brightness = new Float32Array(maxParticles);
            const available = raw.length;

            for (let i = 0; i < maxParticles; i++) {
                if (i < available) {
                    // Use actual pixel data
                    const src = raw[i];
                    positions[i * 3] = src.wx + (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 1] = src.wy + (Math.random() - 0.5) * 0.1;
                    positions[i * 3 + 2] = src.wz + (Math.random() - 0.5) * 0.3;
                    colors[i * 3] = src.r;
                    colors[i * 3 + 1] = src.g;
                    colors[i * 3 + 2] = src.b;
                    brightness[i] = src.brightness;
                } else {
                    // Excess particles: scatter far away as dim background dust
                    const angle = Math.random() * Math.PI * 2;
                    const radius = 20 + Math.random() * 30; // 20-50 units out
                    positions[i * 3] = Math.cos(angle) * radius;
                    positions[i * 3 + 1] = Math.sin(angle) * radius;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
                    colors[i * 3] = 0.5;
                    colors[i * 3 + 1] = 0.4;
                    colors[i * 3 + 2] = 0.6;
                    brightness[i] = 0.05; // very dim → morphs last (barely visible)
                }
            }

            console.log(`[Galaxy] 📷 Image sampled: ${available.toLocaleString()} bright pixels → ${maxParticles.toLocaleString()} particles (aspect: ${aspect.toFixed(2)})`);
            resolve({ positions, colors, brightness });
        };
        img.src = url;
    });
}
