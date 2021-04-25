import React from 'react'
import { ethers } from 'ethers';
import CErc20 from './artifacts/contracts/DonationBox.sol/CErc20.json'
import { cDaiAddress, donationBoxAddress } from './Constants';
export default class TotalDonated extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            totalDonated: 0,
            contract: this.props.contract

        };
    }

    componentDidMount() {
        this.timerId = setInterval(
            async () => await this.getTotalDonated(),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timerID);
    }

    async getTotalDonated() {
        if (typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            // const signer = provider.getSigner();
            const cDaiContract = new ethers.Contract(cDaiAddress, CErc20.abi, provider);
        
            const balance = await cDaiContract.balanceOfUnderlying(donationBoxAddress);
            const value = ethers.utils.formatUnits(balance, 18)
            console.log(value)
            this.setState({
                totalDonated: value
            });
        }

    }


    render() {
        return (
            <div><h1>Total Donated: {this.state.totalDonated} </h1></div>
        )
    }
}