/* eslint-disable no-undef */
const session = require('supertest-session')
const manageServer = require('./manageServer')
let server, authenticatedSession, user, videos

beforeAll(() => {
  // Create the server after the database has connected
  return manageServer.createHTTPServer().then((s) => {
    (server = s)
  })
});

afterAll(() => {
  return manageServer.stopHTTPServer()
});

describe('Authenticate as Dataporten, create a session and get user information', () => {
  it('should pass through the Dataporten redirect and create a session', async () => {
    const testSession = session(server)
    return testSession
      .get(`/auth/dataporten/login?organization=uio`)
      .redirects(1)
      .expect(302)
      .then(() => (authenticatedSession = testSession))
      // .expect(response => {console.log(response)})
      // .expect(500, done)
  })
  it('should use the created session to obtain my User details', async () => {
    return authenticatedSession
      .get(`/api/user`)
      .expect(200).then((response) => {
        user = response.body
        expect(response.body.profile.username).toBe("testuser1")
      })
  })
  it('should get the metadata for all my Videos', async () => {
    return authenticatedSession
      .get(`/api/videos`)
      .expect(200)
      .then((response) => {
        // console.log(response.body)
        videos = response.body
        expect(videos.length).toBeGreaterThan(0)
      })
  })
})

let selectedVideo, selectedShare, annotation

describe('Create, update and remove a Videos Sharing, Annotations, Comments, Status', () => {
  it('should create a new Share', async () => {
    selectedVideo = videos[0]
    return authenticatedSession
      .post(`/api/video/share`)
      .query({ id: selectedVideo.details.id })
      .expect(200)
      .then((response) => {
        // console.log(response.body)
        selectedShare = response.body
        expect(selectedShare.creator).toBe(user.profile.ltiID)
      })
  })
  it('should create a new Annotation in the Share', async () => {
    annotation = {
      created: new Date(),
      creator: user.profile.ltiID,
      comment: '1st test annotation',
      time: [0, 0.5]
    }
    return authenticatedSession
      .post(`/api/video/share/annotation`)
      .query({ videoID: selectedVideo.details.id, shareID: selectedShare._id })
      .send(annotation)
      .expect(200)
      .then((response) => {
        console.log(response.body)
        expect(response.body.creator).toBe(user.profile.ltiID)
      })
  })
})
