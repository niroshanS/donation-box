import React from 'react'
import DonationBox from './artifacts/contracts/DonationBox.sol/DonationBox.json'
import { ethers } from 'ethers';

export default class AddCharity extends React.Component {

    constructor(props) {
        super(props);
        console.log(this.props)
        this.state = {
            donationBoxAddress: this.props.donationBoxAddress,
            charity: ''
        };
    }

    async addCharity(donationBoxAddress) {
        console.log("in add charity")
        if (typeof window.ethereum !== 'undefined' && this.state.charity !== 'undefined') {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner()
            const contract = new ethers.Contract(donationBoxAddress, DonationBox.abi, signer)
            const transaction = await contract.addCharity(this.state.charity)
            await transaction.wait()
        }
    }

    render() {
        return (
            <div>
                <button onClick={() => this.addCharity(this.state.donationBoxAddress)}>Add Charity</button>
                <input onChange={e => this.setState({ charity: e.target.value })} placeholder="Charity Address" />
            </div>
        );
    }
}