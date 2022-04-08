
1) redirect to new server. This involves that the registrar changes your CNAME or A record to reflect the new server (It's best to use a CNAME and attach it to the canonical name of your server (i.e making a server alias))

2) On the time of writing this document, node v 16. on server and npm 8 should be installed on the new appserver. For future refrence, please refer to https://endoflife.date/nodejs to check for the latest stable version (Stable versions are denoted in even numbers). 

Install the most recent even numbered version of Node and associated NPM. 

- On red hat 7: Add nodesource with the intended version of node to the repolist, then install with sudo yum install --diseblerepo "*" --enablerepo "nodesource" nodejs
(This ensures that other repos containing older versions of node are disabled and not confused with the newer version from nodesource repo at the time of installation)
- On red hat 8: The simplest would probably be to install from app stream by sudo dnf module install nodejs (Appstream versions on red hat 8 usually have more recent versions of node, without having to add another repo specifically). 

3) viva server code update, build and run to reflect server move. 

4) mobile app code update to appstore to reflect server move. Post app udpate to Appstore. 

5) Set lagringshotell to new unix path on the new appserver in the .env file. 

6) new canvas LTI keys. The Canvas group at UiO Can provide new LTI keys. 
They need the following info:

- URIer for redirect, e.g: https://engagelab.uio.no/viva/auth/canvas/callback
- Uri target, e.g: https://engagelab.uio.no/viva
- OpenID Connect initiation URI, e.g: https://engagelab.uio.no/viva/auth/canvas/login
- Public JWK ULR, e.g: https://engagelab.uio.no/.well-known/testing/jwks.json

7) Check that new server has IP access to viva s3 bucket. Keep in mind that buckets that are classified to hold red data is also whitelisted by an ip adress. 

8) Ensure .pem certificates are located in /etc/certificates and rebuild code to pick up these certificates. Then run new code. 

9) Todo for the future: Generate a public/private asymetric keypair, put them in an accessible location on our server. (Such as a .challenge/ directory on the webroot of the web hosting software that serves your static content). We need to talk to Tore whether to have the public key on their end or if it's possible to have the public key on our web server too. 