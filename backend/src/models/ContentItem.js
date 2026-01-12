class ContentItem {
  constructor({
    id,
    type = "DOCUMENT",
    title,
    description = "",
    tags = [],
    author = "",
    region = "",
    projectRef = "",
    status = "PENDING",
    uploadedBy = null,
    validatedBy = null,
    validationFeedback = "",
    createdAt = null,
    validatedAt = null,
  }) {
    this.id = id;
    this.type = type; // DOCUMENT | TEMPLATE
    this.title = title;
    this.description = description;
    this.tags = tags;
    this.author = author;
    this.region = region;
    this.projectRef = projectRef;
    this.status = status; // PENDING | APPROVED | REJECTED
    this.uploadedBy = uploadedBy;
    this.validatedBy = validatedBy;
    this.validationFeedback = validationFeedback;
    this.createdAt = createdAt;
    this.validatedAt = validatedAt;
  }
}
module.exports = ContentItem;
