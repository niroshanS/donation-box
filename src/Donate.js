import React from 'react'
import { ethers } from 'ethers';
import DonationBox from './artifacts/contracts/DonationBox.sol/DonationBox.json'
import Erc20 from './artifacts/contracts/DonationBox.sol/Erc20.json'
import { daiAddress } from './Constants';
import Dropdown from 'react-bootstrap/Dropdown';
import 'bootstrap/dist/css/bootstrap.min.css';

export default class Donate extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            amount: 0,
            contractAddress: this.props.contractAddress,
            charities: [],
            charity: undefined,
            charityAmount: 0
        };
    }

    componentDidMount() {
        this.immediateId = setImmediate(
            async () => await this.getCharities()
        );
    }

    componentWillUnmount() {
        clearImmediate(this.immediateId);
    }

    async requestAccount() {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
    }

    async donate() {
        if (typeof window.ethereum !== 'undefined') {
            await this.requestAccount()
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const daiContract = new ethers.Contract(daiAddress, Erc20.abi, signer);

            const contract = new ethers.Contract(this.state.contractAddress, DonationBox.abi, signer);
            const numDecimals = 18;

            const amount = ethers.utils.parseUnits(this.state.amount, 18);

            console.log("transfering amount ", amount);

            await daiContract.approve(this.state.contractAddress, amount);

            const transaction = await contract.donate(this.state.charity, amount);
            await transaction.wait()
        }
    }

    getContract() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        return new ethers.Contract(this.state.contractAddress, DonationBox.abi, provider);
    }

    async getCharities() {
        const contract = this.getContract();
        this.setState({charities: await contract.getAllCharities()});
    }

    render() {
        return (
            <div>
                <Dropdown>
                    <Dropdown.Toggle variant="success" id="dropdown-basic">
                        {this.state.charity || "Choose a charity"}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        {this.state.charities.map(charity => (
                            <Dropdown.Item onSelect={() => this.setState({charity: charity})}>{charity}</Dropdown.Item>
                        ))}
                    </Dropdown.Menu>
                </Dropdown>
                <input onChange={e => this.setState({ amount: e.target.value })} placeholder="0" value={this.state.amount} />
                <button onClick={() => this.donate()}>Donate</button>
            </div>
        )

    }

}