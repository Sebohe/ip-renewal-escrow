var RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')
const Web3 = require('web3')
console.log("WEB3: ", web3.version.api)

let SUBNETDAO_FOR_RECEIVING_PAYMENTS = ''

module.exports = async function (deployer, network) {
  if (network === 'development') {
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
    SUBNETDAO_FOR_RECEIVING_PAYMENTS = await web3.eth.getAccounts()
    SUBNETDAO_FOR_RECEIVING_PAYMENTS = SUBNETDAO_FOR_RECEIVING_PAYMENTS[9]
  }
  console.log("Constructor arguments: ", SUBNETDAO_FOR_RECEIVING_PAYMENTS)
  deployer.deploy(RenewalFeeEscrow, SUBNETDAO_FOR_RECEIVING_PAYMENTS)
}
