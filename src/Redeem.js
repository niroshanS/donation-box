import React from 'react'
import { ethers } from 'ethers';
import DonationBox from './artifacts/contracts/DonationBox.sol/DonationBox.json'

export default class Redeem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            contractAddress: this.props.contractAddress,
            account: "",
            amount: 0
        }
    }

    async requestAccount() {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("accounts is ", accounts);
        this.setState({ account: accounts[0] }); //Just grab the first account for now
    }

    async redeem() {
        if (typeof window.ethereum !== 'undefined') {
            await this.requestAccount();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const contract = new ethers.Contract(this.state.contractAddress, DonationBox.abi, signer);
            const isCharity = await contract.charityExists(this.state.account);
            console.log("is charity ", isCharity);
            if (!isCharity) {
                alert("Only registered charities are allowed to redeem!");
                return;
            }
            const available = await contract.getPercentageForCharity(this.state.account);
            console.log("available ", available);

            const amount = ethers.utils.parseUnits(this.state.amount, 18);
            console.log("Redeeming amount: ", amount);
            await contract.redeem(amount).catch((error) => {
                console.error(error);
                console.log(error.events.MyLog);
              });
            
        }

    }

    render() {
        return (
            <div>
                <input onChange={e => this.setState({ amount: e.target.value })} placeholder="0" value={this.state.amount} />
                <button onClick={() => this.redeem()}>Redeem</button>
            </div>
        )
    }

}