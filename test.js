const {
  createCipheriv,
  randomFillSync,
  randomBytes,
  createHash,
  createDecipheriv,
  createHmac,
  generateKeyPairSync
} = require("crypto");
const jwt = require("jsonwebtoken");

const encrypt = (text, key, encoding) => {
  try {
    const iv = randomBytes(16);

    const cipher = createCipheriv("aes-192-cbc", key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return encrypted.toString(encoding);
  } catch (error) {
    console.error(error);
    return text;
  }
};

const generateHMAC = (text, secret) => {
  return createHmac("sha256", secret)
    .update(text)
    .digest("base64")
    .replace(/\=+$/, "");
};

["base64"].forEach(encoding => {
  console.log(
    encoding,
    encodeURIComponent(
      encrypt(
        encrypt(
          "62812e9e4c5696dccbba680c",
          "WZ_GDB@h8aGAm.vmz8bkPJtk",
          encoding
        ),
        "WZ_GDB@h8aGAm.vmz8bkPJtk",
        encoding
      )
    )
  );
});
console.log(
  generateHMAC(
    JSON.stringify({
      userId: "asdasd",
      clientId: "znlklnvcalksnclkas",
      codeChallenge: "ansljkcasnlvasmvlasvlmas",
      codeChallengeMethod: "s256"
    }),
    "@vb*EgzLwAKQr.hmf!Xfao-r"
  )
);
