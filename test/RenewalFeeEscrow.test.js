const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')
RenewalFeeEscrow.numberFormat = 'BN'
const BN = web3.utils.BN

require('chai').should()

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
        subnetDAO, 1*(10**5), {from: accounts[0], value: 1*(10**10)}
      )
      const event = await expectEvent.inLogs(receipt.logs, 'NewBill', { 
        payer: accounts[0],
        collector: accounts[9]
      })
      event.args.payer.should.eql(accounts[0])
      event.args.collector.should.eql(subnetDAO)
    })

    it('Will not replace an exsting bill', async () => {
      await contract.addBill(subnetDAO, 1*(10**5), {
        from: accounts[0], value: 1*(10**10)
      })
      assertRevert(contract.
        addBill(subnetDAO, 2*(10**5), {from: accounts[0], value: 2*(10**10)})
      )
    })

    it('Contract ether balance should increase', async () => {
      let balance = 1*(10**10)
      await contract.addBill(subnetDAO, 1*(10**5), {
        from: accounts[0], value: balance
      })

      let contractBalance = await web3.eth.getBalance(contract.address)
      contractBalance.should.eql(web3.utils.toBN(balance).toString())

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
        await contract.addBill(subnetDAO, 1*(10**5), {from: accounts[i], value: 1*(10**10)})
      }
      for (let i = 0; i < subnetDAOTwoUsers; i++) {
        await contract.addBill(subnetDAOTwo, 1*(10**5), {from: accounts[i], value: 1*(10**10)})
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

    beforeEach(async () => {
      contract = await RenewalFeeEscrow.new(subnetDAO)
    })

    it('Revert when Subnet doesnt have subscribers', async () => {
      await contract.addBill(subnetDAO, 1*(10**16), {
          from: accounts[0], value: 1*(10**18) 
      })
			assertRevert(contract.collectSubnetFees({from: accounts[3]}))
    })

    it('Bill lastUpdated should equal current block number', async () => {
      
      await contract.addBill(subnetDAO, 1*(10**16), {
          from: accounts[0], value: 1*(10**18) 
      })

      await contract.collectSubnetFees({from: subnetDAO})
      let bill = await contract.billMapping(accounts[0], subnetDAO)
      let blockNumber = new BN(await web3.eth.getBlockNumber())
      bill.lastUpdated.toString().should.eql(blockNumber.toString())

    })

    it('Subnet should have an expected balance for single account', async () => {

      await contract.addBill(subnetDAO, 1*(10**16), {
          from: accounts[0], value: 1*(10**18) 
      })
      
      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))
      let bill = await contract.billMapping(accounts[0], subnetDAO)

      const txn = await contract.collectSubnetFees({from: subnetDAO})
      let txnCost = txn.receipt.gasUsed*(await web3.eth.getGasPrice())
      txnCost = new BN(txnCost)

      // this block number needs to be after the collectSubetFees call
      let blockDelta = new BN(await web3.eth.getBlockNumber()).sub(bill.lastUpdated)
      let expectedRevenue = bill.perBlock.mul(blockDelta)
      let expectedNewBalance = expectedRevenue.add(previousBalance).sub(txnCost)

      let balance = new BN(await web3.eth.getBalance(subnetDAO))
      balance.eq(expectedNewBalance).should.eql(true)
    })

      // Get a list of all the payers
    it('collect revenue from multiple bills', async () => {

      await contract.addBill(subnetDAO, 1*(10**16), {
          from: accounts[0], value: 1*(10**18) 
      })

      let accountOne = 1*(10**16)
      let perBlockFee = 1*(10**15)

      // i starts at 1 because account[0] already has a bill
      for (var i = 1; i < 6; i++) {
        await contract.addBill(subnetDAO, perBlockFee, {
            from: accounts[i], value: accountOne
        })
      }

      let txnCount = 10
      for (var i = 0; i < txnCount ; i++) {
        web3.eth.sendTransaction({
          from: accounts[0],
          to: '0xcc2d4df9701f1afcd2b8c810a7eca69a7fd84e28',
          value: 1
        })
      }

      // get all subscribers addresses
      let payers = []
      payersCount = await contract.getCountOfSubscribers(subnetDAO)
      for (var i = 0; i < payersCount.toNumber(); i++) {
        payers.push(await contract.subscribersOfPayee(subnetDAO, i))
      }

      // get all of the bills to each corresponding addresses
      let bills = []
      for (var i = 0; i < payers.length; i++) {
        bills.push(await contract.billMapping(payers[i], subnetDAO))
      }

      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))
      //**** Actual contract call
      const txn = await contract.collectSubnetFees({from: subnetDAO})
      //****
      let txnCost = txn.receipt.gasUsed*(await web3.eth.getGasPrice())
      txnCost = new BN(txnCost)

      expectedRevenue = new BN(0)
      let blockNumber = new BN(await web3.eth.getBlockNumber)
      for (var i = 0; i < bills.length; i++) {
        let blockDelta = blockNumber.sub(bill.lastUpdated)
        bill.perBlock.mul(blockDelta)

      }
      
      console.log(bills)

      assert(true)
    })

  })

  describe('payMyBills', async () => {

    beforeEach(async() => {
      contract = await RenewalFeeEscrow.new(subnetDAO)
      await contract.addBill(subnetDAO, 1*(10**5), {from: accounts[0], value: 1*(10**10)})
      await contract.addBill(subnetDAOTwo, 1*(10**5), {from: accounts[0], value: 1*(10**15)})

    })

    it('Subscriber should have each of the bills with an expect amount', async () => {
    })

    it('Bill should have lastUpdated with same blockNumber', async () => {
    })

    it('Account of bill should be zero when it cant afford payment', async () => {
    })


  })
})
