const RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

const Web3 = require('web3')
console.log("HIOHIHIHI", Web3.version)

contract('RenewalFeeEscrow', (accounts) => {

  before(function() {
  })

  let contract
  beforeEach(async function() {
    contract = await RenewalFeeEscrow.new()
  })

  it('adds a new bill to mapping', async function() {
    await contract.addBill(accounts[1], 1*(10**10))

    assert()
  })
})
