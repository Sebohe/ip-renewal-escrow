const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')


contract('RenewalFeeEscrow', (accounts) => {

  before(function() {
  })

  let contract
  beforeEach(async function() {
    contract = await RenewalFeeEscrow.new()
  })

  it('adds a new bill to mapping', async function() {

    let txn = {
      from: accounts[0],
      value: 1*(10**18)
    }
    await contract.addBill(accounts[1], 1*(10**10), txn)
    let bill = await contract.billMapping(accounts[0], accounts[1])
    console.log("Bill", bill)

    assert()
  })
})
