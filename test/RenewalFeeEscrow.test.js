const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

const { expectRevert } = requires('./helpers/expectEvent.js');

contract('RenewalFeeEscrow', (accounts) => {

  let contract
  before(async function() {
    contract = await RenewalFeeEscrow.deployed()
  })


  it('Adds a new bill to mapping', async function() {

    let txn = {
      from: accounts[0],
      value: 1*(10**18) // 1 ether
    }
    await contract.addBill(accounts[1], 1*(10**10), txn)
    let receipt = await contract.billMapping(accounts[0], accounts[1])
    const event = expectEvent.inLogs(receipt.logs, 'NewBill', { 
      payer: accounts[0],
      collector: accounts[1]
    })
  })
})
