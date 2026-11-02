// DeepL Free for QTranslate
// 2026 compatibility build.
//
// Translation endpoint:
//   https://oneshot-free.www.deepl.com/v1/translate
//
// No DeepL API key required.
// These are undocumented DeepL client endpoints and can change again.

var DEEPL_HOST = "https://oneshot-free.www.deepl.com";
var DEEPL_MAX_TEXT = 1450;

function deepLRandomHex(length) {
    var chars = "0123456789abcdef";
    var out = "";
    var i;

    for (i = 0; i < length; i++) {
        out += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return out;
}

function deepLUUID() {
    return (
        deepLRandomHex(8) + "-" +
        deepLRandomHex(4) + "-4" +
        deepLRandomHex(3) + "-" +
        (8 + Math.floor(Math.random() * 4)).toString(16) +
        deepLRandomHex(3) + "-" +
        deepLRandomHex(12)
    );
}

// Keep this stable for the lifetime of QTranslate.
// Rotating it on every request is a stronger anti-bot signal.
var DEEPL_INSTANCE_ID = deepLUUID();

function serviceHeader() {
    return new ServiceHeader(
        131,
        "DeepL Fixed",
        "DeepL Free Oneshot" + Const.NL2 +
        "2026 compatibility service" + Const.NL2 +
        "https://www.deepl.com",
        Capability.TRANSLATE | Capability.DETECT_LANGUAGE
    );
}

function serviceHost(a, b, c) {
    return DEEPL_HOST;
}

function serviceLink(text, from, to) {
    var url = "https://www.deepl.com/translator";

    if (text && isLanguage(to)) {
        var source = isLanguage(from) ? codeFromLanguage(from).toLowerCase() : "auto";
        var target = codeFromLanguage(to).toLowerCase();

        url += format(
            "#{0}/{1}/{2}",
            source,
            target,
            encodeGetParam(text)
        );
    }

    return url;
}

// QTranslate's language table mapping.
// Only languages supported by DeepL are enabled.
SupportedLanguages = [
    -1, "auto", -1, -1, -1, "AR", -1, -1, -1, "BG",
    -1, "ZH-HANS", "ZH-HANT", -1, "CS", "DA", "NL", "EN", "ET", "FI",
    -1, "FR", -1, "DE", "EL", -1, "HE", -1, "HU", -1,
    "ID", "IT", -1, "JA", -1, "KO", "LV", "LT", -1, -1,
    -1, "NB", -1, "PL", "PT", "RO", "RU", -1, "SK", "SL",
    "ES", -1, "SV", -1, "TR", "UK", -1, "VI", -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1
];

function deepLRawCode(lang, fallback) {
    if (!isLanguage(lang) || lang === AUTO_DETECT_LANGUAGE) {
        return fallback || "auto";
    }

    var code = codeFromLanguage(lang);
    return code ? String(code) : (fallback || "auto");
}

function deepLStorefrontCode(lang, target) {
    var code = deepLRawCode(lang, target ? "en" : "auto").toUpperCase();

    if (code === "AUTO") {
        return "auto";
    }

    if (code === "ZH" || code === "ZH-CN" || code === "ZH-HANS") {
        return "zh-Hans";
    }

    if (code === "ZH-TW" || code === "ZH-HANT") {
        return "zh-Hant";
    }

    if (code === "EN-US") {
        return "en-US";
    }

    if (code === "EN-GB") {
        return "en-GB";
    }

    if (code === "PT-BR") {
        return "pt-BR";
    }

    if (code === "PT-PT") {
        return "pt-PT";
    }

    return code.toLowerCase();
}

function deepLExtensionSourceCode(lang) {
    var code = deepLRawCode(lang, "auto").toUpperCase();

    if (code === "AUTO") {
        return "";
    }

    if (code === "ZH" || code === "ZH-CN" || code === "ZH-HANS") {
        return "zh-Hans";
    }

    if (code === "ZH-TW" || code === "ZH-HANT") {
        return "zh-Hant";
    }

    if (code === "EN") {
        return "en";
    }

    if (code === "PT") {
        return "pt";
    }

    if (code === "EN-US") {
        return "en-US";
    }

    if (code === "EN-GB") {
        return "en-GB";
    }

    if (code === "PT-BR") {
        return "pt-BR";
    }

    if (code === "PT-PT") {
        return "pt-PT";
    }

    return code.toLowerCase();
}

function deepLExtensionTargetCode(lang) {
    var code = deepLRawCode(lang, "EN").toUpperCase();

    if (code === "ZH" || code === "ZH-CN" || code === "ZH-HANS") {
        return "zh-Hans";
    }

    if (code === "ZH-TW" || code === "ZH-HANT") {
        return "zh-Hant";
    }

    // New oneshot target API prefers a regional English variant.
    if (code === "EN") {
        return "en-US";
    }

    if (code === "PT") {
        return "pt-BR";
    }

    if (code === "EN-US") {
        return "en-US";
    }

    if (code === "EN-GB") {
        return "en-GB";
    }

    if (code === "PT-BR") {
        return "pt-BR";
    }

    if (code === "PT-PT") {
        return "pt-PT";
    }

    return code.toLowerCase();
}

function deepLPrepareText(text) {
    text = prepareSource(text);

    if (text.length > DEEPL_MAX_TEXT) {
        text = text.slice(0, DEEPL_MAX_TEXT);
    }

    return text;
}

function deepLStorefrontHeaders() {
    return [
        "Content-Type: application/json",
        "Accept: application/json, text/plain, */*"
    ].join(Const.NL);
}

function deepLExtensionHeaders() {
    return [
        "Content-Type: application/json",
        "Accept: application/json"
    ].join(Const.NL);
}

function deepLStorefrontRequest(text, from, to) {
    text = deepLPrepareText(text);

    var body = {
        text: [text],
        source_lang: deepLStorefrontCode(from, false),
        target_lang: deepLStorefrontCode(to, true),
        language_model: "next-gen",
        usage_type: "Translate"
    };

    return new RequestData(
        HttpMethod.POST,
        "/deepl/v1/storefront/translate",
        stringifyJSON(body),
        deepLStorefrontHeaders(),
        null,
        "deepLStorefrontResponse"
    );
}

function deepLExtensionRequest(text, from, to) {
    text = deepLPrepareText(text);

    var body = {
        text: [text],
        target_lang: deepLExtensionTargetCode(to),
        usage_type: "Translate",
        app_information: {
            os: "brex_macOS",
            os_version: "brex_chrome_120.0.0.0",
            app_version: "1.86.0",
            app_build: "chrome_web_store",
            instance_id: DEEPL_INSTANCE_ID
        }
    };

    var source = deepLExtensionSourceCode(from);

    if (source) {
        body.source_lang = source;
    }

    return new RequestData(
        HttpMethod.POST,
        "/v1/translate",
        stringifyJSON(body),
        deepLExtensionHeaders(),
        null,
        "deepLExtensionResponse"
    );
}

function serviceTranslateRequest(text, from, to) {
    return deepLExtensionRequest(text, from, to);
}

function deepLExtractTranslation(data) {
    if (!data) {
        return "";
    }

    if (data.translations && data.translations.length) {
        var item = data.translations[0];

        if (typeof item === "string") {
            return item;
        }

        if (item && typeof item.text === "string") {
            return item.text;
        }
    }

    if (typeof data.data === "string") {
        return data.data;
    }

    if (data.result && data.result.translations && data.result.translations.length) {
        var oldItem = data.result.translations[0];

        if (oldItem && typeof oldItem.text === "string") {
            return oldItem.text;
        }

        if (oldItem && oldItem.beams && oldItem.beams.length) {
            var beam = oldItem.beams[0];

            if (beam && typeof beam.postprocessed_sentence === "string") {
                return beam.postprocessed_sentence;
            }

            if (beam && beam.sentences && beam.sentences.length && beam.sentences[0].text) {
                return beam.sentences[0].text;
            }
        }
    }

    return "";
}

function deepLDetectedLanguage(data, from) {
    if (isLanguage(from) && from !== AUTO_DETECT_LANGUAGE) {
        return from;
    }

    var detected = "";

    if (data && data.translations && data.translations.length) {
        var item = data.translations[0];

        if (item && typeof item !== "string") {
            detected =
                item.detected_source_language ||
                item.detectedSourceLanguage ||
                "";
        }
    }

    if (!detected && data && data.detected_source_language) {
        detected = data.detected_source_language;
    }

    if (!detected) {
        return from;
    }

    detected = String(detected).toUpperCase();

    if (detected === "ZH" || detected === "ZH-CN") {
        detected = "ZH-HANS";
    } else if (detected === "ZH-TW") {
        detected = "ZH-HANT";
    } else if (detected === "EN-US" || detected === "EN-GB") {
        detected = "EN";
    } else if (detected === "PT-BR" || detected === "PT-PT") {
        detected = "PT";
    }

    return languageFromCode(detected);
}

function deepLErrorText(data) {
    if (!data) {
        return "";
    }

    if (data.message) {
        return String(data.message);
    }

    if (data.title) {
        return String(data.title);
    }

    if (data.error) {
        if (typeof data.error === "string") {
            return data.error;
        }

        if (data.error.message) {
            return String(data.error.message);
        }
    }

    return "";
}

function deepLStorefrontResponse(original, json, from, to) {
    try {
        var data = parseJSON(json);
        var translated = deepLExtractTranslation(data);

        if (translated) {
            return new ResponseData(
                translated,
                deepLDetectedLanguage(data, from),
                to,
                ""
            );
        }

        // Storefront endpoint can change independently.
        // Retry once through the current extension-style oneshot endpoint.
        return new ResponseData(
            "",
            from,
            to,
            "",
            "deepLExtensionRequest"
        );
    } catch (e) {
        return new ResponseData(
            "",
            from,
            to,
            "",
            "deepLExtensionRequest"
        );
    }
}

function deepLExtensionResponse(original, json, from, to) {
    try {
        var data = parseJSON(json);
        var translated = deepLExtractTranslation(data);

        if (translated) {
            return new ResponseData(
                translated,
                deepLDetectedLanguage(data, from),
                to,
                ""
            );
        }

        var errorText = deepLErrorText(data);

        return new ResponseData(
            "[DeepL] " +
            (errorText || "Oneshot endpoint returned no translation"),
            from,
            to,
            ""
        );
    } catch (e) {
        return new ResponseData(
            "[DeepL] " + e.message,
            from,
            to,
            ""
        );
    }
}

function serviceDetectLanguageRequest(text) {
    var request = deepLExtensionRequest(text, AUTO_DETECT_LANGUAGE, ENGLISH_LANGUAGE);
    request.responseHandler = "";
    return request;
}

function serviceDetectLanguageResponse(json) {
    try {
        var language = deepLDetectedLanguage(parseJSON(json), AUTO_DETECT_LANGUAGE);
        return isLanguage(language) ? language : UNKNOWN_LANGUAGE;
    } catch (e) {
        return UNKNOWN_LANGUAGE;
    }
}


