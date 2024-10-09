/**
 * Script to create a transaction with custom inputs and outputs.
 *
 * Usage:
 *
 * node custom-tx.js <TX_FILE> <CHANGE_ADDRESS> <FEE_RATE>
 *
 * Example:
 *
 * node custom-tx.js ./example-tx-file.txt bc1p4jzztyay929cczd9ut9fs9026kwugu4d0tdvlcqveam60gzahecq3aea5d 9
 *
 * See example-tx-file.txt for an example.
 *
 */
const fs = require('fs')
const bitcoin = require('bitcoinjs-lib')
const ecc = require('tiny-secp256k1')
bitcoin.initEccLib(ecc)
const file = process.argv[2]
const change_address = process.argv[3]
const fee_rate = parseFloat(process.argv[4])

if (!change_address) {
    console.error('Change address is required')
    process.exit(1)
}

if (!fee_rate) {
    console.error('Fee rate is required')
    process.exit(1)
}

const VBYTES_PER_INPUT = 57.5
const VBYTES_PER_OUTPUT = 43



const data = fs.readFileSync(file, 'utf8')

const [_, info] = data.trim().split('inputs')
let [inputs, outputs] = info.trim().split('outputs')

inputs = inputs.trim().split('\n').map(i => i.trim()).map(it => {
    const [utxo, amount] = it.split(' ')
    return { utxo, amount }
})
outputs = outputs.trim().split('\n').map(o => o.trim()).map(it => {
    const [address, amount] = it.split(' ')
    return { address, amount }
}).filter(it => it.address && it.amount)
console.log({ inputs, outputs })

const txSize = 10.5 + (VBYTES_PER_INPUT * inputs.length) + (VBYTES_PER_OUTPUT * (outputs.length + 1))
const fee = fee_rate * txSize
const fee_btc = fee / 1e8

const totalInputBtc = inputs.reduce((acc, i) => acc + parseFloat(i.amount), 0)
const totalOutputBtc = outputs.reduce((acc, o) => acc + parseFloat(o.amount), 0)

outputs.push({
    address: change_address,
    amount: (totalInputBtc - totalOutputBtc - fee_btc).toFixed(8)
})

const bitcoin_create = `bitcoin-cli createrawtransaction '[${inputs.map(i => `{"txid": "${i.utxo.split(':')[0]}", "vout": ${i.utxo.split(':')[1]}}`).join(', ')}]' '[${outputs.map(o => `{"${o.address}": ${o.amount}}`).join(', ')}]' 0 true`
console.log(bitcoin_create)

const tx = new bitcoin.Transaction({ network: bitcoin.networks.bitcoin })
function revBuf(hex) {
    return Buffer.from(hex, 'hex').reverse()

}
inputs.forEach(i => {
    tx.addInput(revBuf(i.utxo.split(':')[0]), parseInt(i.utxo.split(':')[1]), 0xfffffffd)
})
outputs.forEach(o => {
    tx.addOutput(bitcoin.address.toOutputScript(o.address), parseInt(parseFloat(o.amount) * 1e8))
})
console.log(tx.toHex())

const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin })
inputs.forEach(i => {
    psbt.addInput({
        hash: i.utxo.split(':')[0],
        index: parseInt(i.utxo.split(':')[1]),
        sequence: 0xfffffffd
    })
})
outputs.forEach((o, idx) => {
    psbt.addOutput({
        address: o.address,
        value: BigInt(parseInt(Math.round(parseFloat(o.amount) * 1e8)))
    })
})
console.log(psbt.toBase64())