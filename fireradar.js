var fireradarhost1 = "http://127.0.0.1";

function getOrderMapString(object) {
    if ($.type(object) === "object") {
        var sdic = Object.keys(object).sort();
        var sb = "";
        for (var i in sdic) {
            var key = sdic[i];
            sb += key;
            sb += getOrderMapString(object[key]);
        }
        return sb;
    } else if ($.type(object) === "array") {
        var sb = "";
        for (var i in object) {
            sb += getOrderMapString(object[i]);
        }
        return sb;
    } else if (object === null) {
        return "null";
    } else {
        return object;
    }
}

function getToken(encryption, content) {
    var contentStr = getOrderMapString(content).replace(new RegExp("\\n", "gm"), "").replace(new RegExp(" ", "gm"), "");
    var sb = "";
    sb += contentStr;
    sb += encryption;
    return $.md5(sb);
}

function FireRadar1(param) {
    var default_param = {
        domain: document.domain,
        encryption_url: '/encryption',         // Ajax请求uptoken的Url，强烈建议设置（服务端提供）
        encryption_func: function (ret) {          // 在需要获取uptoken时，该方法会被调用
            return ret;
        },
        appcode: null,
        encryption: null
    };

    var new_param;

    if (param !== null) {
        new_param = $.extend(default_param, param);
    } else {
        new_param = default_param;
    }

    if (!param.hasOwnProperty("encryption") || param["encryption"] === null) {
        $.ajax({
            type: "GET",
            url: new_param.domain + new_param.encryption_url,
            success: function (data) {
                new_param.encryption = new_param.encryption_func(data);
            }
        })
    }
    this.param = new_param;
}

FireRadar1.prototype = {
    constructor: FireRadar1,
    getFingerPrint: function (callback) {
        var def = $.Deferred();
        var fp = getStorage("fp");
        if (fp !== null) {
            if (callback !== null) {
                callback(fp);
            }
            def.resolve(fp);
            return def;
        }
        var param = this.param;
        var fp = new Fingerprint3();
        fp.get(function (result, components) {
            var obj = {};
            for (var i = 0; i < components.length; i++) {
                //console.log(components[i].key);
                obj[components[i].key] = components[i].value;
            }
            $.ajax({
                type: "POST",
                url: fireradarhost1 + ":8085/device/getFingerprintNew?type=js&appcode=" + param.appcode + "&token=" + getToken(param.encryption, obj),
                data: JSON.stringify(obj),
                success: function (data) {
                    var fp = data.data.fp;
                    setStorage("fp", data.data.fp, data.data.expire * 1000);
                    if (callback !== null) {
                        callback(fp);
                    }
                    def.resolve(fp);
                },
                dataType: "json",
                contentType: "application/json"
            });
        });
        return def;
    },
    getIP: function (callback) {
        var def = $.Deferred();
        $.ajax({
            type: "GET",
            url: fireradarhost1 + ":8085/device/getIP",
            success: function (data) {
                var ip = data.data;
                if (callback !== null) {
                    callback(ip);
                }
                def.resolve(ip);
            },
            dataType: "json",
            contentType: "application/json"
        });
        return def;
    },
    sendEvent: function (event_param, callback) {
        var param = this.param;
        $.when(this.getFingerPrint(null), this.getIP(null)).done(function (fp, ip) {
            var date = new Date();
            var month = date.getMonth() + 1;
            var strDate = date.getDate();
            if (month >= 1 && month <= 9) {
                month = "0" + month;
            }
            if (strDate >= 0 && strDate <= 9) {
                strDate = "0" + strDate;
            }
            var trans_date = date.getFullYear() + "-" + month + "-" + strDate;
            var trans_time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
            var default_event_param = {
                organ_key: param.appcode,
                encryption_key: param.encryption,
                trans_date: trans_date,
                trans_time: trans_time,
                trans_ip: ip,
                mac: fp,
                refer: document.referrer,
                user_agent: navigator.userAgent
            };
            var new_param = $.extend(default_event_param, event_param);
            $.ajax({
                type: "POST",
                url: fireradarhost1 + ":8082/api/trans",
                data: JSON.stringify(new_param),
                success: function (data) {
                    if (callback !== null) {
                        callback(data);
                    }
                    def.resolve(data);
                },
                dataType: "json",
                contentType: "application/json"
            });
        })
    }
};

function setStorage(key, value, exp) {
    var curTime = new Date().getTime();
    localStorage.setItem(key, JSON.stringify({data: value, time: curTime + exp}));
}

function getStorage(key) {
    var data = localStorage.getItem(key);
    var dataObj = JSON.parse(data);
    if (new Date().getTime() > dataObj.time) {
        console.log('信息已过期');
        return null;
    } else {
        return dataObj.data;
    }
}
