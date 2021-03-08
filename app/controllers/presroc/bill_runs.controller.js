'use strict'

const {
  ApproveBillRunService,
  BillRunStatusService,
  CreateBillRunService,
  GenerateBillRunService,
  GenerateBillRunValidationService,
  SendBillRunReferenceService,
  ViewBillRunService
} = require('../../services')

class BillRunsController {
  static async create (req, h) {
    const result = await CreateBillRunService.go(req.payload, req.auth.credentials.user, req.app.regime)

    return h.response(result).code(201)
  }

  static async view (req, h) {
    const result = await ViewBillRunService.go(req.params.billRunId)

    return h.response(result).code(200)
  }

  static async generate (req, h) {
    await GenerateBillRunValidationService.go(req.app.billRun)
    GenerateBillRunService.go(req.app.billRun, req.server.logger)

    return h.response().code(204)
  }

  static async status (req, h) {
    const result = await BillRunStatusService.go(req.app.billRun)

    return h.response(result).code(200)
  }

  static async approve (req, h) {
    await ApproveBillRunService.go(req.app.billRun)

    return h.response().code(204)
  }

  static async send (req, h) {
    await SendBillRunReferenceService.go(req.app.regime, req.app.billRun)

    return h.response().code(204)
  }

  static async delete (req, h) {
    return h.response().code(204)
  }
}

module.exports = BillRunsController
