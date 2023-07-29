// SPDX-License-Identifier: MIT
// pragma - Style Guide 1
pragma solidity ^0.8.18;

// imports - Style Guide 2
import "./PriceConverter.sol";

// Error Codes - Style Guide 3
error FundMe__NotOwner();

// Interfaces, Libraries, Contracts  - Style Guide 4

// Natural Language Specification Format (NatSpec)
/**
 * @title A contract for crowd funding
 * @author Patrick Collins
 * @notice This contract is to demo a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    // Type Declarations - Style Guide 5
    using PriceConverter for uint256;

    // State Variables - Style Guide 6
    address[] private s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    address public immutable i_owner;
    uint256 private constant MINIMUM_USD = 50 * 1e18;
    // 2. storing the s_priceFeed address to global variable AggregatorV3Interface type s_priceFeed
    AggregatorV3Interface private s_priceFeed;

    // Modifiers - Style Guide 7
    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    // 1. parameterizing the pricefeed address, that stores in s_priceFeed Variable above
    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    // 3. passing it to the getConversionRate function as a argument (step 4 in PriceConverter.sol)
    /**
     * @notice This function funds this contract
     */
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "Didn't send enough!"
        );
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
    }

    function withdraw() public onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "call failed");
    }

    // view / pure - Style Guide - Solidity Chainlink Style Guide - made variables private so created functions to call that variables
    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getAddressToAmountFunded(
        address funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[funder];
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    // for Gas Optimizations using storage knowledge section
    function cheaperWithdraw() public onlyOwner {
        // instead of looping and calling s_funders from storage, we can store it in memory and use
        address[] memory funders = s_funders;
        // mappings can't be in memory.
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        require(success, "cheaperWithdraw call failed");
    }
}
