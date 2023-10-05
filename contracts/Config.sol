// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./GeneralizedCollection.sol";

contract Config is GeneralizedCollection {
    event ConfigRecordCreated(bytes32 indexed key, address indexed owner);

    modifier onlyOwner(bytes32 key) {
        require(isRecord(key), "Record does not exist");
        bytes32 paddedOwner = bytes32(uint256(uint160(msg.sender)));
        (string memory _fieldName, bytes32 owner) = getRecordFieldNameAndValue(key, 0);
        require(owner == paddedOwner, "Sender is not owner");
        _;
    }

    constructor() {
        createConfigRecord(0);
    }

    /**
     * Allows the creation of a config record with a given key. The slot 0 of
     * the record is used to store the owner.
     * 
     * @param key - bytes32 key for the record to be created
     */
    function createConfigRecord(bytes32 key) public {
        require(isRecord(key) == false, "Record already exists");
        _createConfigRecord(key);
    }

    /**
     * Updates a value in a config record. If the record does not exist, it
     * will be created.
     * The function can also be used to add a new value to a record.
     * Since the record does have a static size, the fieldKey is used to
     * determine the position of the value.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param fieldKey - uint key for the field to be updated. Can't be 0, since
     * this slot is already filled with the address of the owner.
     * @param value - bytes32 value to be updated
     */
    function updateConfigValue(bytes32 key, uint fieldKey, bytes32 value) public {
        require(fieldKey != 0, "Field key cannot be 0");
        if (!isRecord(key)) {
            _createConfigRecord(key);
        } else {
            bytes32 paddedOwner = bytes32(uint256(uint160(msg.sender)));
            (string memory fieldName, bytes32 owner) = getRecordFieldNameAndValue(key, 0);
            require(owner == paddedOwner, "Sender is not owner");
        }
        _updateRecordFieldValue(key, fieldKey, value);   
    }

    /**
     * Used to change the ownership of a config record.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param newOwner - address of the new owner
     */
    function changeConfigOwner(bytes32 key, address newOwner) onlyOwner(key) public {
        _updateRecordFieldValue(key, 0, bytes32(uint256(uint160(newOwner))));
    }

    /**
     * Used to delete a value from a config record at the given fieldKey.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param fieldKey - uint key for the field to be deleted
     */
    function deleteConfigValue(bytes32 key, uint fieldKey) onlyOwner(key) public {
        _deleteRecordField(key, fieldKey);
    }

    /**
     * Deletes a config record.
     * 
     * @param key - bytes32 key for the record to be deleted
     */
    function deleteConfigRecord(bytes32 key) onlyOwner(key) public {
        _deleteRecord(key);
    }

    function _createConfigRecord(bytes32 key) internal {
        _insertRecord(key);
        _updateRecordFieldValue(key, 0, bytes32(uint256(uint160(msg.sender))));
        emit ConfigRecordCreated(key, msg.sender);
    }
}