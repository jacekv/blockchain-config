// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./GeneralizedCollection.sol";
import "hardhat/console.sol";

contract Config is GeneralizedCollection {
    struct ConfigRecord {
        bool active;
        bytes32 key;
    }

    mapping(string => ConfigRecord) private nameToRecordStruct;

    event ConfigRecordCreated(bytes32 indexed key, address indexed owner);

    modifier recordExists(bytes32 key) {
        require(isRecord(key), "Record does not exist");
        _;
    }

    modifier onlyOwner(bytes32 key) {
        bytes32 paddedOwner = bytes32(uint256(uint160(msg.sender)));
        (string memory _fieldName, bytes32 owner, DataTypes _dataType) = getRecordFieldNameAndValue(key, 0);
        require(owner == paddedOwner, "Sender is not owner");
        _;
    }

    constructor(string memory name) {
        createConfigRecord(0, name);
    }

    /**
     * Allows the creation of a config record with a given key. The slot 0 of
     * the record is used to store the owner.
     * 
     * @param key - bytes32 key for the record to be created
     * @param name - string name for the record to be created
     */
    function createConfigRecord(bytes32 key, string memory name) public {
        require(isRecord(key) == false, "Record already exists");
        _createConfigRecord(key, name);
    }

    /**
     * Updates the name of a config record.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param name - string name for the record to be updated
     */
    function updateRecordName(bytes32 key, string memory name) recordExists(key) onlyOwner(key) public {
        _updateRecordName(key, name);
    }

    /**
     * Updates a value in a config record. If the record does not exist, it
     * won't be created.
     * The function can also be used to add a new value to a record.
     * Since the record does have a static size, the fieldKey is used to
     * determine the position of the value.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param fieldKey - uint key for the field to be updated. Can't be 0, since
     * this slot is already filled with the address of the owner.
     * @param name - string name for the field. If empty, updating the name is skipped
     * @param value - bytes32 value to be updated
     * @param dataType - DataTypes enum value for the type of the value
     */
    function updateConfigValue(bytes32 key, uint fieldKey, string calldata name, bytes32 value, DataTypes dataType) recordExists(key) onlyOwner(key) public {
        require(fieldKey != 0, "Field key cannot be 0");
        _updateRecordFieldValue(key, fieldKey, value, dataType);
        if (bytes(name).length > 0) {
            _updateRecordFieldName(key, fieldKey, name);
        }
    }

    /**
     * Updates a value in a config record. If the record does not exist, it
     * won't be created.
     * The function can also be used to add a new value to a record.
     * Since the record does have a static size, the fieldKey is used to
     * determine the position of the value.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param fieldKey - uint key for the field to be updated. Can't be 0, since
     * this slot is already filled with the address of the owner.
     * @param name - string name for the field. If empty, updating the name is skipped
     * @param value - bytes32 value to be updated
     */
    function updateConfigString(bytes32 key, uint fieldKey, string calldata name, string memory value) recordExists(key) onlyOwner(key) public {
        require(fieldKey != 0, "Field key cannot be 0");

        if (bytes(name).length > 0) {
            _updateRecordFieldName(key, fieldKey, name);
        }

        bytes memory valueBytes = bytes(value);
        // bytes memory value = bytes(test);
        uint bytes32Length = valueBytes.length / 32;
        // in case our data is excatly 32 bytes long, we do not want to
        // extract another round of data
        if (bytes32Length * 32 == valueBytes.length) {
            bytes32Length -= 1;
        }

        bytes32 extracted_value;
        for(uint i = 0; i <= bytes32Length; i++) {
            assembly {
                extracted_value := mload(add(value, mul(32,add(i, 1))))
            }
            _updateRecordFieldValue(key, fieldKey, extracted_value, DataTypes.STRING);
            fieldKey += 1;
        }
    }

    /**
     * Updates the name for a config value.
     *
     * @param key - bytes32 key for the record to be updated
     * @param fieldKey - uint key for the field to be updated. Can't be 0, since
     * this slot is already filled with the address of the owner.
     * @param name - string name for the field.
     */
    function updateConfigName(bytes32 key, uint fieldKey, string calldata name) recordExists(key) onlyOwner(key) public {
        require(fieldKey != 0, "Field key cannot be 0");
        _updateRecordFieldName(key, fieldKey, name);
    }

    /**
     * Used to change the ownership of a config record.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param newOwner - address of the new owner
     */
    function changeConfigOwner(bytes32 key, address newOwner) recordExists(key) onlyOwner(key) public {
        _updateRecordFieldValue(key, 0, bytes32(uint256(uint160(newOwner))), DataTypes.ADDRESS);
    }

    /**
     * Used to delete a value from a config record at the given fieldKey.
     * 
     * @param key - bytes32 key for the record to be updated
     * @param fieldKey - uint key for the field to be deleted
     */
    function deleteConfigValue(bytes32 key, uint fieldKey) recordExists(key) onlyOwner(key) public {
        _deleteRecordField(key, fieldKey);
    }

    /**
     * Deletes a config record.
     * 
     * @param key - bytes32 key for the record to be deleted
     */
    function deleteConfigRecord(bytes32 key) recordExists(key) onlyOwner(key) public {
        string memory recordName = getRecordName(key);
        _deleteRecord(key);
        nameToRecordStruct[recordName].active = false;
    }

    function getConfigRecord(string calldata name) public view returns (ConfigRecord memory) {
        return nameToRecordStruct[name];
    }

    function _createConfigRecord(bytes32 key, string memory name) internal {
        require(nameToRecordStruct[name].active == false, "Record with this name already exists");
        _insertRecord(key, name);
        _updateRecordFieldValue(key, 0, bytes32(uint256(uint160(msg.sender))), DataTypes.ADDRESS);
        _updateRecordFieldName(key, 0, "owner");
        nameToRecordStruct[name].active = true;
        nameToRecordStruct[name].key = key;
        emit ConfigRecordCreated(key, msg.sender);
    }
}