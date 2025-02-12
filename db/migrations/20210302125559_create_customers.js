'use strict'

const tableName = 'customers'

exports.up = async function (knex) {
  await knex
    .schema
    .createTable(tableName, table => {
      // Primary Key
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))

      // Data
      table.uuid('regime_id').notNullable()
      table.string('region').notNullable()
      table.string('customer_reference').notNullable()
      table.string('customer_name').notNullable()
      table.string('address_line_1').notNullable()
      table.string('address_line_2')
      table.string('address_line_3')
      table.string('address_line_4')
      table.string('address_line_5')
      table.string('address_line_6')
      table.string('postcode')

      // Automatic timestamps
      table.timestamps(false, true)
    })

  await knex.raw(`
    CREATE TRIGGER update_timestamp
    BEFORE UPDATE
    ON ${tableName}
    FOR EACH ROW
    EXECUTE PROCEDURE update_timestamp();
  `)
}

exports.down = async function (knex) {
  return knex
    .schema
    .dropTableIfExists(tableName)
}
