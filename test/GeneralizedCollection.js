const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("GeneralizedCollection", function () {
  async function deployGeneralizedCollection() {

    const [owner, otherAccount] = await ethers.getSigners();

    const GeneralizedCollection = await ethers.getContractFactory("GeneralizedCollection");
    const generalizedCollection = await GeneralizedCollection.deploy();

    return { generalizedCollection, owner, otherAccount };
  }

  async function addSingleRecord() {
    key = ethers.zeroPadBytes("0x00", 32);
    const { generalizedCollection } = await loadFixture(deployGeneralizedCollection);
    await generalizedCollection.insertRecord(key);
    return {generalizedCollection, key};
  }

  async function addSingleRecordWithField() {
    const { generalizedCollection, key } = await loadFixture(addSingleRecord);
    await generalizedCollection.insertRecordField(key, 0);
    return {generalizedCollection, key};
  }

  describe("Deployment", function () {
    it("Should have a clean state", async function () {
      const { generalizedCollection } = await loadFixture(deployGeneralizedCollection);

      expect(await generalizedCollection.getRecordCount()).to.equal(0);
    });
  });

  describe("Working with single record", function () {
    
    it("Should be able to add a new record", async function () {
        const { generalizedCollection } = await loadFixture(deployGeneralizedCollection);

        expect(await generalizedCollection.getRecordCount()).to.equal(0);
        key = ethers.zeroPadBytes("0x00", 32);
        await generalizedCollection.insertRecord(key);
        expect(await generalizedCollection.getRecordCount()).to.equal(1);
        expect(await generalizedCollection.isRecord(key)).to.equal(true);
    });

    it("Should fail to add another record with the same key", async function () {
        const { generalizedCollection, key } = await loadFixture(addSingleRecord);
        await expect(generalizedCollection.insertRecord(key)).to.be.revertedWith("Key already active");
    });

    it("Should be able to add field to record", async function () {
        const { generalizedCollection, key } = await loadFixture(addSingleRecord);
        expect(await generalizedCollection.getRecordFieldKeyCount(key)).to.equal(0);
        await generalizedCollection.insertRecordField(key, 0);
        expect(await generalizedCollection.getRecordFieldKeyCount(key)).to.equal(1);
    });

    it("Should not be able to add field to non-existent record", async function () {
        const { generalizedCollection, key } = await loadFixture(addSingleRecord);
        await expect(generalizedCollection.insertRecordField(ethers.zeroPadBytes("0x01", 32), 0)).to.be.revertedWith("Key not active");
    });

    it("Should not be able to add field to record with same field key", async function () {
        const { generalizedCollection, key } = await loadFixture(addSingleRecordWithField);
        await expect(generalizedCollection.insertRecordField(key, 0)).to.be.revertedWith("Field key already active");
    });

    it("Should be able to delete field from record", async function () {
        const { generalizedCollection, key } = await loadFixture(addSingleRecordWithField);
        expect(await generalizedCollection.getRecordFieldKeyCount(key)).to.equal(1);
        await generalizedCollection.deleteRecordField(key, 0);
        expect(await generalizedCollection.getRecordFieldKeyCount(key)).to.equal(0);
    });

    it("Should be able to update field in non-existent record", async function() {
        const { generalizedCollection } = await loadFixture(deployGeneralizedCollection);
        key = ethers.zeroPadBytes("0x00", 32);

        expect(await generalizedCollection.getRecordCount()).to.equal(0);

        await generalizedCollection.updateRecordField(key, 0, key);

        expect(await generalizedCollection.getRecordCount()).to.equal(1);
        expect(await generalizedCollection.getRecordFieldKeyCount(key)).to.equal(1);
        expect(await generalizedCollection.getRecordFieldValue(key, 0)).to.equal(key);
    });

    it("Should be able to delete single record", async function () {
        const { generalizedCollection, key } = await loadFixture(addSingleRecord);
        expect(await generalizedCollection.getRecordCount()).to.equal(1);
        
        await generalizedCollection.deleteRecord(key);
        expect(await generalizedCollection.getRecordCount()).to.equal(0);
    });
  });
});
