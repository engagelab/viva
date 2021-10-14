const expect = require('chai').expect
const session = require('supertest-session')
const manageServer = require('./manageServer')
let server, authenticatedSession, user, videos

describe('Check authenticated API routes for all models', function () {
  before(function () {
    return manageServer.createHTTPServer(8000).then((s) => {
      server = s
    })
  })
  it('should pass through the Dataporten redirect and create a session (GET auth/dataporten/login)', async function () {
    const testSession = session(server)
    return testSession
      .get(`/auth/dataporten/login?organization=uio&device=webApp&client=admin`)
      .redirects(1)
      .expect(302)
      .then(function () {
        authenticatedSession = testSession
      })
  })
  it('should use the created session to obtain my User details (GET api/user)', async function () {
    return authenticatedSession
      .get(`/api/user`)
      .expect(200)
      .then((response) => {
        user = response.body
        //console.log(response)
        expect(response.body.profile.username).to.equal('testadmin1')
      })
  })
  it('should get the datasets for the current user (GET api/datasets)', async function () {
    return authenticatedSession
      .get('/api/datasets')
      .expect(200)
      .then((response) => {
        /*let dataset = response.body.find((dataset) => dataset.name == body.name)
        if (dataset) {
          console.log('Duplicate')
        }*/
        expect(response.body).to.not.equal(0)
      })
  })

  let body

  it('should create a dataset for the current user (POST api/dataset)', async () => {
    body = {
      name: 'testdatasetSM',
    }
    /*return authenticatedSession

       .get('/api/datasets')
      .expect(200)
      .then((err, response) => {
       let dataset = response.body.find((dataset) => dataset.name == body.name)
        if (dataset) {
          console.log('Duplicate')
          done(err)
        } else {
          return authenticatedSession
            .post('/api/dataset')
            .send(body)
            .expect(400)
            .then((response, err) => {
              console.log(response.body)
              body = response.body
            })*/
          return authenticatedSession
            .post('/api/dataset')
            .send(body)
            .expect(400)
            .then((response) => {
            console.log(JSON.stringify(response.body))
            //console.log(response.body)
            body = response.body
            expect(response.body.error).to.equal('Name must be unique')
            })
        })
    it('should respond with draft videos from  user accounts (GET/users/drafts)', async () => {
      return authenticatedSession
      .get('/api/users/drafts')
      .expect(200)
      .then((response) => {
        //console.log(response)
        //console.log(response.videos + 'bvhbfj')
        let draftIDs = response.body
        //expect(response.videos.draftIDs.length).to.equal(0)
      })
    })


  after(function () {
    return manageServer.stopHTTPServer()
  })
})
