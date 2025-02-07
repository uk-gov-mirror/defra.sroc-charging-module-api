'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, before, beforeEach, after } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const { deployment } = require('../../../server')

// Test helpers
const {
  AuthorisationHelper,
  AuthorisedSystemHelper,
  DatabaseHelper,
  GeneralHelper
} = require('../../support/helpers')

// Things we need to stub
const JsonWebToken = require('jsonwebtoken')

describe('Authorised systems controller', () => {
  let server
  let authToken

  before(async () => {
    server = await deployment()
    authToken = AuthorisationHelper.adminToken()

    Sinon
      .stub(JsonWebToken, 'verify')
      .returns(AuthorisationHelper.decodeToken(authToken))
  })

  beforeEach(async () => {
    await DatabaseHelper.clean()
    await AuthorisedSystemHelper.addAdminSystem()
  })

  after(async () => {
    Sinon.restore()
  })

  describe('Listing authorised systems: GET /admin/authorised-systems', () => {
    const options = token => {
      return {
        method: 'GET',
        url: '/admin/authorised-systems',
        headers: { authorization: `Bearer ${token}` }
      }
    }

    describe('When there are authorised systems', () => {
      beforeEach(async () => {
        await AuthorisedSystemHelper.addSystem('1234546789', 'system1')
        await AuthorisedSystemHelper.addSystem('987654321', 'system2')
        await AuthorisedSystemHelper.addSystem('5432112345', 'system3')
      })

      it('returns a list of them', async () => {
        const response = await server.inject(options(authToken))

        const payload = JSON.parse(response.payload)

        expect(response.statusCode).to.equal(200)
        expect(payload.length).to.equal(4)
        expect(payload[1].name).to.equal('system1')
      })
    })

    describe("When there is only the 'admin' system", () => {
      it('returns just it', async () => {
        const response = await server.inject(options(authToken))

        const payload = JSON.parse(response.payload)

        expect(response.statusCode).to.equal(200)
        expect(payload.length).to.equal(1)
        expect(payload[0].name).to.equal('admin')
      })
    })
  })

  describe('Show authorised system: GET /admin/authorised-systems/{id}', () => {
    const options = (id, token) => {
      return {
        method: 'GET',
        url: `/admin/authorised-systems/${id}`,
        headers: { authorization: `Bearer ${token}` }
      }
    }

    describe('When the authorised system exists', () => {
      it('returns a match', async () => {
        const authorisedSystem = await AuthorisedSystemHelper.addSystem('1234546789', 'system1')

        const response = await server.inject(options(authorisedSystem.id, authToken))
        const payload = JSON.parse(response.payload)

        expect(response.statusCode).to.equal(200)
        expect(payload.name).to.equal('system1')
      })
    })

    describe('When the authorised system does not exist', () => {
      it("returns a 404 'not found' response", async () => {
        const id = GeneralHelper.uuid4()
        const response = await server.inject(options(id, authToken))

        const payload = JSON.parse(response.payload)

        expect(response.statusCode).to.equal(404)
        expect(payload.message).to.equal(`No authorised system found with id ${id}`)
      })
    })
  })

  describe('Adding an authorised system: POST /admin/authorised-systems', () => {
    const options = (token, payload) => {
      return {
        method: 'POST',
        url: '/admin/authorised-systems',
        headers: { authorization: `Bearer ${token}` },
        payload: payload
      }
    }

    it("adds a new authorised system and returns its details including the 'id'", async () => {
      const requestPayload = {
        clientId: 'i7rnixijjrawj7azzhwwxxxxxx',
        name: 'olmos',
        status: 'active',
        authorisations: ['wrls']
      }

      const response = await server.inject(options(authToken, requestPayload))
      const responsePayload = JSON.parse(response.payload)

      expect(response.statusCode).to.equal(201)
      expect(responsePayload.id).to.exist()
      expect(responsePayload.clientId).to.equal(requestPayload.clientId)
    })

    it('will not add an authorised system with invalid data', async () => {
      const requestPayload = {
        clientId: '',
        name: 'olmos',
        status: 'active',
        authorisations: ['wrls']
      }

      const response = await server.inject(options(authToken, requestPayload))

      expect(response.statusCode).to.equal(422)
    })
  })
})
