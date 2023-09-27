const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Config", function () {
  ONE_KEY = ethers.zeroPadValue("0x01", 32);
  TWO_KEY = ethers.zeroPadValue("0x02", 32);
  FIELD_KEY_ONE = 1;
  FIELD_KEY_TWO = 2;
  VALUE = ethers.zeroPadValue("0xdeadbeef", 32);
  VALUE_TWO = ethers.zeroPadValue("0xbeefdead", 32);

  async function deployConfig() {

    const [owner, otherAccount] = await ethers.getSigners();

    const Config = await ethers.getContractFactory("Config");
    const config = await Config.deploy();

    return { config, owner, otherAccount };
  }

  async function addSingleRecord() {
    const { config, owner, otherAccount } = await loadFixture(deployConfig);
    await config.createConfigRecord(ONE_KEY);
    return { config, owner, otherAccount };
  }

  async function addSecondRecord() {
    const { config, owner, otherAccount } = await loadFixture(addSingleRecord);
    await config.createConfigRecord(TWO_KEY);
    return { config, owner, otherAccount };
  }

  async function addValueToRecord() {
    const { config, owner, otherAccount } = await loadFixture(addSingleRecord);
    await config.updateConfigValue(ONE_KEY, FIELD_KEY_ONE, VALUE);
    return { config, owner, otherAccount };
  }

  async function addSecondValueToRecord() {
    const { config, owner, otherAccount } = await loadFixture(addValueToRecord);
    await config.updateConfigValue(ONE_KEY, FIELD_KEY_TWO, VALUE_TWO);
    return { config, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have a clean state with one record", async function () {
      const { config, owner } = await loadFixture(deployConfig);

      key = ethers.zeroPadBytes("0x00", 32);
      paddedOwnerAddress = ethers.zeroPadValue(owner.address, 32);
      expect(await config.getRecordCount()).to.equal(1);
      expect(await config.getRecordFieldKeyCount(key)).to.equal(1);
      expect(await config.getRecordFieldValue(key, key)).to.equal(paddedOwnerAddress);

      await expect(config.createConfigRecord(ethers.zeroPadBytes("0x00", 32))).to.be.revertedWith("Record already exists");
    });
  });

  describe("Testing the creation of a new record", function () {
    it("Shouldn't be able to create the zero record, since it exists already", async function () {
        const { config } = await loadFixture(deployConfig);
        await expect(config.createConfigRecord(ethers.zeroPadBytes("0x00", 32))).to.be.revertedWith("Record already exists");
    });

    it("Should be able to create a new record", async function () {
        const { config } = await loadFixture(deployConfig);
        await config.createConfigRecord(ONE_KEY);
        expect(await config.getRecordCount()).to.equal(2);
        expect(await config.isRecord(ONE_KEY)).to.be.true;
    });
  });

  describe("Testing the creation of a new field and updating", function () {
    it("Shouldn't be able to create a new field for a non-existent record with field key 0", async function () {
        const { config } = await loadFixture(deployConfig);

        fieldKey = 0;

        await expect(config.updateConfigValue(ONE_KEY, fieldKey, VALUE)).to.be.revertedWith("Field key cannot be 0");
    });

    it("Should be able to create a new field for a non-existent record", async function () {
        const { config } = await loadFixture(deployConfig);

        expect(await config.getRecordCount()).to.equal(1);
        await config.updateConfigValue(ONE_KEY, FIELD_KEY_ONE, VALUE);
        expect(await config.getRecordCount()).to.equal(2);
        expect(await config.isRecordFieldKey(ONE_KEY, FIELD_KEY_ONE)).to.be.true;
        expect(await config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.equal(VALUE);
    });

    it("Shouldn't be able to create a new field as non-owner", async function () {
        const { config, _, otherAccount } = await loadFixture(addSingleRecord);

        await expect(config.connect(otherAccount).updateConfigValue(ONE_KEY, FIELD_KEY_ONE, VALUE)).to.be.rejectedWith("Sender is not owner");
    });

    it("Update an already existing value in a record", async function () {
        const { config } = await loadFixture(addValueToRecord);

        expect(await config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.equal(VALUE);
        await config.updateConfigValue(ONE_KEY, FIELD_KEY_ONE, VALUE_TWO);
        expect(await config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.equal(VALUE_TWO);
    });
  });

  describe("Testing changing ownership of record", function () {
    it("Shouldn't be able to change ownership of non-existent record", async function () {
        const { config, otherAccount } = await loadFixture(deployConfig);

        await expect(config.changeConfigOwner(ONE_KEY, otherAccount.address)).to.be.revertedWith("Record does not exist");
    });

    it("Shouldn't be able to change ownership if you are not the oner", async function() {
        const { config, otherAccount } = await loadFixture(addSingleRecord);

        await expect(config.connect(otherAccount).changeConfigOwner(ONE_KEY, otherAccount.address)).to.be.revertedWith("Sender is not owner");
    });

    it("Should be able to change ownership if you are the owner", async function() {
        const { config, _, otherAccount } = await loadFixture(addSingleRecord);

        await config.changeConfigOwner(ONE_KEY, otherAccount.address);
        expect(await config.getRecordFieldValue(ONE_KEY, 0)).to.equal(ethers.zeroPadValue(otherAccount.address, 32));
    });
  });

  describe("Testing removal of a value from a record", function() {
    it("Shouldn't be able to remove a value from a non-existent record", async function() {
        const { config } = await loadFixture(deployConfig);

        await expect(config.deleteConfigValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Record does not exist");
    });

    it("As non-owner should not be able to remove value from record", async function() {
        const { config, _, otherAccount } = await loadFixture(addValueToRecord);

        await expect(config.connect(otherAccount).deleteConfigValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Sender is not owner");
    });

    it("Should be able to remove a value from a record", async function() {
        const { config } = await loadFixture(addValueToRecord);

        expect(await config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.equal(VALUE);
        await config.deleteConfigValue(ONE_KEY, FIELD_KEY_ONE);
        await expect(config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Field key not active");
    });

    it("Should be able to remove middle value from a record with multiple values", async function() {
        const { config } = await loadFixture(addSecondValueToRecord);

        expect(await config.getRecordFieldValue(ONE_KEY, FIELD_KEY_TWO)).to.equal(VALUE_TWO);
        await config.deleteConfigValue(ONE_KEY, FIELD_KEY_ONE);
        await expect(config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Field key not active");
        expect(await config.getRecordFieldValue(ONE_KEY, FIELD_KEY_TWO)).to.equal(VALUE_TWO);
    });
  });

  describe("Testing removal of a record", function() {
    it("Removing a record should remove all values", async function() {
        const { config } = await loadFixture(addSingleRecord);

        expect(await config.getRecordCount()).to.equal(2);
        await config.deleteConfigRecord(ONE_KEY);
        expect(await config.getRecordCount()).to.equal(1);
        expect(await config.isRecord(ONE_KEY)).to.be.false;
    });

    it("Shouldn't be able to remove a record as non-owner", async function() {
        const { config, _, otherAccount } = await loadFixture(addSingleRecord);
        
        await expect(config.connect(otherAccount).deleteConfigRecord(ONE_KEY)).to.be.revertedWith("Sender is not owner");
    });

    it("Should remove middle record with multiple records", async function() {
        const { config } = await loadFixture(addSecondRecord);

        expect(await config.getRecordCount()).to.equal(3);
        await config.deleteConfigRecord(ONE_KEY);
        expect(await config.getRecordCount()).to.equal(2);
        expect(await config.isRecord(ONE_KEY)).to.be.false;
        expect(await config.isRecord(TWO_KEY)).to.be.true;
    });

    it("Should throw error for non-existent record", async function() {
        const { config } = await loadFixture(deployConfig);

        await expect(config.deleteConfigRecord(TWO_KEY)).to.be.revertedWith("Record does not exist");
    });
  });

  describe("Test view functions", function() {
    it("Should throw error for non-existent record", async function() {
        const { config } = await loadFixture(deployConfig);

        await expect(config.getRecordFieldKeyCount(ONE_KEY)).to.be.revertedWith("Record not active");
        await expect(config.getRecordFieldValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Field key not active");
    });
  });
});
