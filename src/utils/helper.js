// class Helper {
//     static safelyParseJSON(json) {
//         let parsed = json;
//         try {
//             parsed = JSON.parse(json);
//         } catch (e) {}
//         return parsed;
//     }

//    static isEmpty(str) {
//     return str === null || str === undefined || str.length === 0;
//     }

//     static isNotEmpty(str) {
//     return str !== null && str !== undefined && str.length > 0;
// }

//     static getBoolean(yesNoStr) {
//         if (yesNoStr) {
//             return yesNoStr === 'Y';
//         } else return yesNoStr;
//     }

//     static chunk = (arr, size) =>
//         Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
//             arr.slice(i * size, i * size + size)
//         );
// }

// module.exports = { Helper };