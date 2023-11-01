// SPDX-License-Identifier: UNLICENSED
// taken from https://bitbucket.org/rhitchens2/soliditystoragepatterns/src/ec5997449f4d99a2357c3b134f8794a790660a59/GeneralizedCollection.sol?at=master&fileviewer=file-view-default
// Credit to Rob Hitchens

pragma solidity ^0.8.9;

contract GeneralizedCollection {

    struct FieldStruct {
        bytes32 value;
        string name;
        uint fieldKeyListPointer;
    }

    struct RecordStruct {
        mapping(uint => FieldStruct) fieldStructs;
        uint[] fieldKeyList;
        uint recordListPointer;
    }

    mapping(bytes32 => RecordStruct) private recordStructs;
    bytes32[] private recordList;

    function getRecordCount() public view returns(uint recordCount){
        return recordList.length;
    }

    function getRecordFieldKeyCount(bytes32 key) public view returns(uint) {
        require(isRecord(key), 'Record not active');
        return(recordStructs[key].fieldKeyList.length);
    }

    function isRecord(bytes32 key) public view returns(bool) {
        if(recordList.length == 0) return false;
        uint pointer = recordStructs[key].recordListPointer;
        if (pointer < recordList.length) {
            return(recordList[pointer]==key);
        }
        return false;
    }

    function isRecordFieldKey(bytes32 key, uint fieldKey) public view returns(bool) {
        if(!isRecord(key)) return false;
        if(getRecordFieldKeyCount(key)==0) return false;
        uint pointer = recordStructs[key].fieldStructs[fieldKey].fieldKeyListPointer;
        if (pointer < recordStructs[key].fieldKeyList.length) {
            return(recordStructs[key].fieldKeyList[pointer] == fieldKey);
        }
        return false;
    }

    function _insertRecord(bytes32 key) internal returns(bool) {
        require(!isRecord(key), 'Key already active');
        recordList.push(key);
        recordStructs[key].recordListPointer = recordList.length - 1;
        return true;
    }

    function _insertRecordField(bytes32 key, uint fieldKey) internal returns(bool success) {
        require(isRecord(key), 'Key not active');
        require(!isRecordFieldKey(key, fieldKey), 'Field key already active');
        recordStructs[key].fieldKeyList.push(fieldKey);
        recordStructs[key].fieldStructs[fieldKey].fieldKeyListPointer = recordStructs[key].fieldKeyList.length - 1;
        return true;
    }
       
    function _updateRecordFieldValue(bytes32 key, uint fieldKey, bytes32 value) internal returns(bool success) {
        if(!isRecord(key)) {
            _insertRecord(key);
        }
        if(!isRecordFieldKey(key, fieldKey)){
            _insertRecordField(key, fieldKey);
        }
        recordStructs[key].fieldStructs[fieldKey].value = value;
        return true;
    }
    
    function _updateRecordFieldName(bytes32 key, uint fieldKey, string memory name) internal returns(bool success) {
        if(!isRecord(key)) {
            _insertRecord(key);
        }
        if(!isRecordFieldKey(key, fieldKey)){
            _insertRecordField(key, fieldKey);
        }
        recordStructs[key].fieldStructs[fieldKey].name = name;
        return true;
    }
    
    function getRecordFieldNameAndValue(bytes32 key, uint fieldKey) public view returns(string memory name, bytes32 value) {
        require(isRecordFieldKey(key, fieldKey), 'Field key not active');
        return (recordStructs[key].fieldStructs[fieldKey].name, recordStructs[key].fieldStructs[fieldKey].value);
    }
    
    function _deleteRecord(bytes32 key) internal returns(bool success) {
        require(isRecord(key), 'Record not active');
        uint rowToDelete = recordStructs[key].recordListPointer;
        bytes32 keyToMove = recordList[recordList.length - 1];
        recordStructs[keyToMove].recordListPointer = rowToDelete;
        recordList[rowToDelete] = keyToMove;
        recordList.pop();
        return true;
    }
    
    function _deleteRecordField(bytes32 key, uint fieldKey) internal returns(bool success) {
        require(isRecordFieldKey(key, fieldKey), 'Field key not active');
        uint rowToDelete = recordStructs[key].fieldStructs[fieldKey].fieldKeyListPointer;
        uint recordFieldCount = recordStructs[key].fieldKeyList.length;
        uint keyToMove = recordStructs[key].fieldKeyList[recordFieldCount - 1];
        recordStructs[key].fieldStructs[keyToMove].fieldKeyListPointer = rowToDelete;
        recordStructs[key].fieldKeyList[rowToDelete] = keyToMove;
        recordStructs[key].fieldKeyList.pop();
        return true;
    }  
}