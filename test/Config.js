const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("Config", function () {
  ONE_KEY = ethers.zeroPadValue("0x01", 32);
  TWO_KEY = ethers.zeroPadValue("0x02", 32);
  FIELD_KEY_ONE = 1;
  FIELD_KEY_TWO = 2;
  EMPTY_CONFIG_NAME = "";
  CONFIG_NAME = "config_name";
  UPDATED_CONFIG_NAME = "new_config_name";
  INIT_RECORD_NAME = "init_record_name";
  RECORD_NAME = "record_name";
  SECOND_RECORD_NAME = "second_record_name";
  UPDATED_RECORD_NAME = "new_record_name";
  VALUE = ethers.zeroPadValue("0xdeadbeef", 32);
  VALUE_TWO = ethers.zeroPadValue("0xbeefdead", 32);

  async function deployConfig() {

    const [owner, otherAccount] = await ethers.getSigners();

    const Config = await ethers.getContractFactory("Config");
    const config = await Config.deploy(INIT_RECORD_NAME);

    return { config, owner, otherAccount };
  }

  async function addSingleRecord() {
    const { config, owner, otherAccount } = await loadFixture(deployConfig);
    await config.createConfigRecord(ONE_KEY, RECORD_NAME);
    return { config, owner, otherAccount };
  }

  async function addSecondRecord() {
    const { config, owner, otherAccount } = await loadFixture(addSingleRecord);
    await config.createConfigRecord(TWO_KEY, SECOND_RECORD_NAME);
    return { config, owner, otherAccount };
  }

  async function addValueToRecord() {
    const { config, owner, otherAccount } = await loadFixture(addSingleRecord);
    await config.updateConfigValue(ONE_KEY, FIELD_KEY_ONE, CONFIG_NAME, VALUE);
    return { config, owner, otherAccount };
  }

  async function addSecondValueToRecord() {
    const { config, owner, otherAccount } = await loadFixture(addValueToRecord);
    await config.updateConfigValue(ONE_KEY, FIELD_KEY_TWO, CONFIG_NAME, VALUE_TWO);
    return { config, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should have a clean state with one record", async function () {
      const { config, owner } = await loadFixture(deployConfig);

      key = ethers.zeroPadBytes("0x00", 32);
      paddedOwnerAddress = ethers.zeroPadValue(owner.address, 32);
      expect(await config.getRecordCount()).to.equal(1);
      expect(await config.getRecordFieldKeyCount(key)).to.equal(1);
      let value = await config.getRecordFieldNameAndValue(key, key);
      expect(value[0]).to.equal("owner");
      expect(value[1]).to.equal(paddedOwnerAddress);

      await expect(config.createConfigRecord(ethers.zeroPadBytes("0x00", 32), RECORD_NAME)).to.be.revertedWith("Record already exists");
    });
  });

  describe("Testing the creation of a new record", function () {
    it("Shouldn't be able to create the zero record, since it exists already", async function () {
        const { config } = await loadFixture(deployConfig);
        await expect(config.createConfigRecord(ethers.zeroPadBytes("0x00", 32), RECORD_NAME)).to.be.revertedWith("Record already exists");
    });

    it("Should be able to create a new record", async function () {
        const { config } = await loadFixture(deployConfig);
        await config.createConfigRecord(ONE_KEY, RECORD_NAME);
        expect(await config.getRecordCount()).to.equal(2);
        expect(await config.isRecord(ONE_KEY)).to.be.true;
        let configRecord = await config.getConfigRecord(RECORD_NAME);
        expect(configRecord[0]).to.be.true;
        expect(configRecord[1]).to.equal(ONE_KEY);
    });
  });

  describe("Testing the updating of a record name", function () {
    it("Shouldn't be able to update name of non-existent record", async function () {
        const { config } = await loadFixture(deployConfig);

        await expect(config.updateRecordName(ONE_KEY, RECORD_NAME)).to.be.revertedWith("Record does not exist");
    });

    it("Shouldn't be able to update name as non-owner of record", async function () {
        const { config, otherAccount } = await loadFixture(addValueToRecord);

        await expect(config.connect(otherAccount).updateRecordName(ONE_KEY, RECORD_NAME)).to.be.revertedWith("Sender is not owner");
    });

    it("Should update name of existent record", async function () {
        const { config } = await loadFixture(addValueToRecord);

        let record = await config.getRecordName(ONE_KEY);
        expect(record).to.equal(RECORD_NAME);
        await config.updateRecordName(ONE_KEY, UPDATED_RECORD_NAME);

        record = await config.getRecordName(ONE_KEY);
        expect(record).to.equal(UPDATED_RECORD_NAME);
    });
  });

  describe("Testing the creation of a new field and updating", function () {
    it("Shouldn't be able to create a new record using the update function", async function () {
        const { config } = await loadFixture(deployConfig);

        fieldKey = 0;

        await expect(config.updateConfigValue(ONE_KEY, fieldKey, EMPTY_CONFIG_NAME, VALUE)).to.be.revertedWith("Record does not exist");
    });

    it("Shouldn't be able to create a new field as non-owner", async function () {
        const { config, _, otherAccount } = await loadFixture(addSingleRecord);

        await expect(config.connect(otherAccount).updateConfigValue(ONE_KEY, FIELD_KEY_ONE, EMPTY_CONFIG_NAME, VALUE)).to.be.rejectedWith("Sender is not owner");
    });

    it("Update an already existing value in a record without updating the name", async function () {
        const { config } = await loadFixture(addValueToRecord);

        let value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE);
        expect(value[0]).to.equal(CONFIG_NAME);
        expect(value[1]).to.equal(VALUE);
        await config.updateConfigValue(ONE_KEY, FIELD_KEY_ONE, EMPTY_CONFIG_NAME, VALUE_TWO);
        value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE); 
        expect(value[0]).to.equal(CONFIG_NAME);
        expect(value[1]).to.equal(VALUE_TWO);
    });

    it("Update an already existing value in a record with updating the name", async function () {
        const { config } = await loadFixture(addValueToRecord);

        let value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE);
        expect(value[0]).to.equal(CONFIG_NAME);
        expect(value[1]).to.equal(VALUE);
        await config.updateConfigValue(ONE_KEY, FIELD_KEY_ONE, UPDATED_CONFIG_NAME, VALUE_TWO);
        value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE); 
        expect(value[0]).to.equal(UPDATED_CONFIG_NAME);
        expect(value[1]).to.equal(VALUE_TWO);
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
        let value = await config.getRecordFieldNameAndValue(ONE_KEY, 0);
        expect(value[1]).to.equal(ethers.zeroPadValue(otherAccount.address, 32));
    });
  });

  describe("Testing updating the name of a field in the record", function() {
    it("Shouldn't be able to change name of non-existent record", async function () {
      const { config } = await loadFixture(deployConfig);

      await expect(config.updateConfigName(ONE_KEY, FIELD_KEY_ONE, UPDATED_CONFIG_NAME)).to.be.revertedWith("Record does not exist");
    });

    it("Shouldn't be able to change name of record which is owned by someone else", async function () {
      const { config, otherAccount } = await loadFixture(addSingleRecord);

      await expect(config.connect(otherAccount).updateConfigName(ONE_KEY, FIELD_KEY_ONE, UPDATED_CONFIG_NAME)).to.be.revertedWith("Sender is not owner");
    });

    it("Shouldn't be able to change name of field key 0", async function () {
      const { config } = await loadFixture(addSingleRecord);

      await expect(config.updateConfigName(ONE_KEY, 0, UPDATED_CONFIG_NAME)).to.be.revertedWith("Field key cannot be 0");
    });

    it("Update name of field in record", async function () {
      const { config } = await loadFixture(addValueToRecord);

      await config.updateConfigName(ONE_KEY, FIELD_KEY_ONE, UPDATED_CONFIG_NAME);
      let value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE);
      expect(value[0]).to.equal(UPDATED_CONFIG_NAME);
      expect(value[1]).to.equal(VALUE);
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

        let value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE);
        expect(value[1]).to.equal(VALUE);
        await config.deleteConfigValue(ONE_KEY, FIELD_KEY_ONE); 
        await expect(config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Field key not active");
    });

    it("Should be able to remove middle value from a record with multiple values", async function() {
        const { config } = await loadFixture(addSecondValueToRecord);

        let value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_TWO);
        expect(value[1]).to.equal(VALUE_TWO);
        await config.deleteConfigValue(ONE_KEY, FIELD_KEY_ONE);
        await expect(config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Field key not active");
        
        value = await config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_TWO); 
        expect(value[1]).to.equal(VALUE_TWO);
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

        // expect(await config.getRecordCount()).to.equal(3);
        // await config.deleteConfigRecord(ONE_KEY);
        // expect(await config.getRecordCount()).to.equal(2);
        // expect(await config.isRecord(ONE_KEY)).to.be.false;
        // expect(await config.isRecord(TWO_KEY)).to.be.true;
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
        await expect(config.getRecordFieldNameAndValue(ONE_KEY, FIELD_KEY_ONE)).to.be.revertedWith("Field key not active");
    });
  });
});
