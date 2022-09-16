// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;
// imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
//error codes
error FundMe__NotOwner();

// interfaces, libs, contracts

// AN EXAXMPLE OF ETH NATSPEC (style stuff) - this automatically creates documentation which is useful for other devs!
/** @title A contract for crowd funding
 *  @author Patrick Collins (Tom)
 *  @notice This contract is to demo a sample fuding contract - note this follows the spec laid out in ETH style guide
 *  @dev This implements price feeds as our library
 */

contract FundMe {
    // Type declarations
    using PriceConverter for uint256;

    // State variables
    mapping(address => uint256) private s_addressToAmountFunded; // the s_ is to indicate that this function uses storage (therefore expensive for gas)
    address[] private s_funders;

    // Could we make this constant?  /* hint: no! We should make it immutable! */
    address private immutable i_owner; // i_ is immutable
    uint256 public constant MINIMUM_USD = 50 * 10**18; // const is all caps
    AggregatorV3Interface public s_priceFeed;

    // Modifiers
    modifier onlyOwner() {
        // require(msg.sender == owner);
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    // Constructors
    constructor(address s_priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(s_priceFeedAddress);
    }

    // Receive and Fallback functions [nice to have, but not super necessary for this contract]
    // receive() external payable {
    //     fund();
    // }

    // fallback() external payable {
    //     fund();
    // }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_funders.length;
            funderIndex++
        ) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        // // transfer
        // payable(msg.sender).transfer(address(this).balance);
        // // send
        // bool sendSuccess = payable(msg.sender).send(address(this).balance);
        // require(sendSuccess, "Send failed");
        // call
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders; // here we read s_funders array into memory and then read/write from memory, which is significantly cheapers than reading/writing from storage in terms of gas!
        // mappings can't be in memory, sorry!
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
        require(success);
    }

    // we add the following "getter" functions to make it easier for people to interact with our code...
    // here we're essentially providing an API for them...also we're reducing gas costs because vars are private
    // SEE examples of how these are called in the FundMe.test.js script
    // these are the final stage in the style guide i.e. private/view functions

    // added this function coz we made the i_owner private above
    function getOwner() public view returns (address) {
        return i_owner;
    }

    // added this function coz we made the  s_funders private above
    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    // addressToAmountFunded can also be private
    function getAddressToAmountFunded(address funder)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[funder];
    }

    // priceFeed
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
