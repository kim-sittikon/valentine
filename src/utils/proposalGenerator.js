/**
 * proposalGenerator.js — High-detail "proposal" silhouette via canvas drawing.
 *
 * Draws a detailed couple (man kneeling + woman standing + bouquet)
 * on a 512×512 canvas, then samples bright pixels into 3D positions.
 * Like imageSampler but self-contained — no external image needed.
 */

function drawProposal(ctx, W, H) {
    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const cx = W * 0.5;
    const ground = H * 0.88;

    // ═══════════════════════════════════════════════════
    // WOMAN — standing right side, facing left
    // Elegant flowing dress, detailed hair
    // ═══════════════════════════════════════════════════
    const wX = cx + W * 0.10;

    ctx.save();

    // ── Hair (short bob style) ──
    ctx.fillStyle = '#ffffff';
    // Main bob shape — rounded, chin-length
    ctx.beginPath();
    ctx.ellipse(wX, ground - H * 0.73, W * 0.048, H * 0.038, 0, 0, Math.PI * 2);
    ctx.fill();
    // Side volume left
    ctx.beginPath();
    ctx.ellipse(wX - W * 0.035, ground - H * 0.71, W * 0.022, H * 0.035, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Side volume right
    ctx.beginPath();
    ctx.ellipse(wX + W * 0.035, ground - H * 0.71, W * 0.022, H * 0.035, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // Bangs (fringe across forehead)
    ctx.beginPath();
    ctx.ellipse(wX, ground - H * 0.755, W * 0.042, H * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Head ──
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(wX, ground - H * 0.72, W * 0.038, 0, Math.PI * 2);
    ctx.fill();

    // ── Neck ──
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(wX - W * 0.012, ground - H * 0.68, W * 0.024, H * 0.025);

    // ── Upper body / torso ──
    ctx.beginPath();
    ctx.moveTo(wX - W * 0.055, ground - H * 0.655);  // left shoulder
    ctx.lineTo(wX + W * 0.05, ground - H * 0.655);   // right shoulder
    ctx.lineTo(wX + W * 0.035, ground - H * 0.52);    // waist right
    ctx.lineTo(wX - W * 0.03, ground - H * 0.52);     // waist left
    ctx.closePath();
    ctx.fill();

    // ── Dress (flowing A-line, elegant) ──
    ctx.beginPath();
    ctx.moveTo(wX - W * 0.03, ground - H * 0.52);     // waist left
    ctx.quadraticCurveTo(wX - W * 0.06, ground - H * 0.35, wX - W * 0.09, ground);  // dress left curve
    ctx.lineTo(wX + W * 0.10, ground);                 // dress hem right
    ctx.quadraticCurveTo(wX + W * 0.06, ground - H * 0.35, wX + W * 0.035, ground - H * 0.52); // dress right curve
    ctx.closePath();
    ctx.fill();

    // Dress fold lines (subtle detail)
    ctx.strokeStyle = 'rgba(200,200,200,0.4)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
        const offsetX = (i - 1.5) * W * 0.022;
        ctx.beginPath();
        ctx.moveTo(wX + offsetX, ground - H * 0.45);
        ctx.quadraticCurveTo(wX + offsetX + W * 0.005, ground - H * 0.25, wX + offsetX + W * 0.01, ground);
        ctx.stroke();
    }
    ctx.strokeStyle = '#ffffff';

    // ── Left arm (hanging relaxed, slightly forward) ──
    ctx.lineWidth = W * 0.022;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(wX - W * 0.055, ground - H * 0.645);
    ctx.quadraticCurveTo(wX - W * 0.075, ground - H * 0.58, wX - W * 0.06, ground - H * 0.50);
    ctx.stroke();

    // ── Right arm (reaching toward bouquet) ──
    ctx.beginPath();
    ctx.moveTo(wX + W * 0.05, ground - H * 0.645);
    ctx.quadraticCurveTo(wX + W * 0.02, ground - H * 0.60, wX - W * 0.03, ground - H * 0.56);
    ctx.quadraticCurveTo(wX - W * 0.06, ground - H * 0.55, wX - W * 0.08, ground - H * 0.54);
    ctx.stroke();

    // Hand detail (small circle)
    ctx.beginPath();
    ctx.arc(wX - W * 0.08, ground - H * 0.54, W * 0.012, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ═══════════════════════════════════════════════════
    // MAN — kneeling left side, facing right
    // On one knee, extending arm with bouquet
    // ═══════════════════════════════════════════════════
    const mX = cx - W * 0.12;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // ── Head ──
    ctx.beginPath();
    ctx.arc(mX + W * 0.02, ground - H * 0.52, W * 0.035, 0, Math.PI * 2);
    ctx.fill();

    // ── Hair (short, slightly messy) ──
    ctx.beginPath();
    ctx.ellipse(mX + W * 0.02, ground - H * 0.545, W * 0.04, H * 0.025, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // Hair tuft
    ctx.beginPath();
    ctx.moveTo(mX + W * 0.04, ground - H * 0.555);
    ctx.quadraticCurveTo(mX + W * 0.06, ground - H * 0.575, mX + W * 0.05, ground - H * 0.59);
    ctx.lineWidth = W * 0.01;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mX + W * 0.02, ground - H * 0.56);
    ctx.quadraticCurveTo(mX + W * 0.03, ground - H * 0.585, mX + W * 0.015, ground - H * 0.59);
    ctx.stroke();

    // ── Neck ──
    ctx.fillRect(mX + W * 0.01, ground - H * 0.485, W * 0.022, H * 0.02);

    // ── Torso (slightly leaning forward) ──
    ctx.lineWidth = W * 0.022;
    ctx.beginPath();
    ctx.moveTo(mX - W * 0.035, ground - H * 0.465);  // left shoulder
    ctx.lineTo(mX + W * 0.055, ground - H * 0.465);  // right shoulder
    ctx.lineTo(mX + W * 0.045, ground - H * 0.30);   // hip right
    ctx.lineTo(mX - W * 0.025, ground - H * 0.30);   // hip left
    ctx.closePath();
    ctx.fill();

    // ── Cape/jacket back ──
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(mX - W * 0.035, ground - H * 0.465);
    ctx.quadraticCurveTo(mX - W * 0.08, ground - H * 0.40, mX - W * 0.10, ground - H * 0.22);
    ctx.quadraticCurveTo(mX - W * 0.09, ground - H * 0.18, mX - W * 0.06, ground - H * 0.20);
    ctx.lineTo(mX - W * 0.025, ground - H * 0.30);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';

    // ── Right arm (extended toward woman, holding bouquet) ──
    ctx.lineWidth = W * 0.02;
    ctx.beginPath();
    ctx.moveTo(mX + W * 0.055, ground - H * 0.455);
    ctx.quadraticCurveTo(mX + W * 0.10, ground - H * 0.48, mX + W * 0.14, ground - H * 0.52);
    ctx.quadraticCurveTo(mX + W * 0.16, ground - H * 0.53, wX - W * 0.10, ground - H * 0.54);
    ctx.stroke();

    // Hand
    ctx.beginPath();
    ctx.arc(wX - W * 0.10, ground - H * 0.54, W * 0.01, 0, Math.PI * 2);
    ctx.fill();

    // ── Left arm (resting on raised knee) ──
    ctx.beginPath();
    ctx.moveTo(mX - W * 0.035, ground - H * 0.455);
    ctx.quadraticCurveTo(mX - W * 0.05, ground - H * 0.40, mX - W * 0.03, ground - H * 0.33);
    ctx.stroke();

    // ── Right leg (front, bent knee up) ──
    ctx.lineWidth = W * 0.025;
    ctx.beginPath();
    ctx.moveTo(mX + W * 0.03, ground - H * 0.30);   // hip
    ctx.lineTo(mX + W * 0.06, ground - H * 0.18);   // knee (up)
    ctx.stroke();
    // Shin
    ctx.beginPath();
    ctx.moveTo(mX + W * 0.06, ground - H * 0.18);
    ctx.lineTo(mX + W * 0.04, ground - H * 0.05);    // foot forward
    ctx.stroke();
    // Boot
    ctx.beginPath();
    ctx.ellipse(mX + W * 0.035, ground - H * 0.04, W * 0.02, H * 0.015, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Left leg (back, knee on ground) ──
    ctx.beginPath();
    ctx.moveTo(mX - W * 0.01, ground - H * 0.30);
    ctx.lineTo(mX - W * 0.05, ground - H * 0.12);    // knee down
    ctx.stroke();
    // Shin back
    ctx.beginPath();
    ctx.moveTo(mX - W * 0.05, ground - H * 0.12);
    ctx.lineTo(mX - W * 0.09, ground - H * 0.04);
    ctx.stroke();
    // Boot
    ctx.beginPath();
    ctx.ellipse(mX - W * 0.095, ground - H * 0.03, W * 0.018, H * 0.013, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // ═══════════════════════════════════════════════════
    // BOUQUET of flowers between them
    // ═══════════════════════════════════════════════════
    const bX = (mX + wX) * 0.5 + W * 0.02;
    const bY = ground - H * 0.55;

    ctx.save();

    // Stems
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = W * 0.006;
    for (let i = 0; i < 5; i++) {
        const angle = ((i - 2) / 4) * 0.6;
        ctx.beginPath();
        ctx.moveTo(bX, bY + H * 0.04);
        ctx.lineTo(bX + Math.sin(angle) * W * 0.04, bY - Math.cos(angle) * H * 0.04);
        ctx.stroke();
    }

    // Flower heads
    ctx.fillStyle = '#ffffff';
    const flowerPositions = [
        [0, -0.045], [-0.025, -0.035], [0.025, -0.035],
        [-0.015, -0.05], [0.015, -0.05], [0, -0.03],
    ];
    for (const [fx, fy] of flowerPositions) {
        const petals = 5;
        const flX = bX + fx * W;
        const flY = bY + fy * H;
        for (let p = 0; p < petals; p++) {
            const a = (p / petals) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(
                flX + Math.cos(a) * W * 0.008,
                flY + Math.sin(a) * W * 0.008,
                W * 0.008, W * 0.005,
                a, 0, Math.PI * 2
            );
            ctx.fill();
        }
        // Center dot
        ctx.beginPath();
        ctx.arc(flX, flY, W * 0.004, 0, Math.PI * 2);
        ctx.fill();
    }

    // Wrapping paper / tissue
    ctx.beginPath();
    ctx.moveTo(bX - W * 0.025, bY + H * 0.03);
    ctx.lineTo(bX - W * 0.04, bY + H * 0.06);
    ctx.lineTo(bX + W * 0.04, bY + H * 0.06);
    ctx.lineTo(bX + W * 0.025, bY + H * 0.03);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // ═══════════════════════════════════════════════════
    // FLOATING HEARTS above
    // ═══════════════════════════════════════════════════
    ctx.fillStyle = '#ffffff';
    drawHeart(ctx, cx - W * 0.05, ground - H * 0.82, W * 0.025);
    drawHeart(ctx, cx + W * 0.08, ground - H * 0.85, W * 0.020);
    drawHeart(ctx, cx + W * 0.02, ground - H * 0.90, W * 0.015);
    drawHeart(ctx, cx - W * 0.10, ground - H * 0.78, W * 0.012);
    drawHeart(ctx, cx + W * 0.14, ground - H * 0.80, W * 0.014);

    // ═══════════════════════════════════════════════════
    // SPARKLE STARS around scene
    // ═══════════════════════════════════════════════════
    const sparkles = [
        [0.15, 0.15], [0.85, 0.20], [0.10, 0.45], [0.90, 0.50],
        [0.20, 0.75], [0.80, 0.70], [0.50, 0.08], [0.35, 0.30],
        [0.65, 0.25], [0.75, 0.85], [0.25, 0.60], [0.55, 0.92],
    ];
    for (const [sx, sy] of sparkles) {
        drawSparkle(ctx, W * sx, H * sy, W * 0.008);
    }
}

function drawHeart(ctx, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.4);
    // Left half
    ctx.bezierCurveTo(x - size, y - size * 0.2, x - size * 0.5, y - size, x, y - size * 0.5);
    // Right half
    ctx.bezierCurveTo(x + size * 0.5, y - size, x + size, y - size * 0.2, x, y + size * 0.4);
    ctx.fill();
    ctx.restore();
}

function drawSparkle(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size * 0.2, y - size * 0.2);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x + size * 0.2, y + size * 0.2);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size * 0.2, y + size * 0.2);
    ctx.lineTo(x - size, y);
    ctx.lineTo(x - size * 0.2, y - size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

/**
 * Generate proposal morph target from canvas silhouette.
 * @param {number} count — total particle count
 * @returns {{ positions: Float32Array }}
 */
export function generateProposal(count = 80000) {
    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    drawProposal(ctx, SIZE, SIZE);

    const imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;

    // ── Sample bright pixels ──
    const samples = [];
    const SPREAD = 35; // world units spread (bigger = larger silhouette on screen)

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const i = (y * SIZE + x) * 4;
            const r = imageData[i] / 255;
            const g = imageData[i + 1] / 255;
            const b = imageData[i + 2] / 255;
            const brightness = r * 0.299 + g * 0.587 + b * 0.114;

            if (brightness > 0.08) {
                samples.push({
                    x: (x / SIZE - 0.5) * SPREAD,
                    y: -(y / SIZE - 0.5) * SPREAD,
                    z: (brightness - 0.5) * 3,
                    brightness,
                });
            }
        }
    }

    // Sort by brightness (brightest morph first)
    samples.sort((a, b) => b.brightness - a.brightness);

    const positions = new Float32Array(count * 3);
    const available = samples.length;

    for (let i = 0; i < count; i++) {
        if (i < available) {
            const s = samples[i];
            positions[i * 3] = s.x + (Math.random() - 0.5) * 0.12;
            positions[i * 3 + 1] = s.y + (Math.random() - 0.5) * 0.12;
            positions[i * 3 + 2] = s.z + (Math.random() - 0.5) * 0.5;
        } else {
            // Excess particles: distribute UNIFORMLY across full area (no ring gap!)
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.sqrt(Math.random()) * 60; // sqrt for uniform disk distribution
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = Math.sin(angle) * radius;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 25;
        }
    }

    console.log(`[Galaxy] 💍 Proposal silhouette: ${available} pixels sampled → ${count} particles`);
    return { positions };
}
