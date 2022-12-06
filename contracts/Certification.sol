// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Certification
{
    constructor() public {}
    struct Certificate
    {
        uint RollNo;
        string HashedValue;
    }
    mapping(uint=>Certificate) public certificates;
    event certificateGenerated(uint _CertificateID);
    function GenerateCertificate(uint _RollNo,string memory _HashedValue) public
    {
        uint Key = _RollNo;
        certificates[Key] = Certificate(_RollNo,_HashedValue);
        emit certificateGenerated(Key);
    }
    function RetrieveData(uint _id)public view returns(uint,string memory)
    {
        uint Key = _id;
        Certificate memory retrieved = certificates[Key];
        return (retrieved.RollNo,retrieved.HashedValue);
    }
 
}
