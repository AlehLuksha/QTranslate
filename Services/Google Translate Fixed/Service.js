// Google Translate for QTranslate
// Replacement for the old token-based Google service.
// Uses the unofficial Chrome dictionary endpoint on clients5.google.com.

function serviceHeader() {
    return new ServiceHeader(
        101,
        "Google Fixed",
        "Google Translate" + Const.NL2 + "https://translate.google.com",
        Capability.TRANSLATE | Capability.DETECT_LANGUAGE
    );
}

function serviceHost(a, b, c) {
    return "https://clients5.google.com";
}

function serviceLink(text, from, to) {
    var url = "https://translate.google.com/";
    if (text) {
        var source = isLanguage(from) ? codeFromLanguage(from) : "auto";
        var target = isLanguage(to) ? codeFromLanguage(to) : "en";
        url += format(
            "?sl={0}&tl={1}&text={2}&op=translate",
            source,
            target,
            encodeGetParam(text)
        );
    }
    return url;
}

SupportedLanguages = [
    -1, "auto", "af", "az", "sq", "ar", "hy", "eu", "be", "bg",
    "ca", "zh-CN", "zh-TW", "hr", "cs", "da", "nl", "en", "et", "fi",
    "tl", "fr", "gl", "de", "el", "ht", "iw", "hi", "hu", "is",
    "id", "it", "ga", "ja", "ka", "ko", "lv", "lt", "mk", "ms",
    "mt", "no", "fa", "pl", "pt", "ro", "ru", "sr", "sk", "sl",
    "es", "sw", "sv", "th", "tr", "uk", "ur", "vi", "cy", "yi",
    "eo", "hmn", "la", "lo", "kk", "uz", "si", "tg", "te", "km",
    "mn", "kn", "ta", "mr", "bn", "tt"
];

function googleLang(lang, fallback) {
    if (!isLanguage(lang) || lang === AUTO_DETECT_LANGUAGE) {
        return fallback || "auto";
    }

    var code = codeFromLanguage(lang);
    return code || fallback || "auto";
}

function makeGoogleRequest(text, source, target) {
    text = limitSource(prepareSource(text));

    var q = encodeUriParam(text);
    var path = format(
        "/translate_a/t?client=dict-chrome-ex&sl={0}&tl={1}",
        source,
        target
    );

    var method = q.length > Const.MAX_URI_LEN ? HttpMethod.POST : HttpMethod.GET;

    if (method === HttpMethod.GET) {
        path += "&q=" + q;
        return new RequestData(method, path, null);
    }

    return new RequestData(
        method,
        path,
        "q=" + q,
        "Content-Type: application/x-www-form-urlencoded; charset=UTF-8"
    );
}

function serviceTranslateRequest(text, from, to) {
    var source = googleLang(from, "auto");
    var target = googleLang(to, "en");
    return makeGoogleRequest(text, source, target);
}

function serviceTranslateResponse(original, json, from, to) {
    try {
        var data = parseJSON(json);
        var translated = "";
        var detected = from;
        // Chrome dictionary endpoint: [translation] or [[translation, source]].
        if (data && typeof data[0] === "string") {
            return new ResponseData(data[0], from, to, "");
        }
        if (data && data[0] && typeof data[0][0] === "string" && typeof data[0][1] === "string") {
            return new ResponseData(data[0][0], languageFromCode(data[0][1].toLowerCase()), to, "");
        }

        // Preferred response format when dj=1 is accepted.
        if (data && data.sentences) {
            for (var i = 0; i < data.sentences.length; i++) {
                if (data.sentences[i] && data.sentences[i].trans) {
                    translated += data.sentences[i].trans;
                }
            }

            if ((!isLanguage(from) || from === AUTO_DETECT_LANGUAGE) && data.src) {
                detected = languageFromCode(String(data.src).toLowerCase());
            }

            return new ResponseData(translated, detected, to, "");
        }

        // Fallback for Google's older array response.
        if (data && data[0]) {
            for (var j = 0; j < data[0].length; j++) {
                if (data[0][j] && data[0][j][0]) {
                    translated += data[0][j][0];
                }
            }

            if ((!isLanguage(from) || from === AUTO_DETECT_LANGUAGE) && data[2]) {
                detected = languageFromCode(String(data[2]).toLowerCase());
            }

            return new ResponseData(translated, detected, to, "");
        }

        return new ResponseData("[Google] Empty or unsupported response", from, to, "");
    } catch (e) {
        return new ResponseData("[Google] " + e.message, from, to, "");
    }
}

function serviceDetectLanguageRequest(text) {
    text = limitSource(prepareSource(text), 1500);
    return makeGoogleRequest(text, "auto", "en");
}

function serviceDetectLanguageResponse(json) {
    try {
        var data = parseJSON(json);

        if (data && data[0] && typeof data[0][1] === "string") {
            return languageFromCode(data[0][1].toLowerCase());
        }
        if (data && data.src) {
            return languageFromCode(String(data.src).toLowerCase());
        }

        if (data && data[2]) {
            return languageFromCode(String(data[2]).toLowerCase());
        }

        return UNKNOWN_LANGUAGE;
    } catch (e) {
        return UNKNOWN_LANGUAGE;
    }
}

