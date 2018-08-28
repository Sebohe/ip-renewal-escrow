const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

require('chai').use(require('chai-bignumber')(web3.bigNumber)).should()

const expectEvent = require('./helpers/expectEvent.js')
const { assertRevert } = require('./helpers/assertRevert.js')

contract('RenewalFeeEscrow', (accounts) => {

  let subnetDAO = accounts[accounts.length-1]
  let subnetDAOTwo = accounts[accounts.length-2]
  let contract

  describe('newBill', async () => {

    beforeEach(async () => {
      contract = await RenewalFeeEscrow.new(subnetDAO)
    })

    it('Adds a new bill to mapping', async () => {

      const receipt = await contract.addBill(
        subnetDAO, 1*(10**10), {from: accounts[0], value: 1*(10**18)}
      )
      const event = await expectEvent.inLogs(receipt.logs, 'NewBill', { 
        payer: accounts[0],
        collector: accounts[9]
      })
      event.args.payer.should.eql(accounts[0])
      event.args.collector.should.eql(subnetDAO)
    })

    it('Will not replace an exsting bill', async () => {
      await contract.addBill(subnetDAO, 1*(10**10), {from: accounts[0], value: 1*(10**18)})
      assertRevert(contract.
        addBill(subnetDAO, 2*(10**10), {from: accounts[0], value: 2*(10**18)})
      )
    })
  })

  describe('getCountOfSubscribers and getCountOfCollectors', async () => {

    let min = Math.ceil(7)
    let max = Math.floor(2)
    let subnetDAOUsers = Math.floor(Math.random() * (max - min)) + min
    let subnetDAOTwoUsers = Math.floor(Math.random() * (max - min)) + min

    beforeEach(async () => {

      contract = await RenewalFeeEscrow.new(subnetDAO)

      for (let i = 0; i < subnetDAOUsers; i++) {
        await contract.addBill(subnetDAO, 1*(10**10), {from: accounts[i], value: 1*(10**18)})
      }
      for (let i = 0; i < subnetDAOTwoUsers; i++) {
        await contract.addBill(subnetDAOTwo, 1*(10**10), {from: accounts[i], value: 1*(10**18)})
      }
    })

    it('Should have the right length', async () => {
      let subscribers = await contract.getCountOfSubscribers(subnetDAO)
      subscribers.toNumber().should.eql(subnetDAOUsers)

      let subscribersTwo = await contract.getCountOfSubscribers(subnetDAOTwo)
      subscribersTwo.toNumber().should.eql(subnetDAOTwoUsers)
    })

    it('Each user should have the right amount of collectors', async () => {

      let smallerDAO
      let biggerDAO
      if (subnetDAOUsers < subnetDAOTwoUsers) {
        smallerDAO = subnetDAOUsers
        biggerDAO = subnetDAOTwoUsers
      } else {
        smallerDAO = subnetDAOTwoUsers
        biggerDAO = subnetDAOUsers
      }

      for (var i in biggerDAO) {
        let totalBills = await contract.getCountOfCollectors(accounts[i])
        if (i < smallerDAO) {
          totalBills.toNumber().should.eql(2)
        } else {
          totalBills.toNumber().should.eql(1)
        }
      }

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
			assertRevert(
				contract.collectSubnetFees({from: accounts[3]})
			)
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
