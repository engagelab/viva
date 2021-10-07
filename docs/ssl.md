# Creating a local trusted certificate

Easiest way: Use mkcert

  https://github.com/FiloSottile/mkcert

  Follow directions on this site, and don't forget to copy the root certificate to the mobile device, and trust it

iOS and Android require the root CA certificate installed to allow HTTPS requests to succeed
Follow instructions for mobile devices at [mkcert](https://github.com/FiloSottile/mkcert)

iOS:
* Find the root CA using `mkcert -CAROOT`
* Airdrop the root CA to the ipad/iphone, enable the profile, then also enable "full trust" in Settings > About > Certificate Trust Settings

Android:
* Find the root CA using `mkcert -CAROOT`
* Host the .pem certificate in the server's /public folder and access it from the tablet e.g `https://SERVER_ADDRESS:8000/mkcert.pem`


Alternative:

1. Create a CA in keychain
2. Use keychain to generate a certificate from the CA
3. Export public key as .cer and private key as .p12
4. Convert keys to PEM for NodeJS
  `openssl pkcs12 -clcerts -nokeys -out privatekey.pem -in privatekey.p12`
  `openssl x509 -inform der -in certificate.cer -pubkey -noout > certificate.pem`
5. assign the certificate and private key to Node https server (see server.js)
6. send the public key to iOS (via airdrop), install it in Settings > Profile
7. trust it in Settings > About > Certificate Trust Settings

New Apple guidelines for SSL trust:
https://support.apple.com/en-us/HT210176

See here:
https://blog.arrogantrabbit.com/ssl/Root-CA-macOS/#creating-certificate-issued-from-this-authority
and
https://medium.com/collaborne-engineering/self-signed-certificates-in-ios-apps-ff489bf8b96e
