/**
 * Render text on hidden canvas and sample pixel positions.
 */
export function textToParticles(text, maxParticles = 80000) {
    const canvas = document.createElement('canvas');
    const size = 512;
    canvas.width = size;
    canvas.height = size / 4;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px "Playfair Display", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const temp = [];

    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            const i = (y * canvas.width + x) * 4;
            if (data[i] > 128) {
                const wx = (x / canvas.width - 0.5) * 40;
                const wy = -(y / canvas.height - 0.5) * 10;
                temp.push(wx, wy, (Math.random() - 0.5) * 2);
            }
        }
    }

    const positions = new Float32Array(maxParticles * 3);
    const available = temp.length / 3;
    for (let i = 0; i < maxParticles; i++) {
        const src = i % Math.max(available, 1);
        positions[i * 3] = temp[src * 3] || (Math.random() - 0.5) * 60;
        positions[i * 3 + 1] = temp[src * 3 + 1] || (Math.random() - 0.5) * 60;
        positions[i * 3 + 2] = temp[src * 3 + 2] || (Math.random() - 0.5) * 60;
    }

    return { positions };
}
