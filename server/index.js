const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex } = require("ethereum-cryptography/utils");


app.use(cors());
app.use(express.json());

const balances = {
  "0x5884e38c24ff6fe5a7a8101d47435935352640cc": 100,
  "0x5294e468946b96a87321163ebfc09902a2044435": 50,
  "0xd582ff290275c474696cd6b50310d8e77cda655f": 75,
};

const privateKeys = {
  "0x5884e38c24ff6fe5a7a8101d47435935352640cc": "ffb35b817e52041192b6ba8f6734b0e28d3b4c948cf4a82837aa27c0962a0649",
  "0x5294e468946b96a87321163ebfc09902a2044435": "6d4969494ee2019047a7d4cdb9ee8274dae7832e916d54a5bcd445c3c8b5eb31",
  "0xd582ff290275c474696cd6b50310d8e77cda655f": "f63f316b3431a5299ea4e222d7dcecf3ebe919f55eb8e94a9914cd5ced77ca09"
}

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  const privateKey = privateKeys[address];
  res.send({ balance, privateKey });
});

app.post("/send", async (req, res) => {

  try {

  const { signature, hexMessage, recoveryBit, sender, recipient, amount } = req.body;

  // get signature, hash and recovery bit from client-sideand recover the address from signature

  const signaturePublicKey = secp.recoverPublicKey(hexMessage, signature, recoveryBit);
  const signatureAddressNotHex = keccak256(signaturePublicKey.slice(1)).slice(-20);
  const signatureAddress = "0x" + toHex(signatureAddressNotHex);
  

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } 
  else if (signatureAddress !== sender) {
    res.status(400).send({message: "You are not the person!"})
  }
  else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
} catch(error){
  console.log(error);
}
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}
