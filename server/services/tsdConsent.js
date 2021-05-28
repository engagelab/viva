const tsdAPI_key = process.env.TSD_API_KEY
const fs = require('fs');
const utilities = require('../routing/utilities');


const tsdAuth = tsd => {
    const data = JSON.stringify({
        user_name: tsd.username,
        otp: tsd.otp,
        password: tsd.passord
    })

    // const tsdAPI_key = '' // <-------  SM: This const was previously undefined, breaking the server at runtime

    const options = {
        hostname: 'api.tsd.usit.no',
        path: `/v1/p917/auth/tsd/token?type=import`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${tsdAPI_key}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }
    return utilities.httpRequest(options, data)
}
const tsdImportDataset = (tsd) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.tsd.usit.no',
            path: '/v1/p917/files/stream/vivaTestDataset.json?group=p917-member-group',
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${tsd.importToken}`,
                'Content-Type': 'application/octet-stream',

            }
        }
        fs.readFile('testData.json', { encoding: 'utf8' }, function (err, data) {
            // Use the 'data' string here.
            utilities.httpRequest(options, data).then(res => resolve(res)).catch(e => {
                reject(e);
            });

        })

    })
}
const jsonToFile = (tsd) => {
    const jsonString = JSON.stringify(tsd.datasett);
    fs.writeFile('./testData.json', jsonString, err => {
        if (err) {
            console.log('Error writing file', err)
        } else {
            console.log('Successfully wrote file')
            tsdImportDataset(tsd);
        }
    })
}

//  Login & import subsett into TSD
const createConsent = (tsd, error, successCallback) => {
    tsdAuth(tsd.user).then(token => {
        /* Should return a short lived Token which allow application to import data to TSD */
        tsd.importToken = token.token;
        jsonToFile(tsd);

    })
    error('error')
    successCallback('success')
}

const fetchConsent = (query) => {
    //let queryString = `${query.datasettId}`;
    // const regex1 = /,/gi;
    // queryString = queryString.replace(regex1, '.');
    // const regex = /:/gi;
    // queryString = queryString.replace(regex, '-');
    const data = JSON.stringify({
        reference: { "dataset": query.datasettId }
    })
    const options = {
        hostname: 'api.tsd.usit.no',
        path: `/v1/p01/consent/external/${query.formId}/verify`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${query.token}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }

    return utilities.httpRequest(options, data).catch(error => {
        // const r = Promise.reject(error)
        console.log(error)
    })
}

const tsdAuthDataporten = tsd => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            idtoken: tsd.user.tokens.id_token
        })
        const options = {
            hostname: 'api.tsd.usit.no',
            path: `/v1/p01/auth/dataporten/token?type=consquery`,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${tsdAPI_key}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }
        utilities.httpRequest(options, data).then(res => resolve(res)).catch(e => {
            reject(e);
        });
    })

}
// Method to export consents from TSD
const exportConsent = (tsd, error, successCallback) => {
    tsdAuthDataporten(tsd).then(shortlivedToken => {
        fetchConsent({
            datasettId: tsd.datasettId,
            utvalg: tsd.utvalg,
            formId: tsd.formId,
            token: shortlivedToken.token
        })
            .then(consents => {
                let utvalg = tsd.utvalg;
                const regex1 = /,/gi;
                utvalg= decodeURIComponent(utvalg)
                utvalg = utvalg.replace(regex1, '.');
                const regex = /:/gi;
                utvalg = utvalg.replace(regex, '-');
                if ((utvalg.length > 0) && (utvalg.slice(-1) != '.')) utvalg = utvalg + '.';
                let filteredConsents = [];
                if (consents.length != 0) {
                    filteredConsents = consents.filter(consent => {
                        if (consent.reference.subset.slice(-1) != '.') {
                            consent.reference.subset=consent.reference.subset+'.'
                        }
                        if (consent.reference.subset == utvalg && consent.current == true)
                            return consent
                    })
                }
                successCallback(filteredConsents ? filteredConsents : [])
            })
    }).catch(err => {
        error(err)
    })


}
module.exports = {
    createConsent,
    exportConsent,
}
