/* Upload trackings to TSD using instances
These instances are created in TSD . */
/* TSD Credentials, the group name and instanceID will be set from FrontEnd
 */
const fs = require('fs');
const utilities = require('../routing/utilities');
const FormData = require('form-data')
const https= require('https')
const TSDCredentials={
 tsdAPI_key: process.env.TSD_API_KEY,
  projectNo:process.env.TSD_PROJECT_NO,
  group :process.env.TSD_PROJECT_GROUP,
instanceID:process.env.TSD_INSTANCE_ID
}




const readStream = fs.createReadStream('./image.jpg');

const form = new FormData();
form.append('image', readStream);
form.append('firstName', 'Marcin');
form.append('lastName', 'Wanago');






/* TSD authentication using the API key, instance ID and group  */
const gettoken = () => {
    const data = JSON.stringify({
        id: TSDCredentials.instanceID,
    })
return new Promise((resolve , reject)=>{
    const options = {
        hostname: 'api.tsd.usit.no',
        path: `/v1/all/auth/instances/token?type=import`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${TSDCredentials.tsdAPI_key}`,
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    }
   utilities.httpRequest(options, data).
    then(res=>resolve (res.token)).
    catch(e=> reject(e))
  })
}
const TSDImportData = (instanceToken) => {
    return new Promise((resolve, reject) => {
      const readable = fs.createReadStream('/Users/sharanya/Projects/slplus/server/services/image.jpg');

        const options = {
            hostname: 'api.tsd.usit.no',
            path: `/v1/${TSDCredentials.projectNo}/files/stream/trackings?group=${TSDCredentials.group}`,
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${instanceToken}`
              //  'Content-Type' : 'multipart/form-data'
            },
          //   formData: {
          //     api_password: "abc123",
          //     file: readable,
          //     contentType: 'image/jpeg',
          // }
          }

        //  // fs.readFile('/Users/sharanya/Projects/slplus/server/services/image.jpg', { encoding: 'utf8' }, function (err, data) {
        //       // Use the 'data' string here.
        //  //     if (err) console.log(err)
        //       utilities.httpRequest(options).
        //       then(res => resolve(res)).
        //       catch(e =>    reject(e));
        //     })
https.request(options)
    .pipe(readable)
    .on('finish', function() {
      console.log('Done downloading, encrypting, and saving!');
      resolve();

});

})
}

/* Iterate over the formData.entries to post the audio and video file to TSD*/
// const jsonToFile = () => {
//   return new Promise ((resolve ,reject )=>{
//     const testString='test'
//     fs.writeFile('./testData.json', testString, err => {
//       if (err) {
//           console.log('Error writing file', err)
//           reject(err)
//       } else {
//          resolve('Successfully wrote file')
//       }
//   })
// })
// }

//  TSD Authentication and post Data into TSD
const importToTSD  =  () => {
return new Promise ((resolve,reject) =>{
  gettoken().then ((token )=>{
    console.log(token);
    TSDImportData(token).then((response)=>{
      console.log(response)
      resolve(response)
    })
  }).catch((error)=>{
    console.log(error)
    reject (error)
  })
})
  }


module.exports = {
  importToTSD,
}
