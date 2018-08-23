var RenewalFeeEscrow = artifacts.require('./RenewalFeeEscrow.sol')

module.exports = function (deployer) {
  deployer.deploy(RenewalFeeEscrow)
}
