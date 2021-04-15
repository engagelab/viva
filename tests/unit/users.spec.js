/* eslint-disable no-undef */
const request = require('supertest')
const app = require('../../app')

const server = request.agent(app)

describe('Authenticate as Dataporten and log in a test user', () => {
  it('should pass through the Dataporten redirect and create a session', async () => {
    const response = await server
      .get(`/auth/dataporten/callback`)
      .query({ testing: 'true' })
      .redirects(1)
      .expect(302)
    console.log(response.body)
    expect(response.body.status.quecount).toBe(quecount + 1)
  })
})
