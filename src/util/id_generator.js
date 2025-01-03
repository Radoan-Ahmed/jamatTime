"use strict";
let indexValue = 0;
let randomAlphaNumericText = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

module.exports = {

    ID: {
        random: Math.floor(1000 + Math.random() * 9000)
    },
    generateIncrementalId: (data_count) => {
        
        indexValue =  data_count = 0 ? data_count = 0 : (++data_count)
        const uid = indexValue
        return uid.toString().padStart(6, "0");
    },
    generateIncrementalIdByDataCountAndLength: (data_count, length) => {
        indexValue =  data_count = 0 ? data_count = 0 : (++data_count)
        const uid = indexValue
        return uid.toString().padStart(length, "0");
    },
    generateUniqueId: () => {
        const time = new Date().getTime()
        count = time > previous ? 0 : (++count)
        const uid = time + count
        previous = uid
        return uid
    },
    generateRandomAlphaNumericText: (length) => {
        var randomAlphaNumericCode = Array(8).fill(randomAlphaNumericText).map(function(x) { return x[Math.floor(Math.random() * x.length)] }).join('');
        return randomAlphaNumericCode
    }
}
