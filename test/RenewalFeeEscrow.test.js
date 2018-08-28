const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

require('chai').should()

const expectEvent = require('./helpers/expectEvent.js')
const { assertRevert } = require('./helpers/assertRevert.js')

contract('RenewalFeeEscrow', (accounts) => {

  let subnetDAO = accounts[9]
  let subnetDAOTwo = accounts[8]
  let contract

  describe('New bill', function() {

    beforeEach(async function() {
      contract = await RenewalFeeEscrow.new(subnetDAO)
    })

    it('Adds a new bill to mapping', async function() {

      let txn = {
        from: accounts[0],
        value: 1*(10**18) // 1 ether
      }

      const receipt = await contract.addBill(subnetDAO, 1*(10**10), txn)
      const event = await expectEvent.inLogs(receipt.logs, 'NewBill', { 
        payer: accounts[0],
        collector: accounts[9]
      })
      event.args.payer.should.eql(accounts[0])
      event.args.collector.should.eql(subnetDAO)
    })

    it('Will not replace an exsting bill', async function() {
      await contract.addBill(subnetDAO, 1*(10**10), {from: accounts[0], value: 1*(10**18)})
      assertRevert(contract.
        addBill(subnetDAO, 2*(10**10), {from: accounts[0], value: 2*(10**18)})
      )
    })

  })

  describe('Collect SubnetFees', async () => {
    before('Generate some bills', async () => {
      let txn = {
        from: accounts[0],
        value: 1*(10**18) // 1 ether
      }
      await contract.addBill(subnetDAO, 1*(10**10), txn)

    })
  })
})
