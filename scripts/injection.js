(() => {
    const _fp = _FP_;
    const _def = (obj, prop, val) => {
        try { Object.defineProperty(obj, prop, { get: () => val, configurable: true }); } catch (e) { }
    };

    _def(navigator, 'webdriver', undefined);

    const chromeObj = {
        runtime: {
            OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install', SHARED_MODULE_UPDATE: 'shared_module_update', UPDATE: 'update' },
            OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
            PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
            PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
            PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
            RequestUpdateCheckStatus: { NO_UPDATE: 'no_update', THROTTLED: 'throttled', UPDATE_AVAILABLE: 'update_available' },
            connect: () => ({ onMessage: { addListener: () => { } }, postMessage: () => { }, disconnect: () => { } }),
            sendMessage: () => { },
            id: undefined
        },
        loadTimes: function () {
            const t = performance.timing;
            return {
                commitLoadTime: t.responseStart / 1000,
                connectionInfo: 'h2',
                finishDocumentLoadTime: t.domContentLoadedEventEnd / 1000,
                finishLoadTime: t.loadEventEnd / 1000,
                firstPaintAfterLoadTime: 0,
                firstPaintTime: t.responseEnd / 1000,
                navigationType: 'Other',
                npnNegotiatedProtocol: 'h2',
                requestTime: t.navigationStart / 1000,
                startLoadTime: t.navigationStart / 1000,
                wasAlternateProtocolAvailable: false,
                wasFetchedViaSpdy: true,
                wasNpnNegotiated: true
            };
        },
        csi: function () {
            return {
                onloadT: Date.now(),
                pageT: Date.now() - performance.timing.navigationStart,
                startE: performance.timing.navigationStart,
                tran: 15
            };
        },
        app: {
            isInstalled: false,
            InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
            RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        }
    };
    try { Object.defineProperty(window, 'chrome', { value: chromeObj, writable: true, configurable: true }); } catch (e) { }

    const makeMime = (type, plugin) => {
        const m = Object.create(MimeType.prototype);
        Object.defineProperties(m, {
            type: { value: type, enumerable: true },
            suffixes: { value: 'pdf', enumerable: true },
            description: { value: 'Portable Document Format', enumerable: true },
            enabledPlugin: { value: plugin, enumerable: true }
        });
        return m;
    };
    const plugins = _fp.Plugins.map(name => {
        const p = Object.create(Plugin.prototype);
        const m1 = makeMime('application/pdf', p);
        const m2 = makeMime('text/pdf', p);
        Object.defineProperties(p, {
            name: { value: name, enumerable: true },
            filename: { value: 'internal-pdf-viewer', enumerable: true },
            description: { value: 'Portable Document Format', enumerable: true },
            length: { value: 2, enumerable: true }
        });
        p[0] = m1; p[1] = m2;
        p['application/pdf'] = m1;
        p['text/pdf'] = m2;
        p.item = function (i) { return this[i]; };
        p.namedItem = function (n) { return this[n]; };
        return p;
    });
    const pluginArr = Object.create(PluginArray.prototype);
    plugins.forEach((p, i) => { pluginArr[i] = p; pluginArr[p.name] = p; });
    Object.defineProperty(pluginArr, 'length', { value: plugins.length });
    pluginArr.item = function (i) { return this[i]; };
    pluginArr.namedItem = function (n) { return this[n]; };
    pluginArr.refresh = function () { };
    pluginArr[Symbol.iterator] = function* () { for (let i = 0; i < this.length; i++) yield this[i]; };
    _def(navigator, 'plugins', pluginArr);

    const mimeArr = Object.create(MimeTypeArray.prototype);
    const seen = new Set();
    let mIdx = 0;
    plugins.forEach(p => {
        for (let i = 0; i < p.length; i++) {
            const m = p[i];
            if (seen.has(m.type)) continue;
            seen.add(m.type);
            mimeArr[mIdx] = m;
            mimeArr[m.type] = m;
            mIdx++;
        }
    });
    Object.defineProperty(mimeArr, 'length', { value: mIdx });
    mimeArr.item = function (i) { return this[i]; };
    mimeArr.namedItem = function (n) { return this[n]; };
    _def(navigator, 'mimeTypes', mimeArr);

    const origQuery = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (params) => {
        if (params && params.name === 'notifications') return Promise.resolve({ state: 'prompt', onchange: null });
        return origQuery(params);
    };
    try { Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true }); } catch (e) { }

    try { Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); } catch (e) { }
    try { Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true }); } catch (e) { }
    try { Object.defineProperty(document, 'webkitHidden', { get: () => false, configurable: true }); } catch (e) { }
    try { Object.defineProperty(document, 'webkitVisibilityState', { get: () => 'visible', configurable: true }); } catch (e) { }
    try {
        const origHasFocus = Document.prototype.hasFocus;
        Document.prototype.hasFocus = function () { return true; };
        Document.prototype.hasFocus.toString = origHasFocus.toString.bind(origHasFocus);
    } catch (e) { }
    try { window.onfocus && window.dispatchEvent(new FocusEvent('focus')); } catch (e) { }

    if (navigator.mediaDevices) {
        const origEnum = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
        navigator.mediaDevices.enumerateDevices = async function () {
            const real = await origEnum();
            if (real && real.length) return real;
            const mk = (deviceId, kind, label, groupId) => ({
                deviceId, kind, label, groupId,
                toJSON: function () { return { deviceId, kind, label, groupId }; }
            });
            return [
                mk('', 'audioinput', '', 'g1'),
                mk('', 'videoinput', '', 'g2'),
                mk('', 'audiooutput', '', 'g1')
            ];
        };
    }

    try {
        const TRUE_KEYS = [
            'hover:hover', 'pointer:fine', 'any-hover:hover', 'any-pointer:fine',
            'color-gamut:srgb', 'prefers-color-scheme:light', 'forced-colors:none',
            'prefers-reduced-motion:no-preference', 'prefers-contrast:no-preference',
            'dynamic-range:standard', 'inverted-colors:none', 'display-mode:browser',
            'monochrome:0', 'update:fast', 'scripting:enabled',
        ];
        const FALSE_KEYS = [
            'color-gamut:p3', 'color-gamut:rec2020', 'prefers-color-scheme:dark',
            'forced-colors:active', 'dynamic-range:high', 'inverted-colors:inverted',
            'prefers-reduced-motion:reduce', 'prefers-contrast:more', 'prefers-contrast:less',
        ];
        const decide = (media) => {
            const n = (media || '').replace(/\s+/g, '').toLowerCase();
            for (const k of TRUE_KEYS) if (n.includes(k)) return true;
            for (const k of FALSE_KEYS) if (n.includes(k)) return false;
            return null;
        };
        try {
            const proto = MediaQueryList.prototype;
            const desc = Object.getOwnPropertyDescriptor(proto, 'matches');
            if (desc && desc.configurable && desc.get) {
                const origGet = desc.get;
                Object.defineProperty(proto, 'matches', {
                    configurable: true,
                    enumerable: desc.enumerable,
                    get: function () {
                        const v = decide(this.media);
                        return v === null ? origGet.call(this) : v;
                    },
                });
            }
        } catch (e) { }
        const origMM = window.matchMedia.bind(window);
        const wrap = (r, v) => new Proxy(r, {
            get(target, prop) {
                if (prop === 'matches') return v;
                const val = Reflect.get(target, prop, target);
                return typeof val === 'function' ? val.bind(target) : val;
            }
        });
        const patched = function (q) {
            const r = origMM(q);
            const v = decide(typeof q === 'string' ? q : '');
            return v === null ? r : wrap(r, v);
        };
        try { patched.toString = window.matchMedia.toString.bind(window.matchMedia); } catch (e) { }
        window.matchMedia = patched;
    } catch (e) { }

    const s = _fp.screen, d = _fp.DeviceInfo, l = _fp.Language, g = _fp.GPU, uad = _fp.userAgentData, bat = _fp.Battery, conn = _fp.Connection;

    _def(screen, 'width', s.Width);
    _def(screen, 'height', s.Height);
    _def(screen, 'availWidth', s.availableWidth);
    _def(screen, 'availHeight', s.availableHeight);
    _def(screen, 'availLeft', 0);
    _def(screen, 'availTop', 0);
    _def(screen, 'isExtended', false);
    _def(screen, 'colorDepth', s.colorDepth);
    _def(screen, 'pixelDepth', s.pixelDepth);
    _def(screen.orientation, 'angle', s.screenOrientationAngle);
    _def(screen.orientation, 'type', s.screenOrientationType);
    _def(window, 'outerWidth', s.outerWidth);
    _def(window, 'outerHeight', s.outerHeight);
    _def(window, 'innerWidth', s.innerWidth);
    _def(window, 'innerHeight', s.innerHeight);
    _def(window, 'devicePixelRatio', s.devicePixelRatio);
    _def(window, 'screenX', 0);
    _def(window, 'screenY', 0);
    _def(window, 'screenLeft', 0);
    _def(window, 'screenTop', 0);

    try {
        if (window.visualViewport) {
            _def(window.visualViewport, 'offsetLeft', 0);
            _def(window.visualViewport, 'offsetTop', 0);
            _def(window.visualViewport, 'pageLeft', 0);
            _def(window.visualViewport, 'pageTop', 0);
            _def(window.visualViewport, 'scale', 1);
            _def(window.visualViewport, 'width', s.innerWidth);
            _def(window.visualViewport, 'height', s.innerHeight);
        }
    } catch (e) { }

    _def(navigator, 'hardwareConcurrency', d.HardwareConcurrency);
    _def(navigator, 'deviceMemory', d.deviceMemory);
    _def(navigator, 'maxTouchPoints', d.maxTouchPoints);
    _def(navigator, 'platform', d.Platform);
    _def(navigator, 'languages', l.Languages);
    _def(navigator, 'language', l.Language);
    _def(navigator, 'doNotTrack', null);
    _def(navigator, 'vendor', 'Google Inc.');
    _def(navigator, 'productSub', '20030107');

    const battery = {
        charging: bat.charging,
        chargingTime: bat.chargingTime === null ? Infinity : bat.chargingTime,
        dischargingTime: bat.dischargingTime === null ? Infinity : bat.dischargingTime,
        level: bat.level,
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => true,
        onchargingchange: null,
        onchargingtimechange: null,
        ondischargingtimechange: null,
        onlevelchange: null
    };
    navigator.getBattery = () => Promise.resolve(battery);

    const buildVoices = () => _fp.Voices.map(v => {
        const o = Object.create(SpeechSynthesisVoice.prototype);
        Object.defineProperties(o, {
            name: { value: v.name, enumerable: true },
            lang: { value: v.lang, enumerable: true },
            default: { value: v.default, enumerable: true },
            localService: { value: v.localService, enumerable: true },
            voiceURI: { value: v.voiceURI, enumerable: true }
        });
        return o;
    });
    if (window.speechSynthesis) {
        const origGetVoices = window.speechSynthesis.getVoices.bind(window.speechSynthesis);
        window.speechSynthesis.getVoices = function () {
            const real = origGetVoices();
            return real && real.length ? real : buildVoices();
        };
    }

    if (navigator.connection) {
        _def(navigator.connection, 'effectiveType', conn.effectiveType);
        _def(navigator.connection, 'rtt', conn.rtt);
        _def(navigator.connection, 'downlink', conn.downlink);
        _def(navigator.connection, 'saveData', conn.saveData);
        _def(navigator.connection, 'type', conn.type);
    }

    const patchWebGL = (proto) => {
        const orig = proto.getParameter;
        proto.getParameter = function (p) {
            if (p === 37445) return g.Vendor;
            if (p === 37446) return g.Renderer;
            return orig.apply(this, [p]);
        };
    };
    patchWebGL(WebGLRenderingContext.prototype);
    if (window.WebGL2RenderingContext) patchWebGL(WebGL2RenderingContext.prototype);

    let rng = 0;
    for (const c of (location.host || 'x')) rng = (rng * 31 + c.charCodeAt(0)) & 0x7fffffff;
    rng = rng || 1;
    const rand = () => { rng = (rng * 1103515245 + 12345) & 0x7fffffff; return rng / 0x7fffffff; };

    const origChannelData = AudioBuffer.prototype.getChannelData;
    AudioBuffer.prototype.getChannelData = function () {
        const data = origChannelData.apply(this, arguments);
        for (let i = 0; i < data.length; i += 1000) {
            data[i] = data[i] + (rand() - 0.5) * 1e-7;
        }
        return data;
    };

    try {
        const WORKER_PATCH = '(()=>{'
            + 'const G=' + JSON.stringify(g) + ';'
            + 'const D=' + JSON.stringify(d) + ';'
            + 'const L=' + JSON.stringify(l) + ';'
            + 'const def=(o,p,v)=>{try{Object.defineProperty(o,p,{get:()=>v,configurable:true});}catch(e){}};'
            + "def(navigator,'hardwareConcurrency',D.HardwareConcurrency);"
            + "def(navigator,'deviceMemory',D.deviceMemory);"
            + "def(navigator,'platform',D.Platform);"
            + "def(navigator,'language',L.Language);"
            + "def(navigator,'languages',L.Languages);"
            + "def(navigator,'vendor','Google Inc.');"
            + 'const patchGL=(proto)=>{if(!proto||!proto.getParameter)return;'
            + 'const orig=proto.getParameter;proto.getParameter=function(p){'
            + 'if(p===37445)return G.Vendor;if(p===37446)return G.Renderer;'
            + 'return orig.apply(this,[p]);};};'
            + "if(typeof WebGLRenderingContext!=='undefined')patchGL(WebGLRenderingContext.prototype);"
            + "if(typeof WebGL2RenderingContext!=='undefined')patchGL(WebGL2RenderingContext.prototype);"
            + '})();';

        const wrapWorker = (OrigWorker) => {
            const Wrapped = function (url, options) {
                try {
                    const urlStr = url.toString();
                    const sameOrigin = urlStr.startsWith('blob:')
                        || urlStr.startsWith('data:')
                        || urlStr.startsWith(location.origin + '/')
                        || urlStr.startsWith('/')
                        || !/^[a-z]+:\/\//i.test(urlStr);
                    if (!sameOrigin) return new OrigWorker(url, options);
                    const isModule = options && options.type === 'module';
                    const tail = isModule
                        ? 'import(' + JSON.stringify(urlStr) + ');'
                        : 'importScripts(' + JSON.stringify(urlStr) + ');';
                    const body = WORKER_PATCH + tail;
                    const blob = new Blob([body], { type: 'application/javascript' });
                    return new OrigWorker(URL.createObjectURL(blob), options);
                } catch (e) {
                    return new OrigWorker(url, options);
                }
            };
            Wrapped.prototype = OrigWorker.prototype;
            try { Object.setPrototypeOf(Wrapped, OrigWorker); } catch (e) { }
            try { Wrapped.toString = OrigWorker.toString.bind(OrigWorker); } catch (e) { }
            return Wrapped;
        };
        if (typeof Worker !== 'undefined') window.Worker = wrapWorker(Worker);
        if (typeof SharedWorker !== 'undefined') window.SharedWorker = wrapWorker(SharedWorker);
    } catch (e) { }

    if (_fp._TZ_OFFSET !== undefined && _fp._TZ_OFFSET !== null) {
        try {
            const origGTO = Date.prototype.getTimezoneOffset;
            const patched = function () { return _fp._TZ_OFFSET; };
            try { patched.toString = origGTO.toString.bind(origGTO); } catch (e) { }
            Date.prototype.getTimezoneOffset = patched;
        } catch (e) { }
    }
    if (_fp._TZ_NAME) {
        try {
            const origResolved = Intl.DateTimeFormat.prototype.resolvedOptions;
            Intl.DateTimeFormat.prototype.resolvedOptions = function () {
                const r = origResolved.apply(this, arguments);
                r.timeZone = _fp._TZ_NAME;
                return r;
            };
            try { Intl.DateTimeFormat.prototype.resolvedOptions.toString = origResolved.toString.bind(origResolved); } catch (e) { }
        } catch (e) { }
    }
})();
