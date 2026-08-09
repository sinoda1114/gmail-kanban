export type InterviewPrepSnapshot = {
  projectId: string;
  interviewAt: string | null;
  updatedAt: string;
};

function isBetterPrep(
  candidate: Pick<InterviewPrepSnapshot, "interviewAt" | "updatedAt">,
  current: Pick<InterviewPrepSnapshot, "interviewAt" | "updatedAt">
): boolean {
  const candidateHasDate = candidate.interviewAt != null;
  const currentHasDate = current.interviewAt != null;

  if (candidateHasDate && !currentHasDate) return true;
  if (!candidateHasDate && currentHasDate) return false;

  if (candidateHasDate && currentHasDate) {
    return candidate.interviewAt! > current.interviewAt!;
  }

  return candidate.updatedAt > current.updatedAt;
}

export function pickBestInterviewAtByProject(
  preps: InterviewPrepSnapshot[]
): Map<string, string | null> {
  const bestByProject = new Map<string, InterviewPrepSnapshot>();

  for (const prep of preps) {
    const existing = bestByProject.get(prep.projectId);
    if (!existing || isBetterPrep(prep, existing)) {
      bestByProject.set(prep.projectId, prep);
    }
  }

  return new Map(
    [...bestByProject.entries()].map(([projectId, prep]) => [
      projectId,
      prep.interviewAt,
    ])
  );
}
