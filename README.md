# Blockchain Config

If you are working on different blockchains, you can use this repository to store your configuration values
for each blockchain, instead of maintaining those in different configurations files.

This allows you to easily switch between different blockchains, without having to change your configuration files.

## How to use

In order to create a new configuration record, you will have to call the
`function createConfigRecord(bytes32 key) public` function, where the keys can
be any value you want.

To add a value to a record, you use the `function updateConfigValue(bytes32 key, uint fieldKey, bytes32 value) public`
function. The key has to be the same as used during the call to `createConfigRecord`.

The `fieldKey` is used to identify the value you want to update. The value can
be anything greater than 0, since the slot 0 is used to store you address as owner of the record.
The `value` is the new value you want to set.

More information are going to follow :) If you need more, check out the code and the tests.

# Locations

## Testnet

### Polygon

Address: 0xA69e982Cc0da62e908181Ad212FdC50038C57417

### Fantom

Address: 0xA69e982Cc0da62e908181Ad212FdC50038C57417

### Goerli

Address: 0xA69e982Cc0da62e908181Ad212FdC50038C57417