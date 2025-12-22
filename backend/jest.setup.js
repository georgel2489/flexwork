const { webcrypto } = require("crypto");

if (!global.crypto) {
  global.crypto = webcrypto;
}
