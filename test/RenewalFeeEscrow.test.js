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

    it('Revert when given a perBlockFee of zero', async () => {
      assertRevert(contract.addBill(subnetDAO, 0, {value: 2*(10**10)}))
    })

    it('Revert when no value is sent', async () => {
      assertRevert(contract.addBill(subnetDAO, 10))
    })

    it('Adds a new bill to mapping', async () => {

      const receipt = await contract.addBill(subnetDAO, 1*(10**5), {value: 1*(10**10)})
      const event = await expectEvent.inLogs(receipt.logs, 'NewBill', { 
        payer: accounts[0],
        collector: accounts[9]
      })
      event.args.payer.should.eql(accounts[0])
      event.args.collector.should.eql(subnetDAO)
    })

    it('Will not replace an exsting bill', async () => {
      await contract.addBill(subnetDAO, 1*(10**5), {value: 1*(10**10)})
      assertRevert(contract.
        addBill(subnetDAO, 2*(10**5), {value: 2*(10**10)})
      )
    })

    it('Contract ether balance should increase', async () => {
      let balance = 1*(10**10)
      await contract.addBill(subnetDAO, 1*(10**5), {value: balance})

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
      await contract.addBill(subnetDAO, 1*(10**16), {value: 1*(10**18)})
			assertRevert(contract.collectSubnetFees({from: accounts[3]}))
    })

    it('Bill lastUpdated should equal current block number', async () => {
      
      await contract.addBill(subnetDAO, 1*(10**16), {value: 1*(10**18)})

      await contract.collectSubnetFees({from: subnetDAO})
      let bill = await contract.billMapping(accounts[0], subnetDAO)
      let blockNumber = new BN(await web3.eth.getBlockNumber())
      bill.lastUpdated.toString().should.eql(blockNumber.toString())

    })

    it('Subnet should have an expected balance for single account', async () => {

      await contract.addBill(subnetDAO, 1*(10**16), {value: 1*(10**18)})
      
      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))
      let bill = await contract.billMapping(accounts[0], subnetDAO)

      const txn = await contract.collectSubnetFees({from: subnetDAO})

      let txnCost = txn.receipt.gasUsed*(await web3.eth.getGasPrice())
      txnCost = new BN(txnCost)

      // this block number needs to be after the collectSubetFees call
      let blockDelta = new BN(await web3.eth.getBlockNumber()).sub(bill.lastUpdated)
      let expectedRevenue = bill.perBlock.mul(blockDelta)
      let expectedNewBalance = expectedRevenue.add(previousBalance).sub(txnCost)

      new BN(await web3.eth.getBalance(subnetDAO)).eq(expectedNewBalance).should.eql(true)
    })

    it('Collect revenue from multiple bills', async () => {

      let accountOne = 1*(10**17)
      let perBlockFee = 1*(10**15)
      let subscribersCount = 6
      for (var i = 0; i < subscribersCount; i++) {
        await contract.addBill(subnetDAO, perBlockFee, {
            from: accounts[i], value: accountOne
        })
      }
      // Helper function that determines the amount
      // of block dues for accounts since adding a new bill
      // adds a new transaction
      const recursiveSum = count => {
        if (count === 1) return 1
        return recursiveSum(count - 1) + count
      }

      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))

      const txn = await contract.collectSubnetFees({from: subnetDAO})

      const txnCost = new BN(txn.receipt.gasUsed*(await web3.eth.getGasPrice()))
      const billCount = new BN(recursiveSum(subscribersCount))
      let expectedNewBalance = new BN(perBlockFee).mul(billCount)
        .add(previousBalance).sub(txnCost)

      new BN(await web3.eth.getBalance(subnetDAO)).eq(expectedNewBalance).should.eql(true)
    })

    it('Set bill account to zero', async () => {

      let accountOne = 2*(10**10)
      let perBlockFee = 1*(10**10)
      await contract.addBill(subnetDAO, perBlockFee, {value: accountOne})

      // extra txns to run up the counter
      for (var i = 0; i < 4; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }

      await contract.collectSubnetFees({from: subnetDAO})
      let bill = await contract.billMapping(accounts[0], subnetDAO)
      bill.account.toString().should.eql('0')
    })

  })

  describe('payMyBills', async () => {

    beforeEach(async() => {
      contract = await RenewalFeeEscrow.new(subnetDAO)
    })

    it('Bill should have lastUpdated with same blockNumber', async () => {
      let accountOne = 1*(10**10)
      let perBlockFee = 1*(10**9)
      await contract.addBill(subnetDAO, perBlockFee, {value: accountOne})
      await contract.payMyBills()
      let bill = await contract.billMapping(accounts[0], subnetDAO)

      assert(bill.lastUpdated.eq(new BN(await web3.eth.getBlockNumber())))
    })

    it('Collectors should have increased balance', async () => {
      let accountOne = 1*(10**10)
      let perBlockFee = 1*(10**9)
      await contract.addBill(subnetDAO, perBlockFee, {value: accountOne})

      // extra txns to run up the counter
      let blockCount = 5
      for (var i = 0; i < blockCount; i++) {
        await  web3.eth.sendTransaction({
          from: accounts[1],
          to: '0x0000000000000000000000000000000000000000',
          value: 1
        })
      }

      let previousBalance = new BN(await web3.eth.getBalance(subnetDAO))
      // the +1 is for the payMyBills txn block number
      let expectedNewBalance = new BN(perBlockFee).mul(new BN(blockCount + 1))
      // the i prefix is for inplace
      expectedNewBalance.iadd(previousBalance)

      await contract.payMyBills()

      new BN(await web3.eth.getBalance(subnetDAO)).eq(expectedNewBalance).should.eql(true)
    })

    it('Account of bill should be zero when it cant afford payment', async () => {
    })

  })
})
