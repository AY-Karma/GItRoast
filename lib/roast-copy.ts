/** Classify the subject, not its length: a short precise change can still be useful. */
export function commitReviewStatus(message: string): "approved" | "changes-requested" {
  const subject = message.trim().toLowerCase();
  const filler = /^(?:(?:fix|fixed|update|updated|changes|misc|stuff|wip|temp|temporary|final|cleanup|refactor|work)(?:\s+(?:it|this|that|thing|things|stuff|again|final|really|please|more|code|bug|bugs|up|all|later))*)[.!?]*$/;
  return filler.test(subject) || subject.length <= 3 ? "changes-requested" : "approved";
}
