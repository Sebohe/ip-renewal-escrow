pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract RenewalFeeEscrow {
  using SafeMath for uint;

  mapping (address => uint) accountsReceivable;
  mapping (address => mapping (address => Bill)) billMapping;
  mapping (address => address[]) subscribersOfPayee;
  mapping (address => address[]) collectorsOfPayer;

  struct Bill {
    uint account;
    uint perBlock;
    uint lastUpdated;
  }

  function addBill (address _payableTo, uint _price) external payable {
    billMapping[msg.sender][_payableTo] = Bill(msg.value, _price, block.number);
  }

  function collectMyBills () public {

    for (uint i = 0; i < subscribersOfPayee[msg.sender].length; i++) {
      address payer = subscribersOfPayee[msg.sender][i];

      Bill memory bill = billMapping[payer][msg.sender];
      uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
      uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

      billMapping[payer][msg.sender].lastUpdated = block.number;

      // If they have enough to pay the bill in full
      if (amountOwed <= accountsReceivable[payer]) {
        // Debit their account and credit my account by amountOwed
        accountsReceivable[payer] = accountsReceivable[payer].sub(amountOwed);
        accountsReceivable[msg.sender] = accountsReceivable[msg.sender].add(amountOwed);
      } else {
        // Transfer remainder of their account to my account
        accountsReceivable[msg.sender] = accountsReceivable[msg.sender].add(accountsReceivable[payer]);
        accountsReceivable[payer] = 0;
      }
    }
  }

  function payMyBills () public {

    for (uint i = 0; i < collectorsOfPayer[msg.sender].length; i++) {
      address payee = collectorsOfPayer[msg.sender][i];

      Bill bill = billMapping[msg.sender][payee];
      uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
      uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

      bill.lastUpdated = block.number;

      // If I have enough to pay the bill in full
      if (amountOwed <= accountsReceivable[msg.sender]) {
        // Debit my account and credit their account by amountOwed
        accountsReceivable[msg.sender] = accountsReceivable[msg.sender].sub(amountOwed);
        accountsReceivable[payee] = accountsReceivable[payee].add(amountOwed);
      } else {
        // Transfer remainder of my account to their account
        accountsReceivable[msg.sender] = 0;
        accountsReceivable[payee] = accountsReceivable[payee].add(accountsReceivable[msg.sender]);
      }
    }
  }

  function withdrawFromEscrow() public {
    //process payments before withdrawing
  }
}

