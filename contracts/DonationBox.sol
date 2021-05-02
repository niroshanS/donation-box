//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.3;

interface Erc20 {
    function approve(address, uint) external returns (bool);

    function transfer(address, uint) external returns (bool);

    function transferFrom(
        address,
        address,
        uint
    ) external returns (bool);

    function balanceOf(address) external view returns (uint);
}

interface CErc20 {
    function mint(uint) external returns (uint);

    function balanceOfUnderlying(address account)
        external
        view
        returns (uint);

    function exchangeRateCurrent() external returns (uint);

    function supplyRatePerBlock() external returns (uint);

    function redeem(uint) external returns (uint);

    function redeemUnderlying(uint) external returns (uint);

    function transfer(address, uint) external returns (bool);

    function getCash() external returns (uint);
}

contract DonationBox {
    event MyLog(string, uint);

    struct Charity {
        uint donatedAmount;
        bool isValid;
    }

    address _admin;
    address _cDaiAddress;
    mapping(address => Charity) charities;
    address[] charityList;
    uint totalCharities = 0;
    uint totalDonated;
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

    function addCharity(address charity) external returns (bool success) {
        require(msg.sender == _admin, "Restricted action!");
        if (charityExists(charity)) {
            return true;
        }

        charities[charity].isValid = true;
        charityList.push(charity);
        totalCharities++;

        return true;
    }

    function removeCharity(address charity) external returns (bool success) {
        require(msg.sender == _admin, "Restricted action!");
        require(charityExists(charity), "Charity is not valid");

        charities[charity].isValid = false;

        return true;
    }

    function donate(address charity, uint _numTokensToSupply)
        external
        payable
    {
        require(charityExists(charity), "Charity is not valid");

        require(_numTokensToSupply >= 0, "Need to send more than 0");

        require(msg.sender != charity, "Can't send fund to self");

        uint balance = _daiContract.balanceOf(msg.sender);

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

    function supplyErc20ToCompound(uint _numTokensToSupply)
        private
        returns (uint)
    {
        // Amount of current exchange rate from cToken to underlying
        uint exchangeRateMantissa = _cDaiContract.exchangeRateCurrent();
        emit MyLog("Exchange Rate (scaled up): ", exchangeRateMantissa);

        // Amount added to you supply balance this block
        uint supplyRateMantissa = _cDaiContract.supplyRatePerBlock();
        emit MyLog("Supply Rate: (scaled up)", supplyRateMantissa);

        // Approve transfer on the ERC20 contract
        _daiContract.approve(_cDaiAddress, _numTokensToSupply);

        // Mint cTokens
        uint mintResult = _cDaiContract.mint(_numTokensToSupply);

        require(mintResult == 0, "Minting failed!");

        return mintResult;
    }

    function redeem(uint amount) external returns (bool) {
        address charity = msg.sender;

        require(charityExists(charity), "Need to be a valid charity to redeem");

        uint availableUnderlying =
            totalDonated * getPercentageForCharity(charity);

        require(
            availableUnderlying >= amount,
            "Requested amount greater than available"
        );

        charities[charity].donatedAmount -= amount;
        emit MyLog("Amount was ", amount);

        uint redeemResult;

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
        returns (uint)
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
