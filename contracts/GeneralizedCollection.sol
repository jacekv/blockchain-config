// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract GeneralizedCollection {

    struct FieldStruct {
        bytes32 value;
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

    function getRecordFieldKeyCount(bytes32 key)  public view returns(uint) {
        require(isRecord(key), 'Record not active');
        return(recordStructs[key].fieldKeyList.length);
    }

    function isRecord(bytes32 key) public view returns(bool) {
        if(recordList.length == 0) return false;
        return(recordList[recordStructs[key].recordListPointer]==key);
    }

    function isRecordFieldKey(bytes32 key, uint fieldKey) public view returns(bool) {
        if(!isRecord(key)) return false;
        if(getRecordFieldKeyCount(key)==0) return false;
        return(recordStructs[key].fieldKeyList[recordStructs[key].fieldStructs[fieldKey].fieldKeyListPointer] == fieldKey);
    }

    function insertRecord(bytes32 key) public returns(bool) {
        require(!isRecord(key), 'Key already active');
        recordList.push(key);
        recordStructs[key].recordListPointer = recordList.length - 1;
        return true;
    }

    function insertRecordField(bytes32 key, uint fieldKey) public returns(bool success) {
        require(isRecord(key), 'Key not active');
        require(!isRecordFieldKey(key, fieldKey), 'Field key already active');
        recordStructs[key].fieldKeyList.push(fieldKey);
        recordStructs[key].fieldStructs[fieldKey].fieldKeyListPointer = recordStructs[key].fieldKeyList.length - 1;
        return true;
    }
       
    function updateRecordField(bytes32 key, uint fieldKey, bytes32 value) public returns(bool success) {
        if(!isRecord(key)) {
            insertRecord(key);
        }
        if(!isRecordFieldKey(key, fieldKey)){
            insertRecordField(key, fieldKey);
        }
        recordStructs[key].fieldStructs[fieldKey].value = value;
        return true;
    }
    
    
    function getRecordFieldValue(bytes32 key, uint fieldKey)  public view returns(bytes32 value) {
        require(isRecordFieldKey(key, fieldKey), 'Field key not active');
        return recordStructs[key].fieldStructs[fieldKey].value;
    }
    
    function deleteRecord(bytes32 key) public returns(bool success) {
        require(isRecord(key), 'Record not active');
        uint rowToDelete = recordStructs[key].recordListPointer;
        bytes32 keyToMove = recordList[recordList.length - 1];
        recordStructs[keyToMove].recordListPointer = rowToDelete;
        recordList[rowToDelete] = keyToMove;
        recordList.pop();
        return true;
    }
    
    function deleteRecordField(bytes32 key, uint fieldKey) public returns(bool success) {
        require(isRecordFieldKey(key, fieldKey), 'Field key not active');
        uint rowToDelete = recordStructs[key].fieldStructs[fieldKey].fieldKeyListPointer;
        uint recordFieldCount = recordStructs[key].fieldKeyList.length;
        uint keyToMove   = recordStructs[key].fieldKeyList[recordFieldCount - 1];
        recordStructs[key].fieldStructs[keyToMove].fieldKeyListPointer = rowToDelete;
        recordStructs[key].fieldKeyList[rowToDelete] = keyToMove;
        recordStructs[key].fieldKeyList.pop();
        return true;
    }  
}