const expect = require('chai').expect
const session = require('supertest-session')
const manageServer = require('./manageServer')
let server, authenticatedSession, user, videos

describe('Check authenticated API routes for all models', function() {
  before(function() {
    return manageServer.createHTTPServer().then((s) => {
      (server = s)
    })
  });

  it('should pass through the Dataporten redirect and create a session (GET auth/dataporten/login)', async function() {
    const testSession = session(server)
    return testSession
      .get(`/auth/dataporten/login?organization=uio`)
      .redirects(1)
      .expect(302)
      .then(function() { (authenticatedSession = testSession) })
      // .expect(response => {console.log(response)})
      // .expect(500, done)
  })
  it('should use the created session to obtain my User details (GET api/user)', async function() {
    return authenticatedSession
      .get(`/api/user`)
      .expect(200).then((response) => {
        user = response.body
        expect(response.body.profile.username).to.equal("testuser1")
      })
  })
  it('should get the metadata for all my Videos (GET api/videos)', async function() {
    return authenticatedSession
      .get(`/api/videos`)
      .expect(200)
      .then((response) => {
        // console.log(response.body)
        videos = response.body
        expect(videos.length).to.equal(1)
      })
  })

})

let selectedVideo, selectedShare, annotation1, annotation2

describe('Create, update and remove a Videos Sharing, Annotations, Comments, Status (POST /api/video/share)', function() {
  it('should create a new Share', async function() {
    selectedVideo = videos[0]
    return authenticatedSession
      .post(`/api/video/share`)
      .query({ id: selectedVideo.details.id })
      .expect(200)
      .then((response) => {
        // console.log(response.body)
        selectedShare = response.body
        expect(selectedShare.creator).to.equal(user.profile.ltiID)
        expect(selectedShare._id).to.exist
      })
  })
  it('should create a new Annotation in the Share (POST api/video/share/annotation)', async function() {
    annotation1 = {
      created: new Date(),
      creator: user.profile.ltiID,
      comment: '1st test annotation',
      time: [0, 0.5]
    }
    return authenticatedSession
      .post(`/api/video/share/annotation`)
      .query({ videoID: selectedVideo.details.id, shareID: selectedShare._id })
      .send(annotation1)
      .expect(200)
      .then((response) => {
        //console.log(response.body)
        annotation1 = response.body
        expect(response.body.creator).to.equal(user.profile.ltiID)
      })
  })
  it('should create a second Annotation in the Share (POST /api/video/share/annotation)', async function() {
    annotation2 = {
      created: new Date(),
      creator: '2',
      comment: '2nd test annotation',
      time: [0.5, 1]
    }
    return authenticatedSession
      .post(`/api/video/share/annotation`)
      .query({ videoID: selectedVideo.details.id, shareID: selectedShare._id })
      .send(annotation2)
      .expect(200)
      .then((response) => {
        //console.log(response.body)
        annotation2 = response.body
        expect(response.body.creator).to.not.equal(user.profile.ltiID)
      })
  })
  it('should update the second Annotation (PUT /api/video/share/annotation)', async function() {
    const newComment = 'UPDATED 2nd test annotation'
    annotation2.comment = newComment
    return authenticatedSession
      .put(`/api/video/share/annotation`)
      .query({ videoID: selectedVideo.details.id, shareID: selectedShare._id, annotationID: annotation2._id })
      .send(annotation2)
      .expect(200)
      .then((response) => {
        //console.log(response.body)
        expect(response.body.comment).to.equal(newComment)
      })
  })

  it('should update a video details', async () => {
    // Body should be Video Detail
    const copy = {...selectedVideo.details}
    copy.name = 'test'
    return authenticatedSession
    .put(`/api/video/details`)
    .query({ id: selectedVideo.details.id})
    .send(copy)
    .expect(200)
    .then((response) => {
      console.log(response.body)
      expect(response.body.name).to.equal('test')
    })
  })

  after(function() {
    return manageServer.stopHTTPServer()
  });
})
