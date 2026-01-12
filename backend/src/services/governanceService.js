const contentItemService = require("./contentItemService");

async function validateContent({ id, decision, validatorUserId, feedback }) {
  if (!["APPROVED", "REJECTED"].includes(decision)) {
    throw new Error("decision must be APPROVED or REJECTED");
  }
  return contentItemService.setValidation({
    id,
    decision,
    validatedBy: validatorUserId,
    feedback,
  });
}

module.exports = { validateContent };
