const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("./getWeth");

async function main() {
    // AAVE protocol treats everything as ERC20 token
    // But ETH is not a ERC20 token => WETH is wrapped ETH - an ERC20 token
    await getWeth();
    const { deployer } = await getNamedAccounts();
    // interacting with the AAVE protocol
    // abi, address
    // Lending Pool Address Provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    const lendingPool = await getLendingPool(deployer);
    console.log(`Lending Pool Address: ${lendingPool.address}`);

    // deposit
    // need to approve to get our token first
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    // approve
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);

    console.log("Depositing...");
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
    console.log("Deposited!");
    console.log("--------------------------------------");

    let { totalDebtETH, availableBorrowsETH } = await getBorrowUserData(
        lendingPool,
        deployer
    );

    // Now I can use ETH to borrow some DAIs. What's DAI conversion rate? => use Chainlink Price Feed
    const daiPrice = await getDaiPrice();
    const amountDaiToBorrow =
        availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber());
    console.log(`You can buy ${amountDaiToBorrow} DAI.`);
    const amountDaiToBorrowToWei = ethers.utils.parseEther(
        amountDaiToBorrow.toString()
    );
    // Borrow through AAVE, example: borrow DAI (stable coin: 1$)
    await borrowDai(
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        lendingPool,
        amountDaiToBorrowToWei,
        deployer
    );
    await getBorrowUserData(lendingPool, deployer);
    console.log("--------------------------------------");

    // repay to AAVE
    await repayAave(
        "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        lendingPool,
        amountDaiToBorrowToWei,
        deployer
    );
    // After repaid, still have some debt => interest rate borrowed from AAVE
    await getBorrowUserData(lendingPool, deployer);
    console.log("--------------------------------------");
}

async function repayAave(daiAddress, lendingPool, amount, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account);
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
    await repayTx.wait(1);
    console.log("Repaid!");
}

async function borrowDai(
    daiAddress,
    lendingPool,
    amountDaiToBorrowToWei,
    account
) {
    const borrowTx = await lendingPool.borrow(
        daiAddress,
        amountDaiToBorrowToWei,
        1,
        0,
        account
    );
    await borrowTx.wait(1);
    console.log("You've borrowed!");
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        "0x773616e4d11a78f511299002da57a0a94577f1f4"
    );

    const price = (await daiEthPriceFeed.latestRoundData())[1];
    console.log(`The DAI/ETH price is ${price.toString()}`);
    return price;
}

async function getBorrowUserData(lendingPool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await lendingPool.getUserAccountData(account);
    console.log(`You have ${totalCollateralETH} ETH deposited.`);
    console.log(`You have ${totalDebtETH} ETH borrowed.`);
    console.log(`You can borrow ${availableBorrowsETH} ETH.`);
    return { totalDebtETH, availableBorrowsETH };
}

async function getLendingPool(account) {
    const lendingPoolAddressProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider",
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
        account
    );
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt(
        "ILendingPool",
        lendingPoolAddress,
        account
    );
    return lendingPool;
}

async function approveErc20(
    erc20Address,
    spenderAddress,
    amountToSpend,
    account
) {
    const erc20Token = await ethers.getContractAt(
        "IERC20",
        erc20Address,
        account
    );
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
