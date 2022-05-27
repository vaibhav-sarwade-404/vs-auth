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

const accessToken = jwt.sign(
  {
    sub: String("123123"),
    azp: "asdasd",
    scope: "email"
  },
  {
    key: {
      p: "3RS9GpUJF8iC7QXAGcK40QtWOTXwNfCARzTpU9_Z2mKD8xBCTZ7Ot35aLcBAvmwaEURmSke4T8i9MSy9-pfhBt2fAvw9syM0Dia9-U1lwBrJL_1dv3PjLGNeUftc4B9jr3DnBQUIdYp2D2gA_NtpKTEiHEpCUR2I37dKmvzbdtyBd1caKFA-MlfefANza3-jyMuBiSOFliTDa5SkdHHjCh-5u24ETNcfGQz52y1LG_Ty-77H0MU13Hl7xPOKYKVCb5vtTZg-renLGC8pjIhZTnjRuSGOpuxyiyrze40Fy6P9b3piX_CizpCQR8vW8OGic6-2E1bN9GwIHR7Fu3UKLw",
      kty: "RSA",
      q: "zQaiNO7cZMvW9LPixAOEEkMgMO0o9eajbEHIg07C_kaGy73pOL1pLrIfXfYtLFECEkSSd_hf06EbwrJd38L_zK6xEJvrNxtGLpbYGfCc4Z1baSX3xzWN0khU_Gow4IgtoF-NBtPUfL0YiYd-nv1XscdJ2bULK4wc3lDgtGcduEQylNHnf5nQkVDdpDq6-rzt_CdLSuGJGtwUmNrLd8ysbr3DffiVc61pvqAUFLgGYE_eGijwnX0SOq1tyoaB9ktZAofDjsshgFLNZczNe_tRg1nKKbprOJQatu5GdL7EdPjHeJy3ZhmxLAYPADWzCccdIbwfUj9iom5w5OqiJP2NOw",
      d: "AV9ZD04OuqwVw3NQY-xALtMWQbU3Ab3INHhJZqhvKN-y4w4Cd2JbJOgav1Pfh_qZ-nCzjBNnvFU0qfhB9LzBbSDUslVeGhKL_l2grDYgD6W-mpmdg4TCgd6J3mxk62s1VjBqNEMEAlWqa7yFZXvCW-JRredlnczh547AxleZST-pRtDZAh1F_4RBWpbBy-MTNmbI5fsi9f88FF5ygU8w6uVBzHShleQOouQw2qMmK8LzLU1khSbSAl9JsdD6SjCYGxTEicO7-X-1i1NDBoCrn-AaC3HsVcqrrw8f7fOARH9bF6V2fOXcDChOwHtjbZk0g-icA4KcNcHGG-OjD31Q4fCGqTNxyER7pdfqKkOL7CHncKj1RyqCwX4kfjvWQA-SgRkxMEmp2UOhjnCQry2YJIJwGgb57wOQVog8KmER_NGRtSY7lcN4JifLolalkiEsHHfFbso-WRbfkU349JADoDy9Q-ECP5e5nm5QlZuXZzLVqRK0w_qjhcvrPuKE8MOSkaKIvQ0EvcUq0NqMUokZ3CC3sPZovYakl97gHn3GuWtWQas6jAB_ndB3_M2myPgikE2UCNYSoweRGuMgyWB-5-0RNTGx6EXzoxMK7Xpe4F585t6AAjsjH8ggK7z55w2tcMV7dM5Pqa68tFfE_pfwpMrYn8IRRvOXoEIfRgqhRlE",
      e: "AQAB",
      use: "sig",
      kid: "3K3oSRFOziKj7c9TC63RJYaMzby8QDFW3UxWSxiJb_U",
      qi: "D30NIe-W2cYXRlyyEcUZ2moLu-sClpoin7BQnlCZ6oCkkpa724UUZ8QnEQ5iXaOI0ZnmWlMcGzNVgHlX9j77oiNT9A94JGK9Wgkee3PNPzMHim8NfLGm-z4cC09kfI-wX7wAQoPV_v8b9Mbx_nLljOz71GqMkpMXMvDclskumWo04UeUO65JoSQxO3dB-EkLBxoGIZbEuZut93hXm6wewAMsoPh3ne0_oSavM5QwA0XOIO9NevH8euJXadbihwvfy4scgsaiXo9HyFmBM5SSa-DvvxyY97wkVItRP2SSNk3E3FoEolITgVPKlyb4Gi-Sl6_lcCPY7Kl4jh6iHhpj1A",
      dp: "t4L_dZFAev11sEmVq8x2nQ9MAzFCs4Nu96x0AatOqngcDybv4n5wGOBI-rEbDPWuraaZQg9GbvOyF5-MEvb_UzOjSlcW4BvYmeaOyuH0FAIn_i3SI5mOeMoDAQoljeSAWqDdIs2KuAa2-RLbvwhhwk-GgPUjFzHs68a5pu09PuzKisVCcTQqbJ-Djm1O4WySB5rla3CQ8pCRpjs8R2xBiaXMBkjMSPxIVALxY321Wv94sn8qXaFVlC1DD7kYpCCJhRtpX3-Ah9wJOYnsczq65uhjLcktIGIksmB0u5nTtbXqKR7tibW1bsGRAgex40FoF59DA8qKKtmB4qood_IvAQ",
      alg: "RS256",
      dq: "puZtiTWhCBS_ybfeM77A9rTaMbn-DB9SjcAHYIzvQ1taQ-U3Q889Hpw12KGcKGVRkFlt-megaoDOPnJA5PSyk4bp8SFcGyICwc5d4M_0hd05GqGj0PERoErtlAVGAKIasmDWRuaOJXUx0lMQipCloL0gqy8sBqkqnver1G_Uy7oIiwlMsJ0gIgt4QkblC1RdT1UVf8GVgN4DjmMeG0nsXMHxsEx6LQ7P9DQP5MXhuumJXjZRmYLFIisoIyPYDA1OSjcGxOkrPnEpb2OHKxRtSMYBQnLU8dvu21eg10ysVKRojRDWYzEq_zF3aK5OLvl-B4ZC4QtkWeIZ2OAAWqhlHQ",
      n: "sQ9V_44gnqWCyh4n7i5qXl9I96uy4CVDp44LkAr-pLdQAHOqBnYwAaMZ6yW5X9CbvNCfor9mq9Af1iI69UWgMYPxd_goCGPQFPl32xxbmhtW2c-t7Pz9SxwWqHKRCiSqBu4Oc4Mo_tQIxQKWLO3HYRj6EKsYytWFQtneSMFTEp6APYr_ehg-4uY749XdDIid-PGJdO5VO5AqIYZ82o45fhJ91uTO4JNqTgXrQIFqSSG7l3fY95rKLQAInpMz_Wv90hP3Mofues0fw-8K98ihiO7TbNWO-XOkJbLkUlvTpx4Hj2Xc5_xx5flnM3jmSubcRx4ydDhMyI8M7rzzdx5se1G3dIdxnAunqkqMXzGFknhBpPo7WZGYpy1oxioSVzataVUfi7PIh0JRxTKUCEMW3O9vAFttcZX8CZ6Nx9B2COr-kIzoybLEVe0DMm_rwX6Qp5AEX3EP6IoWn-zDjj251ggBJI_xWurTuukRuidxVyX8aB05GMb-hzmEivCP9Wk_jEnUIssVyzDOCWlnCtVNUIxqk24TIonBm0bzJkuY3Rv6N2vnOIPaXIn4RzQ5SODSI82CIk_B1EmdD_olpCq8aQnkU5ViWg_0i7t3MCDhxbY-IJ_GK9YbODf-8_crjZF9wFUOLM5W7F6QHH8a6zS7Qlmpnk_vZW_WXasfqVcIO9U"
    },
    passphrase: "123123"
  },
  {
    algorithm: "RS256",
    expiresIn: 86400,
    issuer: "vs-auth",
    keyid: "3K3oSRFOziKj7c9TC63RJYaMzby8QDFW3UxWSxiJb_U",
    header: {
      alg: "RS256",
      kid: "3K3oSRFOziKj7c9TC63RJYaMzby8QDFW3UxWSxiJb_U",
      typ: "JWT"
    },
    mutatePayload: true
  }
);
