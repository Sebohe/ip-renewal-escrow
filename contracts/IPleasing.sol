pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/contracts/eip20/eip20interface.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

//RBAC could be replaced with Aragon's ACL if we use an aragon app
import "openzeppelin-solidity/contracts/access/rbac/RBAC.sol";


contract RenewalFeeEscrow {
  using SafeMath for uint;
  EIP20Interface public token;

  mapping (address => uint) accountsReceivable;
  mapping (address => mapping (address => Bill)) billMapping;
  mapping (address => address[]) subcribersOfPayee;
  mapping (address => address[]) collectorsOfPayerpayeesOfPayer;

  bytes32 hashroot;

  struct Bill {
    uint account;
    uint perBlock;
    uint lastUpdated;
  }

  function addBill (address _payableTo) external {
    billMapping[msg.sender][_payableTo] = Bill();
  }

  function collectMyBills () internal {
    for (uint i = 0; i < payersOfPayee[msg.sender].length; i++) {
      address payer = payersOfPayee[msg.sender][i];

      Bill bill = billMapping[payer][msg.sender];
      uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
      uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

      bill.lastUpdated = block.number;

      // If they have enough to pay the bill in full
      if (amountOwed <= accounts[payer]) {
        // Debit their account and credit my account by amountOwed
        accounts[payer] = accounts[payer].sub(amountOwed);
        accounts[msg.sender] = accounts[msg.sender].add(amountOwed);
      } else {
        // Transfer remainder of their account to my account
        accounts[msg.sender] = accounts[msg.sender].add(accounts[payer]);
        accounts[payer] = 0;
      }
    }
  }

  function payMyBills () internal {

    for (uint i = 0; i < payeesOfPayer[msg.sender].length; i++) {
      address payee = payeesOfPayer[msg.sender][i];

      Bill bill = billMapping[msg.sender][payee];
      uint blocksSinceUpdate = block.number.sub(bill.lastUpdated);
      uint amountOwed = blocksSinceUpdate.mul(bill.perBlock);

      bill.lastUpdated = block.number;

      // If I have enough to pay the bill in full
      if (amountOwed <= accounts[msg.sender]) {
        // Debit my account and credit their account by amountOwed
        accounts[msg.sender] = accounts[msg.sender].sub(amountOwed);
        accounts[payee] = accounts[payee].add(amountOwed);
      } else {
        // Transfer remainder of my account to their account
        accounts[msg.sender] = 0;
        accounts[payee] = accounts[payee].add(accounts[msg.sender]);
      }
    }
  }

  function withDrawFromEscrow() public {
    //process payments before paying out
  }
}

