const ContentItem = require("./ContentItem");

class Template extends ContentItem {
  constructor(props) {
    super({ ...props, type: "TEMPLATE" });
  }
}
module.exports = Template;
