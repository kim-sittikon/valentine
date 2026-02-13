/**
 * Load an image and sample its bright pixels into 3D particle positions.
 * Returns positions, colors, AND brightness data for delay morph (Section 17A).
 */
export async function sampleImage(url, sampleSize = 200, maxParticles = 80000) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            const ctx = canvas.getContext('2d');

            const scale = Math.max(sampleSize / img.width, sampleSize / img.height);
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, (sampleSize - w) / 2, (sampleSize - h) / 2, w, h);

            const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
            const tempPositions = [];
            const tempColors = [];
            const tempBrightness = [];

            for (let y = 0; y < sampleSize; y++) {
                for (let x = 0; x < sampleSize; x++) {
                    const i = (y * sampleSize + x) * 4;
                    const r = data[i] / 255;
                    const g = data[i + 1] / 255;
                    const b = data[i + 2] / 255;
                    const brightness = r * 0.299 + g * 0.587 + b * 0.114;

                    if (brightness > 0.1) {
                        const wx = (x / sampleSize - 0.5) * 30;
                        const wy = -(y / sampleSize - 0.5) * 30;
                        const wz = (brightness - 0.5) * 5;

                        tempPositions.push(wx, wy, wz);
                        tempColors.push(r, g, b);
                        tempBrightness.push(brightness);
                    }
                }
            }

            const positions = new Float32Array(maxParticles * 3);
            const colors = new Float32Array(maxParticles * 3);
            const brightness = new Float32Array(maxParticles);
            const available = tempPositions.length / 3;

            for (let i = 0; i < maxParticles; i++) {
                const src = i % Math.max(available, 1);
                positions[i * 3] = (tempPositions[src * 3] || 0) + (Math.random() - 0.5) * 0.1;
                positions[i * 3 + 1] = (tempPositions[src * 3 + 1] || 0) + (Math.random() - 0.5) * 0.1;
                positions[i * 3 + 2] = (tempPositions[src * 3 + 2] || 0) + (Math.random() - 0.5) * 0.5;
                colors[i * 3] = tempColors[src * 3] || 1;
                colors[i * 3 + 1] = tempColors[src * 3 + 1] || 1;
                colors[i * 3 + 2] = tempColors[src * 3 + 2] || 1;
                brightness[i] = tempBrightness[src] || 0.5;
            }

            resolve({ positions, colors, brightness });
        };
        img.src = url;
    });
}
