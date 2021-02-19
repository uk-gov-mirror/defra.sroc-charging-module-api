'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it, beforeEach } = exports.lab = Lab.script()
const { expect } = Code

// Test helpers
const { DatabaseHelper, GeneralHelper } = require('../support/helpers')
const { LicenceModel } = require('../../app/models')

// Thing under test
const { LicenceService } = require('../../app/services')

describe('Licence service', () => {
  let transaction

  const dummyTransaction = {
    invoiceId: 'f0d3b4dc-2cae-11eb-adc1-0242ac120002',
    billRunId: 'f0d3b4dc-2cae-11eb-adc1-0242ac120002',
    lineAttr1: 'LICENCE_NUMBER',
    customerReference: 'CUSTOMER_REFERENCE',
    chargeFinancialYear: 2021,
    chargeCredit: false,
    chargeValue: 5678
  }

  beforeEach(async () => {
    await DatabaseHelper.clean()

    // We clone the request fixture as our payload so we have it available for modification in the invalid tests. For
    // the valid tests we can use it straight as
    transaction = GeneralHelper.cloneObject(dummyTransaction)
  })

  describe('When a valid transaction is supplied', () => {
    it('creates a licence', async () => {
      const licence = await LicenceService.go(transaction)
      const result = await LicenceModel.query().findById(licence.id)

      expect(result.id).to.exist()
    })

    it('returns correct data', async () => {
      const licence = await LicenceService.go(transaction)

      expect(licence.invoiceId).to.equal(transaction.invoiceId)
      expect(licence.billRunId).to.equal(transaction.billRunId)
      expect(licence.licenceNumber).to.equal(transaction.lineAttr1)
    })
  })

  describe('When a debit transaction is supplied', () => {
    it('correctly calculates the summary', async () => {
      const licence = await LicenceService.go(transaction)

      expect(licence.debitLineCount).to.equal(1)
      expect(licence.debitLineValue).to.equal(transaction.chargeValue)
    })
  })

  describe('When a credit transaction is supplied', () => {
    it('correctly calculates the summary', async () => {
      transaction.chargeCredit = true
      const licence = await LicenceService.go(transaction)

      expect(licence.creditLineCount).to.equal(1)
      expect(licence.creditLineValue).to.equal(transaction.chargeValue)
    })
  })

  describe('When a zero value transaction is supplied', () => {
    it('correctly calculates the summary', async () => {
      transaction.chargeValue = 0
      const licence = await LicenceService.go(transaction)

      expect(licence.zeroLineCount).to.equal(1)
    })
  })

  describe('When a transaction subject to minimum charge is supplied', () => {
    it('correctly sets the subject to minimum charge flag', async () => {
      transaction.subjectToMinimumCharge = true
      const licence = await LicenceService.go(transaction)

      expect(licence.subjectToMinimumChargeCount).to.equal(1)
    })
  })

  describe('When a transaction subject to minimum charge is supplied', () => {
    beforeEach(async () => {
      transaction.subjectToMinimumCharge = true
    })

    it('correctly sets the subject to minimum charge flag', async () => {
      const result = await LicenceService.go(transaction)

      expect(result.subjectToMinimumChargeCount).to.equal(1)
    })

    describe('and the total is needed', () => {
      it('correctly calculates the total for a debit', async () => {
        const firstResult = await LicenceService.go(transaction)
        // We save the invoice with stats to the database as this isn't done by LicenceService
        await LicenceModel.query().update(firstResult)

        const secondResult = await LicenceService.go(transaction)

        expect(secondResult.subjectToMinimumChargeCount).to.equal(2)
        expect(secondResult.subjectToMinimumChargeDebitValue).to.equal(transaction.chargeValue * 2)
      })

      it('correctly calculates the total for a credit', async () => {
        transaction.chargeCredit = true

        const firstResult = await LicenceService.go(transaction)
        // We save the invoice with stats to the database as this isn't done by LicenceService
        await LicenceModel.query().update(firstResult)

        const secondResult = await LicenceService.go(transaction)

        expect(secondResult.subjectToMinimumChargeCount).to.equal(2)
        expect(secondResult.subjectToMinimumChargeCreditValue).to.equal(transaction.chargeValue * 2)
      })
    })
  })

  describe('When two transactions are created', () => {
    it('correctly calculates the summary', async () => {
      const firstResult = await LicenceService.go(transaction)
      // We save the licence with stats to the database as this isn't done by LicenceService
      await LicenceModel.query().update(firstResult)

      const secondLicence = await LicenceService.go(transaction)

      expect(secondLicence.debitLineCount).to.equal(2)
      expect(secondLicence.debitLineValue).to.equal(transaction.chargeValue * 2)
    })
  })
})
