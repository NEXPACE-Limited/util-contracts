# @projecta/util-contracts

Nexpace util contracts

## Environment

- solidity ^0.8.0 (^0.8.1 for some contracts)

## Install

```shell
npm i --save-peer @projecta/util-contracts
```

## Usage

```solidity
import { NextOwnablePausable } from "@projecta/util-contracts/contracts/access/NextOwnablePausable.sol";

contract MyContract is NextOwnablePausable {
  function deposit() external payable {}

  function withdraw() external whenExecutable {
    msg.sender.transfer(address(this).balance);
  }
}
```
