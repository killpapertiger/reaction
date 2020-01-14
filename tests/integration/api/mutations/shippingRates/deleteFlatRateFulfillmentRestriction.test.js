import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import Factory from "/tests/util/factory.js";
import TestApp from "/tests/util/TestApp.js";

const DeleteFlatRateFulfillmentRestrictionMutation = importAsString("./DeleteFlatRateFulfillmentRestrictionMutation.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const internalRestrictionId = "456";
const opaqueShopId = encodeOpaqueId("reaction/shop", internalShopId); // reaction/shop:123
const opaqueRestrictionId = encodeOpaqueId("reaction/flatRateFulfillmentRestriction", internalRestrictionId);
const shopName = "Test Shop";
let deleteFlatRateFulfillmentRestriction;
let testApp;

const mockFulfillmentRestrictionData = {
  attributes: null,
  type: "allow",
  destination: {
    country: ["US"],
    postal: ["90817"],
    region: ["CA"]
  }
};

const mockFulfillmentRestriction = Factory.Restriction.makeOne({
  ...mockFulfillmentRestrictionData,
  _id: internalRestrictionId,
  shopId: internalShopId
});

const mockOwnerAccount = Factory.Account.makeOne({
  roles: {
    [internalShopId]: ["owner"]
  },
  shopId: internalShopId
});

beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();

  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.collections.FlatRateFulfillmentRestrictions.insertOne(mockFulfillmentRestriction);
  await testApp.createUserAndAccount(mockOwnerAccount);
  deleteFlatRateFulfillmentRestriction = testApp.mutate(DeleteFlatRateFulfillmentRestrictionMutation);
});

afterAll(async () => {
  await testApp.collections.Accounts.deleteMany({});
  await testApp.collections.users.deleteMany({});
  await testApp.collections.FlatRateFulfillmentRestrictions.deleteMany({});
  await testApp.collections.Shops.deleteMany({});
  await testApp.stop();
});

afterEach(async () => {
  await testApp.clearLoggedInUser();
});

test("shop owner can delete flat rate fulfillment restriction", async () => {
  let result;
  await testApp.setLoggedInUser(mockOwnerAccount);

  try {
    result = await deleteFlatRateFulfillmentRestriction({
      input: {
        shopId: opaqueShopId,
        restrictionId: opaqueRestrictionId
      }
    });
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.deleteFlatRateFulfillmentRestriction.restriction).toEqual({
    ...mockFulfillmentRestrictionData,
    _id: opaqueRestrictionId,
    shopId: opaqueShopId
  });
});

test("shop owner cannot delete flat rate fulfillment restriction if not logged in", async () => {
  try {
    await deleteFlatRateFulfillmentRestriction({
      input: {
        shopId: opaqueShopId,
        restrictionId: opaqueRestrictionId
      }
    });
  } catch (error) {
    expect(error).toMatchSnapshot();
  }
});