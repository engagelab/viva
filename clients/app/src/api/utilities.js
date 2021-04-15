// https://stackoverflow.com/questions/3552461/how-to-format-a-javascript-date
function formatDate(date) {
  var monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  var hours = date.getHours();
  var mins = date.getMinutes();

  hours = hours.toString().length == 1 ? '0' + hours : hours;
  mins = mins.toString().length == 1 ? '0' + mins : mins;

  return (
    day + ' ' + monthNames[monthIndex] + ' ' + year + ' | ' + hours + ':' + mins
  );
}

// Random UUID. See https://gist.github.com/jed/982883
function uuid(
  a // placeholder
) {
  return a // if the placeholder was passed, return
    ? // a random number from 0 to 15
      /* eslint no-bitwise: ["error", { "allow": ["^", ">>"] }] */
      (
        a ^ // unless b is 8,
        (crypto.getRandomValues(new Uint8Array(1))[0] % // in which case
          16 >> // a random number from
          (a / 4))
      ) // 8 to 11
        .toString(16) // in hexadecimal
    : // or otherwise a concatenated string:
      (
        [1e7] + // 10000000 +
        -1e3 + // -1000 +
        -4e3 + // -4000 +
        -8e3 + // -80000000 +
        -1e11
      ) // -100000000000,
        .replace(
          // replacing
          /[018]/g, // zeroes, ones, and eights with
          uuid // random hex digits
        );
}

const blob2ArrayBuffer = async blob => await new Response(blob).arrayBuffer();

// Taken from: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
function ab2str(buf) {
  const s = String.fromCharCode.apply(null, new Uint16Array(buf));
  return s;
}
function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function ui8arr2str(uint8array) {
  // return new TextDecoder().decode(uint8array);
  return uint8array.toString();
}

function str2ui8arr(myString) {
  const array = myString.split(',');
  const a = Uint8Array.from(array);
  return a;
  //return new TextEncoder().encode(myString);
}

// https://gist.github.com/tomfa/706d10fed78c497731ac
/* function JsonToArray(json) {
  const str = JSON.stringify(json, null, 0);
  const ret = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    ret[i] = str.charCodeAt(i);
  }
  return ret;
}

function binArrayToJson(binArray) {
  let str = '';
  for (let i = 0; i < binArray.length; i++) {
    str += String.fromCharCode(parseInt(binArray[i]));
  }
  return JSON.parse(str);
} */

export default {
  /* JsonToArray,
  binArrayToJson, */
  formatDate,
  uuid,
  ab2str,
  str2ab,
  blob2ArrayBuffer,
  // arrayBuffer2Blob,
  ui8arr2str,
  str2ui8arr,
};
