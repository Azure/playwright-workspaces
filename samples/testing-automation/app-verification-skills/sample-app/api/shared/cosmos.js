const { CosmosClient } = require("@azure/cosmos");
const { DefaultAzureCredential } = require("@azure/identity");

const endpoint = "https://invoice-processing-cosmos.documents.azure.com:443/";
const databaseId = "InvoiceDB";
const containerId = "Invoices";

let _container;

function getContainer() {
  if (!_container) {
    const credential = new DefaultAzureCredential();
    const client = new CosmosClient({ endpoint, aadCredentials: credential });
    _container = client.database(databaseId).container(containerId);
  }
  return _container;
}

module.exports = { getContainer };
