import { useState } from "react";
import server from "./server";
import * as secp from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";
import { toHex } from "ethereum-cryptography/utils";
import { utf8ToBytes } from "ethereum-cryptography/utils";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [signature, setSignature] = useState("");
  const [recoveryBit, setRecoveryBit] = useState("");
  const [hexMessage, setHashedMessage] = useState("");


  const setValue = (setter) => (evt) => setter(evt.target.value);

  // write a function that creates a transaction hash and signs the transaction.
  async function hashAndSign() {
    try{
      const transactionMessage = {
        sender: address,
        amount: parseInt(sendAmount),
        recipient: recipient
      }

    // hash the transaction. You have to change the message to string first, then byte. After that hash it.
    const hashedMessage = keccak256(utf8ToBytes(JSON.stringify(transactionMessage)));
    const hexMessage = toHex(hashedMessage);

    //Get the hex version of hashed message. We will use it when we want to recover the public key from signature (in index.js).
    setHashedMessage(hexMessage);

    /*
    sign the message with private key. it will return an array with two elements.
    First one is signature. Get the hex version of it.
    Second one is recovery bit.
    */
    const signatureArray = await secp.sign(hexMessage, privateKey, {recovered: true});
    const signature = toHex(signatureArray[0]);
    setSignature(signature);
    const recoveryBit = signatureArray[1];
    setRecoveryBit(recoveryBit);
    }
    catch (error){
      console.log(error);
      alert(error);
    }

  }


  /* 
  create the transfer function. Sender-recipient and amount is for transaction.
  signature, recoverybit and hexmessage are for recovering the public key and verifying.
  */
  async function transfer(evt) {
    evt.preventDefault();

    try {
      const {
        data: { balance },
      } = await server.post(`send`, {
        sender: address,
        amount: parseInt(sendAmount),
        recipient,
        signature,
        recoveryBit,
        hexMessage
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  // to complete the transaction sign it first. Then get the hash and signature to complete it.
  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="button" className="button" value="Sign the transaction" onClick={hashAndSign}></input>

      <div>Your transaction hash: {hexMessage}</div>
      <div>Your signature: {signature.slice(0,4)}...{signature.slice(-4)}</div>
      <div>Your recoveryBit: {recoveryBit}</div>


      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;