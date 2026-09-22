export async function getSingleton(Model, defaults = {}) {
  let doc = await Model.findOne({ key: 'main' });
  if (!doc) doc = await Model.create({ key: 'main', ...defaults });
  return doc;
}
