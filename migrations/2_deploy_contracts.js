var RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')
console.log("WEB3: ", web3.version.api)

let SUBNETDAO_FOR_RECEIVING_PAYMENTS = ''

module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    SUBNETDAO_FOR_RECEIVING_PAYMENTS = accounts[9]
  }
  console.log("Constructor arguments: ", SUBNETDAO_FOR_RECEIVING_PAYMENTS)
  deployer.deploy(RenewalFeeEscrow, SUBNETDAO_FOR_RECEIVING_PAYMENTS)
}
