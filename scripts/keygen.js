/**
 * Generate private-public key pairs for registered headless service
 * authentication. See src/signatureAuth.ts for more details.
 */
const crypto = require('crypto')

const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
})

console.log(publicKey)
console.log(privateKey)

const data = { "text": "how now brown cow" }
const dataString = JSON.stringify(data)
console.log(dataString)
console.log(crypto.sign(null, dataString, privateKey).toString('base64'))
