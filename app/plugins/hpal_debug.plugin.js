'use strict'

/**
 * Plugin that adds debugging tools for the hpal CLI
 *
 * hpal-debug was designed to help you,
 *
 * - display information about your routes in a neat, customizable table.
 *  - `hpal run debug:routes --show cors`
 *
 * - use your hapi server, models, services, etc. interactively through a REPL.
 *  - `hpal run debug:repl`
 *
 * - hit your routes from the command line without having to restart your server.
 *  - `hpal run debug:curl post /user --name Pal -v`
 *
 * {@link https://github.com/hapipal/hpal-debug}
 * {@link https://github.com/hapipal/hpal}
 *
 * @module HpalDebug
 */

const HpalDebug = require('hpal-debug')

module.exports = HpalDebug
