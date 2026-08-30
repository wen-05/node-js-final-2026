const { EntitySchema } = require('typeorm')

module.exports = new EntitySchema({
  name: 'CreditPackage', 
  tableName: 'CREDIT_PACKAGE',
  columns: {
    id: {
      primary: true,
      type: 'uuid',
      generated: 'uuid',
      nullable: false,
    },
    name: {
      type: 'varchar',
      length: 50,
      nullable: false,
      unique: true,
    },
    credit_amount: {
      type: 'integer',
      nullable: false,
    },
    price: {
      type: 'integer',
      nullable: false,
    },
    created_at: {
      type: 'timestamp',
      createDate: true,
      nullable: false,
    },
  },
})
