'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, before, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

// For running our service
const { deployment } = require('../../../server')

// Test helpers
const {
  AuthorisationHelper,
  AuthorisedSystemHelper,
  DatabaseHelper
} = require('../../support/helpers')

// Things we need to stub
const JsonWebToken = require('jsonwebtoken')
const { SendCustomerFileService } = require('../../../app/services')

describe('Customers controller', () => {
  let server
  let authToken
  let serviceStub

  before(async () => {
    server = await deployment()
    authToken = AuthorisationHelper.adminToken()

    Sinon
      .stub(JsonWebToken, 'verify')
      .returns(AuthorisationHelper.decodeToken(authToken))

    serviceStub = Sinon
      .stub(SendCustomerFileService, 'go')
  })

  beforeEach(async () => {
    await DatabaseHelper.clean()
    await AuthorisedSystemHelper.addAdminSystem()
  })

  afterEach(async () => {
    Sinon.restore()
  })

  describe('Sending customer files: PATCH /admin/{regimeId}/customers', () => {
    const options = token => {
      return {
        method: 'PATCH',
        url: '/admin/wrls/customers',
        headers: { authorization: `Bearer ${token}` }
      }
    }

    it('returns a 204 response', async () => {
      const response = await server.inject(options(authToken))

      expect(response.statusCode).to.equal(204)
    })

    it('calls GenerateCustomerFileService', async () => {
      await server.inject(options(authToken))

      expect(serviceStub.calledOnce).to.be.true()
    })
  })
})
