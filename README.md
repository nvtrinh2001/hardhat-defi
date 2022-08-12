# Hardhat DeFi

A case study to learn how to interact with decentralized finance using [AAVE](aave.com) protocol.

# Overview

In this repository, you can learn about:

-   deposit an ETH collateral as WETH (Wrapped ETH)
-   use the borrowed ETH to buy other assets (DAI)
-   repay the debt to AAVE
-   test by forking a mainnet

# Getting Started

## Requirements

-   git
-   Node.js
-   yarn

## Quick Start

```
git clone git@github.com:nvtrinh2001/hardhat-defi.git
cd hardhat-defi
yarn
```

# Usage

Set up the `MAINNET_RPC_URL` using [Alchemy](alchemy.com)

Run:

`yarn hardhat run scripts/aaveBorrow.js`

# Run on a Testnet or a Mainnet

Setup all the _.env_ variables based on the _.env.example_

Run:

`yarn hardhat run scripts/aaveBorrow.js --network kovan`
