const { getContainer } = require("../shared/cosmos");

module.exports = async function (context, req) {
  try {
    const id = context.bindingData.id;
    const invoice = req.body;
    const container = getContainer();
    const { resource } = await container.item(id, id).replace(invoice);
    context.res = { status: 200, body: resource, headers: { "Content-Type": "application/json" } };
  } catch (err) {
    context.log.error("Invoice update failed:", err.message);
    context.res = { status: 500, body: { error: err.message }, headers: { "Content-Type": "application/json" } };
  }
};
