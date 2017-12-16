var fireradarhost = "http://127.0.0.1";

function FireRadar() {
}

FireRadar.prototype = {
    constructor: FireRadar,
    getFingerPrint: function (done) {
        var fp = new Fingerprint2();
        fp.get(function (result, components) {
            var obj = {};
            for(var i = 0 ; i < components.length; i++){
                console.log(components[i].key);
                obj[components[i].key] = components[i].value;
            }
            $.ajax({
                type: "POST",
                url: fireradarhost + ":8085/device/set?fp="+result+"&type=js",
                data: JSON.stringify(obj),
                success: function(data){console.log(data)},
                dataType: "json",
                contentType : "application/json"
            });
            done(result);
        });
    },
    getToken: function () {
        getFingerPrint(function (fingerprint) {
            var key = "a@F4C`Lh6)&9H48d";
            var iv = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
            var content = getEncryptText(fingerprint + "|" + location.protocol + '//' + location.host, key, iv);
            var url = fireradarhost + ":8081/fafes/requestToken?content=" + content + "&iv=" + iv + "&callback=setToken";
            alert(url);
            var script = document.createElement("script");
            script.setAttribute("src", url);
            script.setAttribute("type", "text/javascript");
            document.getElementsByTagName("head")[0].appendChild(script);
        });
    },
    getEncryptText: function (text, key, iv) {
        var keyBytes = CryptoJS.enc.Utf8.parse(key);
        var ivBytes = CryptoJS.enc.Utf8.parse(iv);
        var textBytes = CryptoJS.enc.Utf8.parse(text);

        var encrypted = CryptoJS.AES.encrypt(textBytes, keyBytes, {iv: ivBytes, mode: CryptoJS.mode.CBC});
        console.log(typeof (encrypted));
        return encrypted.toString();
    },
    randomString: function (length, chars) {
        var result = '';
        for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
    },
    // jsonp 回调方法
    setToken: function (result) {
        var obj = JSON && JSON.parse(result) || $.parseJSON(result);
        if (obj.success) {
            document.getElementById("fr_token").value = obj.object.token;
            document.getElementById("fr_device_id").value = obj.object.device_id;
            alert(obj.object.token + " , " + obj.object.device_id);
        } else {
            alert(obj.errormsg);
        }
    }
}