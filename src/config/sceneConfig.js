/**
 * sceneConfig.js — Single Source of Truth for all scene parameters.
 *
 * Every system reads from here:
 *   useUniverse  → ranges, energy
 *   CameraRig    → camera z / breathing / shake / clamp
 *   PostFX       → bloom / dof / ca / grain
 *   Overlay      → titles
 *   Particles    → energy level
 *   ScrollTimeline → easing curves
 */

export const SCENES = [
    {
        name: 'void',
        range: [0, 0.10],
        camera: { z: 100, breathing: 0.3, shake: 0, orbitSpeed: 0, minZ: 90, maxZ: 110 },
        bloom: 0.2,
        postfx: { dof: false, ca: 0, grain: 0.04 },
        energy: 0.2,
        emotion: 'calm',
        title: '',
        easing: 'power2.inOut',
        event: 'silence',
    },
    {
        name: 'birth',
        range: [0.10, 0.20],
        camera: { z: 60, breathing: 0.5, shake: 0, orbitSpeed: 0, minZ: 50, maxZ: 110 },
        bloom: 0.3,
        postfx: { dof: false, ca: 0, grain: 0.03 },
        energy: 0.4,
        emotion: 'wonder',
        title: '✦ เมื่อจักรวาลเริ่มต้น...',
        easing: 'power3.inOut',
        event: 'particles_fadein',
    },
    {
        name: 'memory',
        range: [0.20, 0.45],
        camera: { z: 40, breathing: 0.4, shake: 0, orbitSpeed: 0.05, minZ: 30, maxZ: 70 },
        bloom: 0.5,
        postfx: { dof: false, ca: 0, grain: 0.03 },
        energy: 0.6,
        emotion: 'warm',
        title: '💫 ทุกอนุภาค คือความทรงจำ',
        easing: 'power2.inOut',
        event: 'morph_to_image',
    },
    {
        name: 'chaos',
        range: [0.45, 0.55],
        camera: { z: 40, breathing: 0.2, shake: 0.8, orbitSpeed: 0, minZ: 30, maxZ: 50 },
        bloom: 0.8,
        postfx: { dof: false, ca: 0.005, grain: 0.06 },
        energy: 1.0,
        emotion: 'intense',
        title: '🌪 แตกสลาย... เพื่อสร้างใหม่',
        easing: 'power4.in',
        event: 'mouse_interaction',
    },
    {
        name: 'gravity',
        range: [0.55, 0.75],
        camera: { z: 5, breathing: 0.15, shake: 0.1, orbitSpeed: 0, minZ: 3, maxZ: 45 },
        bloom: 1.5,
        postfx: { dof: false, ca: 0.01, grain: 0.05 },
        energy: 0.3,
        emotion: 'suspense',
        title: '🚀 แรงดึงดูดที่ไม่อาจหยุด',
        easing: 'power3.in',
        event: 'warp_stretch',
    },
    {
        name: 'love',
        range: [0.75, 1.0],
        camera: { z: 30, breathing: 0.6, shake: 0, orbitSpeed: 0.15, minZ: 20, maxZ: 40 },
        bloom: 0.8,
        postfx: { dof: true, ca: 0, grain: 0.02 },
        energy: 0.5,
        emotion: 'intimate',
        title: '💖 Galaxy of You',
        easing: 'power2.out',
        event: 'heart_morph',
    },
];

// ─── Hysteresis threshold (prevents scene boundary flicker) ───
const HYSTERESIS = 0.015; // 1.5%

/**
 * Get scene from scroll progress with hysteresis guard.
 * Stays on current scene until progress clearly enters another scene's range.
 * @param {number} progress — global scroll progress 0→1
 * @param {string} prevScene — name of the previously active scene
 * @returns {{ scene: object, index: number }}
 */
export function getSceneFromProgress(progress, prevScene) {
    // Clamp progress
    const p = Math.max(0, Math.min(1, progress));

    // Find the previous scene config for hysteresis
    const prevConfig = SCENES.find((s) => s.name === prevScene);
    if (prevConfig) {
        const [start, end] = prevConfig.range;
        // Stay on current scene if within hysteresis band
        if (p >= start - HYSTERESIS && p <= end + HYSTERESIS) {
            const idx = SCENES.indexOf(prevConfig);
            return { scene: prevConfig, index: idx };
        }
    }

    // Find new scene by exact range match
    for (let i = SCENES.length - 1; i >= 0; i--) {
        if (p >= SCENES[i].range[0]) {
            return { scene: SCENES[i], index: i };
        }
    }

    return { scene: SCENES[0], index: 0 };
}

/**
 * Get local progress (0→1) within a scene's range.
 * @param {number} progress — global scroll progress 0→1
 * @param {object} sceneConfig — scene config object with .range
 * @returns {number} localProgress 0→1
 */
export function getLocalProgress(progress, sceneConfig) {
    const [start, end] = sceneConfig.range;
    const span = end - start;
    if (span <= 0) return 0;
    return Math.max(0, Math.min(1, (progress - start) / span));
}

/**
 * Get scene config by name.
 * @param {string} name
 * @returns {object|undefined}
 */
export function getSceneByName(name) {
    return SCENES.find((s) => s.name === name);
}

/**
 * Interpolate between two scene configs based on blend factor.
 * Useful for smooth transitions (camera, bloom, etc.)
 * @param {object} from — source scene config
 * @param {object} to — target scene config
 * @param {number} t — blend factor 0→1
 * @returns {{ cameraZ: number, bloom: number, energy: number, grain: number }}
 */
export function lerpSceneValues(from, to, t) {
    const lerp = (a, b, f) => a + (b - a) * f;
    return {
        cameraZ: lerp(from.camera.z, to.camera.z, t),
        bloom: lerp(from.bloom, to.bloom, t),
        energy: lerp(from.energy, to.energy, t),
        grain: lerp(from.postfx.grain, to.postfx.grain, t),
        breathing: lerp(from.camera.breathing, to.camera.breathing, t),
        shake: lerp(from.camera.shake, to.camera.shake, t),
        ca: lerp(from.postfx.ca, to.postfx.ca, t),
    };
}
