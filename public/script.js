
// public/script.js – Collecte maximale (avec consentement explicite uniquement)

// Toutes les données sont envoyées au backend en JSON brut.

// Aucun stockage local, aucune fingerprinting cachée. Usage pédagogique uniquement.
const collectBtn = document.getElementById("collect-btn");
const outputPre = document.getElementById("output-pre");
function log(msg) {
    outputPre.textContent += msg + "\n";
}

// UTILITAIRES
async function safeFetch(url) {
    try {
        const r = await fetch(url, { cache: "no-store" });
        return await r.json();
    } catch {
        return null;
    }
}

// IP PUBLIQUE
async function getPublicIP() {
    try {
        const r = await fetch("https//api64.ipify.org?format=json", { cache: "no-store" });
        return await r.json();
    } catch {
        return { ip: null };
    }
}

// SPEEDTEST BASIC
async function measureDownloadSpeed() {
    const testUrl = "https://eu.httpbin.org/stream-bytes/20000?seed=0";
    try {
        const start = performance.now();
        const resp = await fetch(testUrl, { cache: "no-store" });
        const reader = resp.body.getReader();
        let received = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            received += value.length;
        }
        const duration = (performance.now() - start) / 1000;
        const kbps = (received * 8) / duration / 1000;
        return { kbps: Math.round(kbps), bytes: received, duration_s: Number(duration.toFixed(2)) };
    } catch {
        return null;
    }
}

// BATTERIE
async function getBattery() {
    if (!navigator.getBattery) return null;
    try {
        const b = await navigator.getBattery();
        return {
            charging: b.charging,
            level: b.level,
            chargingTime: b.chargingTime,
            dischargingTime: b.dischargingTime
        };
    } catch {
        return null;
    }
}

// PERMISSIONS
async function getPermissions(names = [
    "geolocation", "notifications", "camera", "microphone",
    "persistent-storage", "clipboard-read", "clipboard-write"
]) {
    if (!navigator.permissions) return null;
    const out = {};
    for (const name of names) {
        try {
            const p = await navigator.permissions.query({ name });
            out[name] = p.state;
        } catch {
            out[name] = "unknown";
        }
    }
    return out;
}

// DEVICES
async function enumerateMediaDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) return null;
    try {
        const devs = await navigator.mediaDevices.enumerateDevices();
        return devs.map(d => ({
            kind: d.kind,
            label: d.label || "(masqué)",
            deviceId: d.deviceId,
            groupId: d.groupId
        }));
    } catch {
        return null;
    }
}

// SENSORS
function detectSensors() {
    return {
        deviceOrientation: typeof DeviceOrientationEvent !== "undefined",
        deviceMotion: typeof DeviceMotionEvent !== "undefined",
        ambientLight: typeof AmbientLightSensor !== "undefined",
        genericSensors: typeof Sensor !== "undefined"
    };
}

// SYSTEM INFO
function getSystemInfo() {
    const hints = navigator.userAgentData || null;
    return {
        userAgent: navigator.userAgent,
        appVersion: navigator.appVersion,
        vendor: navigator.vendor,
        platform: navigator.platform,
        languages: navigator.languages,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
            width: screen.width,
            height: screen.height,
            availWidth: screen.availWidth,
            availHeight: screen.availHeight,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
            orientation: screen.orientation ? screen.orientation.type : null
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            zoomLevel: window.innerWidth / document.documentElement.clientWidth
        },
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        jsEnabled: true,
        
// User-Agent Client Hints
        uaHints: hints ? {
            platform: hints.platform,
            platformVersion: hints.platformVersion,
            architecture: hints.architecture,
            model: hints.model,
            mobile: hints.mobile,
            brands: hints.brands
        } : null
    };
}

// PERFORMANCE / NAVIGATION TIMING
function getPerformanceInfo() {
    return {
        now: performance.now(),
        timeOrigin: performance.timeOrigin,
        memory: performance.memory || null,
        navigationEntries: performance.getEntriesByType("navigation"),
        paintEntries: performance.getEntriesByType("paint"),
        resourceEntries: performance.getEntriesByType("resource")
    };
}

// STORAGE
async function getStorageInfo() {
    let estimate = null;
    if (navigator.storage?.estimate) {
        estimate = await navigator.storage.estimate();
    }
    return {
        localStorageKeys: Object.keys(localStorage),
        sessionStorageKeys: Object.keys(sessionStorage),
        indexedDBSupport: !!window.indexedDB,
        estimate
    };
}

// NETWORK INFO AVANCEE
function getNetworkInfo() {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
        online: navigator.onLine,
        type: c?.type || null,
        effectiveType: c?.effectiveType || null,
        rtt: c?.rtt || null,
        downlink: c?.downlink || null,
        downlinkMax: c?.downlinkMax || null,
        saveData: c?.saveData || null,
        navigationPreload: navigator.serviceWorker?.controller?.state || null
    };
}

// WEBGL GPU INFO
function getWebGLInfo() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return null;
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        return {
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null,
            shadingLanguage: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            version: gl.getParameter(gl.VERSION),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
            aliasedLineWidthRange: gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)
        };
    } catch {
        return null;
    }
}

// WEBGPU INFO
async function getWebGPUInfo() {
    if (!navigator.gpu) return null;
    try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return null;
        return {
            name: adapter.name,
            features: [...adapter.features],
            limits: adapter.limits
        };
    } catch {
        return null;
    }
}

// AUDIO CONTEXT INFO
function getAudioInfo() {
    try {
        const audio = new (window.AudioContext || window.webkitAudioContext)();
        return {
            sampleRate: audio.sampleRate,
            outputLatency: audio.outputLatency || null,
            state: audio.state,
            channels: audio.destination.maxChannelCount
        };
    } catch {
        return null;
    }
}

// PAGE VISIBILITY
function getPageState() {
    return {
        visible: document.visibilityState,
        hasFocus: document.hasFocus()
    };
}

// GEOLOCATION
async function getGeolocation() {
    if (!navigator.geolocation) return null;
    return new Promise(resolve => {
        navigator.geolocation.getCurrentPosition(position => {
            resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy_m: position.coords.accuracy,
                altitude: position.coords.altitude,
                heading: position.coords.heading,
                speed: position.coords.speed,
                timestamp: new Date(position.timestamp).toISOString()
            });
        }, err => {
            resolve({
                error: true,
                message: err.message,
                code: err.code
            });
        }, { enableHighAccuracy: true, timeout: 10000 });
    });
}

// COLLECTE GLOBALE
async function collectAll() {
    outputPre.textContent = "Recheche des lieux/évènements à proximités ... \n";
    const data = {};
    data.system = getSystemInfo();
    data.performance = getPerformanceInfo();
    data.storage = await getStorageInfo();
    data.network = getNetworkInfo();
    data.permissions = await getPermissions();
    data.sensors = detectSensors();
    data.mediaDevices = await enumerateMediaDevices();
    data.battery = await getBattery();
    data.publicIP = await getPublicIP();
    data.speedTest = await measureDownloadSpeed();
    data.geoloc = await getGeolocation();
    data.webgl = getWebGLInfo();
    data.webgpu = await getWebGPUInfo();
    data.audio = getAudioInfo();
    data.page = getPageState();
    
// Envoi serveur → donnee.json
    try {
    const resp = await fetch("/api/saveData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });
    const j = await resp.json();
    if (j.success) {
        outputPre.textContent += "\n\n{ERREUR TYPE 1}\n\nLa sauvegarde n’a pas pu être effectuée correctement.\nVeuillez réessayer dans quelques instants.\n\n";
    } else {
        outputPre.textContent += "\n\n{ERREUR TYPE 2}\n\nUne erreur est survenue lors du traitement de vos données.\nNos équipes travaillent à résoudre le problème.\nMerci de votre patience.\n\n";
    }
} catch (err) {
    outputPre.textContent += "\n\n{ERREUR TYPE 3}\n\nImpossible de communiquer avec le serveur.\nVérifiez votre connexion internet ou réessayez plus tard.\n\nDétails techniques : " + err.message;
}

}
collectBtn.addEventListener("click", collectAll);