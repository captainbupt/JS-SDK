function getToken() {
    var fp = new Fingerprint2();
    fp.get(function (fingerprint) {
        var key = "a@F4C`Lh6)&9H48d";
        var iv = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        var content = getEncryptText(fingerprint + "|" + location.protocol + '//' + location.host, key, iv);
        var url = "http://127.0.0.1:8081/fafes/requestToken?content=" + content + "&iv=" + iv + "&callback=setToken";
        alert(url);
        var script = document.createElement("script");
        script.setAttribute("src", url);
        script.setAttribute("type", "text/javascript");
        document.getElementsByTagName("head")[0].appendChild(script);
    });
};

// https://github.com/ricmoo/aes-js
// key must by 16/24/32 bytes and iv must be 16 bytes
function getEncryptText(text, key, iv) {
    var keyBytes = CryptoJS.enc.Utf8.parse(key);
    var ivBytes = CryptoJS.enc.Utf8.parse(iv);
    var textBytes = CryptoJS.enc.Utf8.parse(text);

    var encrypted = CryptoJS.AES.encrypt(textBytes, keyBytes, { iv: ivBytes,mode:CryptoJS.mode.CBC});
    console.log(typeof (encrypted));
    return encrypted.toString();
}

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function setToken(result) {
    alert(result);
    var obj = JSON && JSON.parse(result) || $.parseJSON(result);
    if (obj.success) {
        document.getElementById("fr_token").value = obj.object.token;
        document.getElementById("fr_device_id").value = obj.object.device_id;
        alert(obj.object.token + " , " + obj.object.device_id);
    } else {
        alert(obj.errormsg);
    }
}