'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

// Test helpers
const {
  AuthorisedSystemHelper,
  BillRunHelper,
  DatabaseHelper,
  GeneralHelper,
  RegimeHelper,
  TransactionHelper
} = require('../support/helpers')
const { TransactionModel } = require('../../app/models')
const { ValidationError } = require('joi')

const { presroc: requestFixtures } = require('../support/fixtures/create_transaction')
const { presroc: chargeFixtures } = require('../support/fixtures/calculate_charge')

// Things we need to stub
const { RulesService } = require('../../app/services')

// Thing under test
const { CreateTransactionService } = require('../../app/services')

describe('Create Transaction service', () => {
  let billRun
  let authorisedSystem
  let regime
  let payload

  beforeEach(async () => {
    await DatabaseHelper.clean()
    regime = await RegimeHelper.addRegime('wrls', 'WRLS')
    authorisedSystem = await AuthorisedSystemHelper.addSystem('1234546789', 'system1', [regime])
    billRun = await BillRunHelper.addBillRun(authorisedSystem.id, regime.id)

    // We clone the request fixture as our payload so we have it available for modification in the invalid tests. For
    // the valid tests we can use it straight as
    payload = GeneralHelper.cloneObject(requestFixtures.simple)
  })

  afterEach(async () => {
    Sinon.restore()
  })

  describe('When the data is valid', () => {
    let transaction
    let result

    beforeEach(async () => {
      Sinon.stub(RulesService, 'go').returns(chargeFixtures.simple.rulesService)
      transaction = await CreateTransactionService.go(payload, billRun, authorisedSystem, regime)
      result = await TransactionModel.query().findById(transaction.transaction.id)
    })

    it('creates a transaction', async () => {
      expect(result.id).to.exist()
    })
  })

  describe('When the data is invalid', () => {
    describe("because the 'payload' is invalid", () => {
      describe("due to an item validated by the 'transaction'", () => {
        it('throws an error', async () => {
          payload.customerReference = ''

          const err = await expect(
            CreateTransactionService.go(payload, billRun, authorisedSystem, regime)
          ).to.reject(ValidationError)

          expect(err).to.be.an.error()
        })
      })

      describe("due to an item validated by the 'charge'", () => {
        it('throws an error', async () => {
          payload.periodStart = '01-APR-2021'

          const err = await expect(
            CreateTransactionService.go(payload, billRun, authorisedSystem, regime)
          ).to.reject(ValidationError)

          expect(err).to.be.an.error()
        })
      })
    })

    describe("because the request is for a duplicate transaction (matching clientId's)", () => {
      beforeEach(async () => {
        Sinon.stub(RulesService, 'go').returns(chargeFixtures.simple.rulesService)
      })

      it('throws an error', async () => {
        payload.clientId = 'DOUBLEIMPACT'

        // Add the first transaction
        await TransactionHelper.addTransaction(billRun.id, { regimeId: regime.id, clientId: 'DOUBLEIMPACT' })

        // Attempt to add a transaction with a duplicate clientId
        const err = await expect(
          CreateTransactionService.go(payload, billRun, authorisedSystem, regime)
        ).to.reject()

        expect(err).to.be.an.error()
      })
    })
  })
})
