const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
  try {
    const container = getContainer();

    if (req.method === "GET") {
      const { resources } = await container.items
        .query("SELECT * FROM c ORDER BY c.lastUpdated DESC")
        .fetchAll();
      context.res = { status: 200, body: resources, headers: { "Content-Type": "application/json" } };
    } else if (req.method === "POST") {
      const invoice = req.body;
      const { resource } = await container.items.create(invoice);
      context.res = { status: 201, body: resource, headers: { "Content-Type": "application/json" } };
    }
  } catch (err) {
    context.log.error("Invoice operation failed:", err.message);
    context.res = { status: 500, body: { error: err.message }, headers: { "Content-Type": "application/json" } };
  }
};
