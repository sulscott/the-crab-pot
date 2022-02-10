import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const App = () => {
  /*
  * Just a state variable we use to store our user's public wallet.
  */
  const [currentAccount, setCurrentAccount] = useState("");
  const [message, setMessage] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [blockedUser, setBlockedUser] = useState("");
  const contractAddress = "0xAffeA8224468054F8e1FDCFa58E45CFc2b7E7408";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieve total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 600000 });
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const blockUser = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const blockedUserTxn = await wavePortalContract.blockUser(blockedUser, { gasLimit: 600000 });
        console.log("Blocking wallet address: ", blockedUser);
        await blockedUserTxn.wait();
        console.log("Wallet Address %s has been blocked.", blockedUser);
      } else { 
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
            winner: wave.winner,
          };
        });

        setAllWaves(wavesCleaned.reverse);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

/**
 * Listen in for emitter events!
 */
  useEffect(() => {
    checkIfWalletIsConnected();
    let wavePortalContract;

    const onNewWave = (from, timestamp, message, winner) => {
      console.log("NewWave", from, timestamp, message, winner);
      setAllWaves(prevState => [
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
          winner: winner,
        },...prevState,
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          🦀 The Crab Pot 🦀
        </div>

        <div className="bio">
          Welcome to the crab pot. 
        </div>

        <div className="bio">
          Crab mentality is a metaphor for the behaviour of crabs which when caught and kept in a bucket will not allow any of the other crabs to escape. When any try to escape, the rest will pull it down. Similar behaviour has been observed in humans.   
        </div>

        <div className="bio">
          The rules of the game are simple. Every metamask wallet has exactly one entry into the crab pot. When you leave a comment on the board below, there's a 50% chance that you can win .01 eth. Once you've played, you'll have no more chances.  
        </div>

        <div className="bio">
          However, you can also use your one chance at free eth to instead block any other existing wallet -- in other words, you can take a chance at a free lunch, or you can pull another crab down with you. Choose wisely.
        </div>

        {!currentAccount && (
          <button className="connectWallet" onClick={connectWallet}>
            <b>Connect Wallet</b>
          </button>
        )}

        <input type="text" className="inputs" id="input" placeholder="Say something here for good luck" onChange={e => setMessage(e.target.value)} ></input>
        <button className="waveButton" onClick={wave}>
          Take Your Chances
        </button>

        <input type="text" className="inputs" id="input-block" placeholder="Enter Metamask wallet address here" onChange={e => setBlockedUser(e.target.value)} ></input>
        <button className="waveButton" onClick={blockUser}>
          Send Someone's Wallet to the Crab Pot
        </button>

      {allWaves.map((wave, index) => {
      if (wave.winner) {
          return (
            <div className="messages-winner">
              <div class = 'sender'>{wave.address} @ {wave.timestamp.toString().slice(0,21)} </div>
              <div>🏆 Received AirDrop 🏆</div>
              <b>{wave.message}</b>
            </div>)
      } else {
          return (
            <div className="messages">
              <div class = 'sender'>{wave.address} @ {wave.timestamp.toString().slice(0,21)} </div>
              <b>{wave.message}</b>
            </div>)
      }})}

      </div>
    </div>
  );


}

export default App
