const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

require('chai').should()

const expectEvent = require('./helpers/expectEvent.js')

contract('RenewalFeeEscrow', (accounts) => {

  let subnetDAO = accounts[9]
  let contract
  beforeEach(async function() {
    contract = await RenewalFeeEscrow.deployed()
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
})
