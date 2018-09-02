pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract RenewalFeeEscrow {
  using SafeMath for uint;

  event NewBill(address payer, address collector);
  event Debug(string msg);
  event DebugInt(string msg, uint i);

  mapping (address => mapping (address => Bill)) public billMapping;
  mapping (address => address[]) public subscribersOfPayee;
  mapping (address => address[]) public collectorsOfPayer;

  struct Bill {
    uint account;
    uint perBlock;
    uint lastUpdated;
  }

  /*
  @notice subnetDAO is going to be the smart contract that has the list of 
  subnetDAOs. This will get queried like subnetDAO.getMemberList
  */
  address public subnetDAO;
  constructor (address _subnetDaoManager) public {
    subnetDAO = _subnetDaoManager;
  }

  function addBill (address _payableTo, uint _price) public payable {

    require(msg.value.mul(_price) > 1);
    require(
      billMapping[msg.sender][_payableTo].lastUpdated == 0, "Bill already exists"
    );

    billMapping[msg.sender][_payableTo] = Bill(msg.value, _price, block.number);
    subscribersOfPayee[_payableTo].push(msg.sender);
    collectorsOfPayer[msg.sender].push(_payableTo);
    emit NewBill(msg.sender, _payableTo);
  }

  function getCountOfSubscribers(address _payee) public view returns (uint) {
    return subscribersOfPayee[_payee].length;
  }

  function getCountOfCollectors(address _payer) public view returns (uint) {
    return collectorsOfPayer[_payer].length;
  }

  function topOfBill(address _payee) public payable {
    require(msg.value != 0);
    require(
      billMapping[msg.sender][_payee].lastUpdated != 0, "Bill needs to be added first"
    );
    uint newValue = billMapping[msg.sender][_payee].account.add(msg.value);
    billMapping[msg.sender][_payee].account = newValue;
  }

  function collectSubnetFees() public {

    require(subscribersOfPayee[msg.sender].length > 0);
    uint transferValue = 0;

    for (uint i = 0; i < subscribersOfPayee[msg.sender].length; i++) {

      transferValue = transferValue.add(updateBills(
        msg.sender, 
        subscribersOfPayee[msg.sender][i]
      ));
    }

    address(msg.sender).transfer(transferValue);
  }

  function payMyBills () public {

    for (uint i = 0; i < collectorsOfPayer[msg.sender].length; i++) {
      address collector = collectorsOfPayer[msg.sender][i];

      uint transferValue = updateBills(
        collector, 
        msg.sender
      );

      collector.transfer(transferValue);
    }
  }

  function updateBills(
    address collector,
    address subscriber
  )
    internal returns(uint) 
  {
    uint transferValue;
    Bill memory bill = billMapping[subscriber][collector];
    uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
    uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

    // If I have enough to pay the bill in full
    if (amountOwed <= bill.account) {
      // Debit my account and credit their account by amountOwed
      billMapping[subscriber][collector].account = bill.account.sub(amountOwed);
      transferValue = amountOwed;
    } else {
      // Transfer remainder of my account to their account
      transferValue = bill.account;
      billMapping[subscriber][collector].account = 0;
    }
    billMapping[subscriber][collector].lastUpdated = block.number;
    return transferValue;
  }
}

