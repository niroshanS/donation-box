//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.3;

interface Erc20 {
    function approve(address, uint256) external returns (bool);

    function transfer(address, uint256) external returns (bool);

    function transferFrom(
        address,
        address,
        uint256
    ) external returns (bool);

    function balanceOf(address) external view returns (uint256);
}

interface CErc20 {
    function mint(uint256) external returns (uint256);

    function balanceOfUnderlying(address account)
        external
        view
        returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function supplyRatePerBlock() external returns (uint256);

    function redeem(uint256) external returns (uint256);

    function redeemUnderlying(uint256) external returns (uint256);

    function transfer(address, uint256) external returns (bool);

    function getCash() external returns (uint256);
}

contract DonationBox {
    event MyLog(string, uint256);

    struct Charity {
        uint256 donatedAmount;
        bool isValid;
    }

    address _admin;
    address _cDaiAddress;
    mapping(address => Charity) charities;
    address[] charityList;
    uint totalCharities = 0;
    uint256 totalDonated;
    Erc20 _daiContract;
    CErc20 _cDaiContract;

    constructor(
        address admin,
        address erc20Address,
        address cErc20Address
    ) {
        _admin = admin;
        _daiContract = Erc20(erc20Address);
        _cDaiContract = CErc20(cErc20Address);
        _cDaiAddress = cErc20Address;
    }

    function addCharity(address charity) public returns (bool success) {
        require(msg.sender == _admin, "Restricted action!");
        if (charityExists(charity)) {
            return true;
        }

        charities[charity].isValid = true;
        charityList.push(charity);
        totalCharities++;

        return true;
    }

    function removeCharity(address charity) public returns (bool success) {
        require(msg.sender == _admin, "Restricted action!");
        require(charityExists(charity), "Charity is not valid");

        charities[charity].isValid = false;

        return true;
    }

    function donate(address charity, uint256 _numTokensToSupply)
        public
        payable
    {
        require(charityExists(charity), "Charity is not valid");

        require(_numTokensToSupply >= 0, "Need to send more than 0");

        require(msg.sender != charity, "Can't send fund to self");

        uint256 balance = _daiContract.balanceOf(msg.sender);

        require(balance >= _numTokensToSupply, "not enough funds");

        bool transferResult =
            _daiContract.transferFrom(
                msg.sender,
                address(this),
                _numTokensToSupply
            );

        require(transferResult, "transfer failed!");

        charities[charity].donatedAmount += _numTokensToSupply;

        totalDonated += _numTokensToSupply;

        supplyErc20ToCompound(_numTokensToSupply);
    }

    function supplyErc20ToCompound(uint256 _numTokensToSupply)
        public
        returns (uint256)
    {
        // Amount of current exchange rate from cToken to underlying
        uint256 exchangeRateMantissa = _cDaiContract.exchangeRateCurrent();
        emit MyLog("Exchange Rate (scaled up): ", exchangeRateMantissa);

        // Amount added to you supply balance this block
        uint256 supplyRateMantissa = _cDaiContract.supplyRatePerBlock();
        emit MyLog("Supply Rate: (scaled up)", supplyRateMantissa);

        // Approve transfer on the ERC20 contract
        _daiContract.approve(_cDaiAddress, _numTokensToSupply);

        // Mint cTokens
        uint256 mintResult = _cDaiContract.mint(_numTokensToSupply);

        require(mintResult == 0, "Minting failed!");

        return mintResult;
    }

    function redeem(uint256 amount) public returns (bool) {
        address charity = msg.sender;

        require(charityExists(charity), "Need to be a valid charity to redeem");

        uint256 availableUnderlying =
            totalDonated * getPercentageForCharity(charity);

        require(
            availableUnderlying >= amount,
            "Requested amount greater than available"
        );

        charities[charity].donatedAmount -= amount;
        emit MyLog("Amount was ", amount);

        uint256 redeemResult;

        // Retrieve based on underyling amount
        redeemResult = _cDaiContract.redeemUnderlying(amount);

        emit MyLog("Reedem result was ", redeemResult);


        bool transferResult = _daiContract.transfer(charity, amount);

        require(transferResult, "failed to transfer");

        // Error codes are listed here:
        // https://compound.finance/developers/ctokens#ctoken-error-codes
        emit MyLog("If this is not 0, there was an error", redeemResult);

        return true;
    }

    function getPercentageForCharity(address charity)
        public
        view
        returns (uint256)
    {
        if (totalDonated == 0) {
            return 0;
        }
        return charities[charity].donatedAmount / totalDonated;
    }

    function charityExists(address charity) public view returns (bool success) {
        return charities[charity].isValid;
    }

    function getAllCharities() public view returns(address[] memory) {
        return charityList;
    }
}
