const ContentItem = require("./ContentItem");

class Document extends ContentItem {
  constructor(props) {
    super({ ...props, type: "DOCUMENT" });
  }
}
module.exports = Document;
