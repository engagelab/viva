# Canvas LTI Configuration
## Use of JSON Web Tokens / Keys

Generate new keys here: https://mkjwk.org
Settings:
* RSA
* 2048 key size
* Signature type
* RS256 algorithm
* SHA-256 key ID

(show x.509): YES

Copy JSON public key and paste to file `server/canvas/.well-known/jwks.json` for server to share here: https://<slplusServerAddress>/canvas/.well-known/jwks.json
Also copy 'cert' PEM string and paste to file `server/canvas/.well-known/cert.pem` for server to share
Finally copy the 'private' PEM string to a file outside the repository, referenced in .env as JWK_PRIVATE_KEY_FILE

## Set up Canvas LTI (LTI v1.3)

Start with the [Canvas doc describing LTI v1.3 setup](https://canvas.instructure.com/doc/api/file.oauth.html)

We are attempting to follow the Canvas OpenID [documentation here](https://canvas.instructure.com/doc/api/file.lti_dev_key_config.html)
Canvas LTIs support OpenID "Third party flow" [described here](https://openid.net/specs/openid-connect-core-1_0.html#ThirdPartyInitiatedLogin)

Connect Initiation URL: `https://engagelab.uio.no/classroom-simulator/auth/canvas/login`
Target Link URI:  `https://engagelab.uio.no/classroom-simulator`
Redirect URI: `https://engagelab.uio.no/classroom-simulator/auth/canvas/callback`

The documentation expects Canvas to call the "Connect Initiation URI" with the following params:
   `iss`,
   `login_hint`
   `target_link_uri` (**configured on the Developer key**)

Our LTI is then expected to call an authentication route ("OIDC Authorization end-point") at Canvas:

* We found this address, but is it correct?
   `https://uio.instructure.com/api/lti/authorize`

* We are expected to include the following params:
   `redirect_uri` (**configured on the developer key**),
   `client_id`    (**matches the developer key**),
   `login_hint`   (matching the one just sent by Canvas),
   `state`

Finally, Canvas must verify `client_id` & `redirect_uri`, and if correct responds by calling `redirect_uri` including the param: `id_token`
