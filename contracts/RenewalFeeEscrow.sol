pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract RenewalFeeEscrow {
  using SafeMath for uint;

  mapping (address => uint) public accountsBalance;
  mapping (address => mapping (address => Bill)) public billMapping;
  mapping (address => address[]) public subscribersOfPayee;
  mapping (address => address[]) public collectorsOfPayer;

  struct Bill {
    uint perBlock;
    uint lastUpdated;
  }

  function addBill (address _payableTo, uint _price) external payable {
    // there should be a minimum limit on how long the subscription shoudl last
    // or just verify that the new bill can process for one block
    require(msg.value > 0, "No value sent");
    Bill memory bill = Bill(_price, block.number);
    billMapping[msg.sender][_payableTo] = bill;
    accountsBalance[msg.sender] = msg.value;
    subscribersOfPayee[_payableTo].push(msg.sender);
    collectorsOfPayer[msg.sender].push(_payableTo);
  }

  function collectMyBills () public {

    require(subscribersOfPayee[msg.sender].length > 0);

    for (uint i = 0; i < subscribersOfPayee[msg.sender].length; i++) {
      address payer = subscribersOfPayee[msg.sender][i];

      Bill memory bill = billMapping[payer][msg.sender];
      uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
      uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

      // If they have enough to pay the bill in full
      if (amountOwed <= accountsBalance[payer]) {
        // Debit their account and credit my account by amountOwed
        accountsBalance[payer] = accountsBalance[payer].sub(amountOwed);
        accountsBalance[msg.sender] = accountsBalance[msg.sender].add(amountOwed);
      } else {
        // Transfer remainder of their account to my account
        accountsBalance[payer] = accountsBalance[msg.sender].add(accountsBalance[payer]);
        accountsBalance[payer] = 0;
      }

      billMapping[payer][msg.sender].lastUpdated = block.number;
    }
  }

  function payMyBills () internal {

    for (uint i = 0; i < collectorsOfPayer[msg.sender].length; i++) {
      address collector = collectorsOfPayer[msg.sender][i];

      Bill memory bill = billMapping[msg.sender][collector];
      uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
      uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

      billMapping[msg.sender][collector].lastUpdated = block.number;

      // If I have enough to pay the bill in full
      if (amountOwed <= accountsBalance[msg.sender]) {
        // Debit my account and credit their account by amountOwed
        accountsBalance[msg.sender] = accountsBalance[msg.sender].sub(amountOwed);
        accountsBalance[collector] = accountsBalance[collector].add(amountOwed);
      } else {
        // Transfer remainder of my account to their account
        accountsBalance[collector] = accountsBalance[collector].add(accountsBalance[msg.sender]);
        accountsBalance[msg.sender] = 0;
      }
      collector.transfer(accountsBalance[msg.sender]);
    }
  }

  function withdrawFromEscrow() public {
    //process payments before withdrawing
    payMyBills();
    require(accountsBalance[msg.sender] > 0);
    msg.sender.transfer(accountsBalance[msg.sender]);
  }
}

