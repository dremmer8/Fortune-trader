// Lightweight i18n - no dependencies. Load locale JSON and use t(key) or t(key, { var: value }).

(function (global) {
    'use strict';

    var locale = 'en';
    var strings = {};
    var onLocaleChange = null;

    function getStoredLocale() {
        try {
            if (typeof state !== 'undefined' && state.settings && state.settings.locale) {
                return state.settings.locale;
            }
            return localStorage.getItem('fortune_trader_locale') || 'en';
        } catch (e) {
            return 'en';
        }
    }

    function setStoredLocale(lang) {
        try {
            localStorage.setItem('fortune_trader_locale', lang);
            if (typeof state !== 'undefined' && state.settings) {
                state.settings.locale = lang;
            }
        } catch (e) {}
    }

    function getNested(obj, keyPath) {
        var keys = keyPath.split('.');
        var cur = obj;
        for (var i = 0; i < keys.length; i++) {
            if (cur == null || typeof cur !== 'object') return undefined;
            cur = cur[keys[i]];
        }
        return cur;
    }

    /**
     * Translate key. Supports dot path and interpolation: t('greet', { name: 'Bob' }) with "Hello {{name}}"
     * @param {string} key - e.g. 'welcome.title' or 'banker.balanceLabel'
     * @param {Object} [params] - optional { stock: 'APLS' } for "{{stock}}"
     * @returns {string}
     */
    function t(key, params) {
        var value = getNested(strings, key);
        if (value == null || typeof value !== 'string') {
            return key;
        }
        if (params && typeof params === 'object') {
            Object.keys(params).forEach(function (k) {
                value = value.replace(new RegExp('\\{\\{' + k + '\\}\\}', 'g'), String(params[k]));
                value = value.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
            });
        }
        return value;
    }

    /**
     * Get locale data from embedded script (works with file:// when fetch is blocked by CORS).
     */
    function getEmbeddedLocale(lang) {
        var key = '__LOCALE_' + (lang || 'en').toUpperCase().replace(/-.*/, '') + '__';
        return (typeof window !== 'undefined' && window[key]) || null;
    }

    /**
     * Load locale and apply to DOM. Tries fetch first (http/https); falls back to embedded data (file://).
     * @param {string} lang - e.g. 'en', 'ru'
     */
    function loadLocale(lang) {
        locale = lang || 'en';
        var url = 'locales/' + locale + '.json';

        function applyLocale(data) {
            strings = data || {};
            setStoredLocale(locale);
            applyToDOM();
            if (typeof onLocaleChange === 'function') {
                onLocaleChange(locale);
            }
            return locale;
        }

        function tryEmbedded() {
            var data = getEmbeddedLocale(locale);
            if (data) return Promise.resolve(applyLocale(data));
            if (locale !== 'en') {
                locale = 'en';
                data = getEmbeddedLocale('en');
                if (data) return Promise.resolve(applyLocale(data));
            }
            return Promise.resolve(applyLocale({}));
        }

        return fetch(url)
            .then(function (res) {
                if (!res.ok) throw new Error('Locale not found: ' + locale);
                return res.json();
            })
            .then(applyLocale)
            .catch(function (err) {
                if (err && err.message && err.message.indexOf('Locale not found') === -1) {
                    console.info('i18n: using embedded locale (fetch not available in this environment)');
                }
                return tryEmbedded();
            });
    }

    /**
     * Apply translations to elements with data-i18n or data-i18n-placeholder.
     * data-i18n="key" -> textContent
     * data-i18n-placeholder="key" -> placeholder
     * data-i18n-html="key" -> innerHTML (use sparingly)
     */
    function applyToDOM() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (!key) return;
            var val = t(key);
            if (el.getAttribute('data-i18n-html') === 'true') {
                el.innerHTML = val;
            } else {
                el.textContent = val;
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (key) el.placeholder = t(key);
        });
        var htmlLang = document.documentElement;
        if (htmlLang) htmlLang.setAttribute('lang', locale === 'ru' ? 'ru' : 'en');
    }

    /**
     * Initialize: load stored locale and apply. Call after DOM ready.
     * @param {string} [preferLang] - override stored locale
     */
    function init(preferLang) {
        var lang = preferLang || getStoredLocale();
        return loadLocale(lang);
    }

    function getLocale() {
        return locale;
    }

    /**
     * Set language and reload. Call from settings UI.
     * @param {string} lang
     * @returns {Promise}
     */
    function setLocale(lang) {
        return loadLocale(lang);
    }

    /**
     * Register callback when locale changes (so main.js can refresh dynamic UI).
     */
    function setOnLocaleChange(fn) {
        onLocaleChange = fn;
    }

    global.i18n = {
        t: t,
        loadLocale: loadLocale,
        init: init,
        getLocale: getLocale,
        setLocale: setLocale,
        applyToDOM: applyToDOM,
        setOnLocaleChange: setOnLocaleChange
    };

    global.t = t;
})(typeof window !== 'undefined' ? window : this);
