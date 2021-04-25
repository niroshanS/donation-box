import React from 'react'
import TotalDonated from './TotalDonated';
import DonationBox from './artifacts/contracts/DonationBox.sol/DonationBox.json'
import { ethers } from 'ethers';
import Donate from './Donate';
import Redeem from './Redeem';
export default class App extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            // Replace this with donation-box contract address
            donationBoxAddress: "0x958eb4058a813dac20d875d3990cbb044b826ed8",
            contract: this.getContract(),
            account: undefined,
            isCharity: false
        };
    }

    async requestAccount() {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const account = accounts[0];
        this.setState({ account: account, isCharity: await this.state.contract.charityExists(account) });
        console.log("is charity ", this.state.isCharity);
    }

    getContract() {
        if (typeof window.ethereum !== 'undefined') {
            // Replace this with donation-box contract address
            const donationBoxAddress = "0x958eb4058a813dac20d875d3990cbb044b826ed8"
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            return new ethers.Contract(donationBoxAddress, DonationBox.abi, provider);
        }
        return null;
    }



    render() {
        return (
            <div>
                <TotalDonated contract={this.state.contract} />
                {this.state.account == undefined &&
                    <div>
                        <h2>To get started connect your account (please only connect 1)</h2>
                        <button onClick={() => this.requestAccount()}>Connect</button>
                    </div>}

                {this.state.account !== undefined && <Donate contractAddress={this.state.donationBoxAddress} />}
                {this.state.isCharity && <Redeem contractAddress={this.state.donationBoxAddress} />}
            </div>
        )
    }
}