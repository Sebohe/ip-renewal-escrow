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

  describe('collectSubnetFees', async () => {

    let txnCount
    beforeEach(async() => {
      contract = await RenewalFeeEscrow.new(subnetDAO)
      await contract.addBill(subnetDAO, 1*(10**10), {from: accounts[0], value: 1*(10**18)})
      await contract.addBill(subnetDAOTwo, 1*(10**9), {from: accounts[0], value: 1*(10**15)})

      let min = Math.ceil(16)
  		let max = Math.floor(4)
  		txnCount = Math.floor(Math.random() * (max - min)) + min
			//Generate some fake blocks
      for (var i; i <= txnCount; i++) {
        await RenewalFeeEscrow.new(subnetDAO)
      }
    })

    it(`Revert when Subnet doesn't have subscribers`, async () => {
    })

    it('Subnet should have an expected ballance of all of its bills', async () => {
    })

    it('Account of bill should be zero when it cant afford', async () => {
    })

    it('Set the account of bill to zero when it cant afford', async () => {
    })

    it('Bill should have lastUpdated with same blockNumber as latest block', async () => {
    })


  })

  describe('payMyBills', async () => {

    let txnCount
    beforeEach(async() => {
      contract = await RenewalFeeEscrow.new(subnetDAO)
      await contract.addBill(subnetDAO, 1*(10**10), {from: accounts[0], value: 1*(10**18)})
      await contract.addBill(subnetDAOTwo, 1*(10**9), {from: accounts[0], value: 1*(10**15)})

      let min = Math.ceil(16)
  		let max = Math.floor(4)
  		txnCount = Math.floor(Math.random() * (max - min)) + min
			//Generate some fake blocks
      for (var i; i <= txnCount; i++) {
        await RenewalFeeEscrow.new(subnetDAO)
      }
    })

    it('Subscriber should have each of the bills with an expect amount', async () => {
    })

    it('Bill should have lastUpdated with same blockNumber', async () => {
    })

  })
})
