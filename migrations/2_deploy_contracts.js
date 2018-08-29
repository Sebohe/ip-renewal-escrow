var RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

let SUBNETDAO_FOR_RECEIVING_PAYMENTS = ''

module.exports = function (deployer, network, accounts) {
  if (network === 'development') {
    SUBNETDAO_FOR_RECEIVING_PAYMENTS = accounts[9]
  }
  console.log("Constructor arguments: ", SUBNETDAO_FOR_RECEIVING_PAYMENTS)
  deployer.deploy(RenewalFeeEscrow, SUBNETDAO_FOR_RECEIVING_PAYMENTS)
}
