# Independent review of task impact

Proposed protocol, 12 November 2026. Independent reviews have not yet been collected.

## Question

When the automated geometry screen is positive, does the user lose information required for the specified task? How frequently does the same loss occur in sampled screen-negative cases?

## Review procedure

Recruit two reviewers who did not implement the screen. Give both the same task descriptions, application versions, viewport settings and paired native/spacing screenshots. Reviewers must also replay a case when a screenshot cannot resolve recoverability. Hide screen labels and selection-method names until each reviewer has submitted their first assessment. The first author can prepare evidence and resolve technical replay failures, but does not count as an independent reviewer.

Review all 11 distinct screen-positive PDF.js settings, retaining both tasks within each setting. For screen-negative settings, select a reproducible random sample stratified by application and viewport. Report inclusion probabilities and the complete sampling seed before review begins. Review each sampled setting under both defined tasks. Retain original reviewer judgements before discussing disagreements.

Record whether task-relevant content is lost, whether the content can be recovered using an ordinary supported action, whether the specified task is reproducibly blocked, and what evidence supports each judgement. Record unknown when evidence is insufficient. Keep unknown separate from pass and fail. A geometry warning alone cannot establish task impact.

## Outcomes

Report the screen-by-human-label contingency table, disagreement counts, adjudicated recoverable cases and confirmed blocked tasks. Estimate quantities for the full matrix only with appropriate sampling weights. Distinct settings and task runs are separate reporting units. Two task observations at one setting do not establish two independent defects. Group cases into a defect family only after a replay or source-level diagnosis supports a shared cause.

For finite-pilot screening comparisons, compute uniform-random expectations exactly and retain the existing Monte Carlo output for comparison. Geometry thresholds of 0, 1, 4, 8 and 16 CSS px form a retrospective sensitivity analysis. They were chosen after the pilot and must not be described as preregistered. Freeze the chosen screen and review definitions before collecting a new application.

## Controlled extension

For a subsequent mutation benchmark, pin application versions and transformations, and confirm that each seeded change actually produces the intended loss before including it in the labelled set. Include transformations that do not impair the task as negative controls. Keep seeded faults and naturally observed problems in separate result tables. Hold out at least one application from rule development. Do not tune the selection rule on its outcomes. Measure subset execution time in actual subset runs. Human labelling, mutation runs and held-out evaluation remain planned work.
