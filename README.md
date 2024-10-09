Script to create a transaction with custom inputs and outputs.
# Usage

```
npm install
node custom-tx.js <TX_FILE> <CHANGE_ADDRESS> <FEE_RATE>
```
Example:
```
node custom-tx.js ./example-tx-file.txt bc1p4jzztyay929cczd9ut9fs9026kwugu4d0tdvlcqveam60gzahecq3aea5d 9
```
See example-tx-file.txt for an example.

The script outputs 3 things, of which you can choose one to copy-paste:
- A `bitcoin-cli` command to create the transaction
- A transaction hex
- A base64 psbt

